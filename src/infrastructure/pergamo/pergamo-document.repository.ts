import { config } from '@/app/config';
import { DocumentFile, DocumentRepository } from '@/app/ports/repositories/document.repository';
import { Document } from '@/domain/entities/Document';
import { DocumentChunk } from '@/domain/entities/DocumentChunk';
import { SearchResult } from '@/domain/entities/SearchResult';
import { ExternalServiceException } from '@/domain/exceptions/ExternalServiceException';

// Holgado: una subida pasa por el antivirus de Pergamo antes de responder.
const REQUEST_TIMEOUT_MS = 60_000;

type PergamoMetadata = Record<string, unknown> & {
    uuid: string;
    name: string;
    original_name: string;
    creation_date: string;
};

interface PergamoChunk {
    chunk_id: number;
    content: string;
    page: number | null;
    section: string | null;
    heading_path: string[];
    length: number;
}

interface PergamoSearchHit {
    document_id: string;
    content: string;
    page: number | null;
    section: string | null;
    heading_path: string[];
    similarity: number;
}

interface RequestOptions {
    method?: string;
    json?: unknown;
    form?: FormData;
}

// El trigger de Pergamo guarda creation_date como epoch en ms pasado por TO_CHAR (" 1757000000000.").
const toDocument = (metadata: PergamoMetadata): Document => ({
    id: metadata.uuid,
    name: metadata.name,
    originalName: metadata.original_name,
    creationDate: new Date(parseFloat(String(metadata.creation_date).trim().replace(',', '.'))),
    metadata,
});

// Pergamo responde los errores como { statusCode, error, code? }.
const errorMessage = async (response: Response): Promise<string> => {
    const body = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    return body?.error ?? `Pergamo responded ${response.status}`;
};

export class PergamoDocumentRepository implements DocumentRepository {
    private token?: Promise<string>;

    constructor(
        private baseUrl: string,
        private organization: string,
        private password: string,
    ) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async search(query: string, limit: number): Promise<SearchResult[]> {
        const body = await this.request<{ results: PergamoSearchHit[] }>('/search', {
            method: 'POST',
            json: { query, limit },
        });

        return body.results.map((hit) => ({
            documentId: hit.document_id,
            content: hit.content,
            page: hit.page ?? undefined,
            section: hit.section ?? undefined,
            headingPath: hit.heading_path,
            similarity: hit.similarity,
        }));
    }

    async list(): Promise<Document[]> {
        // ponytail: solo la primera página de Pergamo; paginar cuando el fondo no quepa
        const body = await this.request<{ documents: { metadata: PergamoMetadata }[] }>('/document?limit=100');
        return body.documents.map((doc) => toDocument(doc.metadata));
    }

    async getById(id: string): Promise<Document | undefined> {
        try {
            return toDocument(await this.request<PergamoMetadata>(`/document/${encodeURIComponent(id)}`));
        } catch (error) {
            if (error instanceof ExternalServiceException && error.status === 404) return undefined;
            throw error;
        }
    }

    async getChunks(id: string): Promise<DocumentChunk[]> {
        // ponytail: los 50 primeros trozos, el tope por página de Pergamo
        const body = await this.request<{ chunks: PergamoChunk[] }>(`/document/${encodeURIComponent(id)}/chunks?limit=50`);

        return body.chunks.map((chunk) => ({
            id: chunk.chunk_id,
            content: chunk.content,
            page: chunk.page ?? undefined,
            section: chunk.section ?? undefined,
            headingPath: chunk.heading_path,
            length: chunk.length,
        }));
    }

    async upload(file: DocumentFile): Promise<Document> {
        const form = new FormData();
        form.append('document', new Blob([new Uint8Array(file.buffer)], { type: file.mimeType }), file.originalName);

        return toDocument(await this.request<PergamoMetadata>('/document?index=true', { method: 'POST', form }));
    }

    async delete(id: string): Promise<void> {
        await this.request(`/document/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    private async request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
        const tokenPromise = this.getToken();
        // Pergamo espera el JWT a secas, sin "Bearer".
        const headers: Record<string, string> = { Authorization: await tokenPromise };

        if (options.json !== undefined) headers['Content-Type'] = 'application/json';

        const response = await this.send(path, {
            method: options.method ?? 'GET',
            headers,
            body: options.form ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined),
        });

        // El token caduca a las 8h: se renueva una vez y se reintenta.
        if (response.status === 401 && !retried) {
            if (this.token === tokenPromise) this.token = undefined;
            return this.request<T>(path, options, true);
        }

        if (!response.ok) throw new ExternalServiceException(await errorMessage(response), response.status);

        return (await response.json()) as T;
    }

    // Una sola promesa compartida: Pergamo admite 10 logins cada 15 min por IP.
    private getToken(): Promise<string> {
        if (!this.token) {
            this.token = this.login().catch((error) => {
                this.token = undefined;
                throw error;
            });
        }

        return this.token;
    }

    private async login(): Promise<string> {
        const response = await this.send('/organization/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: this.organization, password: this.password }),
        });

        // Un login rechazado es configuración de markbot, no culpa del usuario: sale como 502.
        if (!response.ok) throw new ExternalServiceException(`Pergamo login failed: ${await errorMessage(response)}`, 502);

        return ((await response.json()) as { token: string }).token;
    }

    private async send(path: string, init: Parameters<typeof fetch>[1]): Promise<Response> {
        try {
            return await fetch(`${this.baseUrl}${path}`, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        } catch (error) {
            throw new ExternalServiceException(`Pergamo unreachable: ${(error as Error).message}`, 502);
        }
    }
}

export const pergamoDocumentRepository = new PergamoDocumentRepository(
    config.pergamo.url,
    config.pergamo.organization,
    config.pergamo.password,
);
