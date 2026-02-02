'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';

interface DocumentChunk {
    id: string;
    content: string;
    metadata: any;
}

interface DocumentDetail {
    id: string;
    path: string;
    organization: string;
    creation_date: string;
    metadata: any;
    chunks: DocumentChunk[];
}

export default function DocumentDetailPage() {
    const { t } = useLanguage();
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
            const response = await fetch(`/api/vector/documents/${id}`);
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
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen font-[family-name:var(--font-geist-sans)] bg-white dark:bg-gray-950 transition-colors duration-300">
            <Header />
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
            <Footer />
        </div>
    );

    if (error) return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen font-[family-name:var(--font-geist-sans)] bg-white dark:bg-gray-950 transition-colors duration-300">
            <Header />
            <div className="p-8 text-center text-red-600">Error: {error}</div>
            <Footer />
        </div>
    );

    if (!document) return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen font-[family-name:var(--font-geist-sans)] bg-white dark:bg-gray-950 transition-colors duration-300">
            <Header />
            <div className="p-8 text-center dark:text-gray-300">{t.documents.notFound}</div>
            <Footer />
        </div>
    );

    return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen font-[family-name:var(--font-geist-sans)] bg-white dark:bg-gray-950 transition-colors duration-300">
            <Header />

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <Link href="/documents" className="flex items-center text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 mb-4 transition-colors font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {t.documents.backToDocs}
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 break-all">{document.path}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    {document.organization}
                                </span>
                                <span className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(document.creation_date).toLocaleString()}
                                </span>
                                <span className="font-mono text-xs opacity-70">ID: {document.id}</span>
                            </div>
                        </div>
                    </div>

                    {document.metadata && Object.keys(document.metadata).length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-8">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase text-xs tracking-wider">{t.documents.metadata}</h3>
                            <pre className="bg-white dark:bg-black/20 p-3 rounded-lg text-xs overflow-auto font-mono text-gray-600 dark:text-gray-400">
                                {JSON.stringify(document.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.documents.chunks}</h2>
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded-full">
                        {document.chunks?.length || 0}
                    </span>
                </div>

                <div className="space-y-4">
                    {document.chunks?.map((chunk, index) => (
                        <div key={chunk.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded">
                                        {t.documents.chunk} #{index + 1}
                                    </span>
                                    {chunk.metadata?.page && (
                                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700">
                                            {t.documents.page} {chunk.metadata.page}
                                        </span>
                                    )}
                                </div>
                                {chunk.metadata?.section && (
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold px-2.5 py-1 rounded text-wrap break-words">
                                        {chunk.metadata.section}
                                    </span>
                                )}
                            </div>
                            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-black/20 p-4 rounded-lg border border-gray-100 dark:border-gray-800/50 overflow-auto">
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
