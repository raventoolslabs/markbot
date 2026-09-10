export interface Document {
    id: string;
    name: string;
    originalName: string;
    creationDate: Date;
    metadata: Record<string, unknown>;
}
