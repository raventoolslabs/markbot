'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeftIcon, BuildingIcon, CalendarIcon } from '@/components/Icons';

interface DocumentChunk {
    id: string;
    content: string;
    metadata: any;
}

interface DocumentDetail {
    id: string;
    path: string;
    organization: string;
    creationDate: string;
    metadata: any;
    chunks: DocumentChunk[];
}

export default function DocumentDetailPage() {
    const { t } = useLanguage();
    const { authFetch } = useAuth();
    const params = useParams();
    const [document, setDocument] = useState<DocumentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchDocument(params.id as string);
        }
    }, [params.id]);

    const fetchDocument = async (id: string) => {
        try {
            const response = await authFetch(`/api/document/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch document details');
            }
            const data = await response.json();
            setDocument(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-canvas transition-colors duration-300">
            <Header />
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
            <Footer />
        </div>
    );

    if (error) return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-canvas transition-colors duration-300">
            <Header />
            <div className="p-8 text-center text-red-600">Error: {error}</div>
            <Footer />
        </div>
    );

    if (!document) return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-canvas transition-colors duration-300">
            <Header />
            <div className="p-8 text-center text-ink-soft">{t.documents.notFound}</div>
            <Footer />
        </div>
    );

    return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-canvas transition-colors duration-300">
            <Header />

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <Link href="/documents" className="flex items-center text-brand hover:text-brand-deep mb-4 transition-colors font-medium">
                        <ArrowLeftIcon className="h-5 w-5 mr-1" />
                        {t.documents.backToDocs}
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-ink mb-2 break-all">{document.path}</h1>
                            <div className="flex items-center gap-4 text-sm text-ink-mute">
                                <span className="flex items-center gap-1 bg-surface-2 px-3 py-1 rounded-full">
                                    <BuildingIcon className="h-4 w-4" />
                                    {document.organization}
                                </span>
                                <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" />
                                    {new Date(document.creationDate).toLocaleString()}
                                </span>
                                <span className="font-mono text-xs opacity-70">ID: {document.id}</span>
                            </div>
                        </div>
                    </div>

                    {document.metadata && Object.keys(document.metadata).length > 0 && (
                        <div className="bg-surface-2 border border-line rounded-xl p-4 mb-8">
                            <h3 className="font-bold text-ink-soft mb-2 uppercase text-xs tracking-wider">{t.documents.metadata}</h3>
                            <pre className="bg-white dark:bg-black/20 p-3 rounded-lg text-xs overflow-auto font-mono text-ink-mute">
                                {JSON.stringify(document.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-line">
                    <h2 className="text-2xl font-bold text-ink">{t.documents.chunks}</h2>
                    <span className="bg-brand/15 text-brand text-xs font-bold px-2 py-1 rounded-full">
                        {document.chunks?.length || 0}
                    </span>
                </div>

                <div className="space-y-4">
                    {document.chunks?.map((chunk, index) => (
                        <div key={chunk.id} className="border border-line rounded-xl p-6 shadow-sm bg-surface hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded">
                                        {t.documents.chunk} #{index + 1}
                                    </span>
                                    {chunk.metadata?.page && (
                                        <span className="bg-surface-2 text-ink-mute text-xs font-medium px-2.5 py-1 rounded border border-line">
                                            {t.documents.page} {chunk.metadata.page}
                                        </span>
                                    )}
                                    {chunk.metadata?.chunk_size && (
                                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium px-2.5 py-1 rounded border border-purple-200 dark:border-purple-700">
                                            {chunk.metadata.chunk_size} chars
                                        </span>
                                    )}
                                </div>
                                {chunk.metadata?.section && (
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold px-2.5 py-1 rounded text-wrap break-words">
                                        {chunk.metadata.section}
                                    </span>
                                )}
                            </div>
                            <div className="prose dark:prose-invert max-w-none text-ink-soft text-sm leading-relaxed bg-gray-50 dark:bg-black/20 p-4 rounded-lg border border-line/50 overflow-auto">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {chunk.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
