'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UploadModal } from '@/components/UploadModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { useLanguage } from '@/context/LanguageContext';

interface Document {
    id: string;
    path: string;
    organization: string;
    creation_date: string;
    metadata: any;
}

export default function DocumentsPage() {
    const { t } = useLanguage();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/vector/documents');
            if (!response.ok) {
                throw new Error('Failed to fetch documents');
            }
            const data = await response.json();
            setDocuments(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        fetchDocuments();
    };

    const handleDeleteClick = (doc: Document) => {
        setDocumentToDelete(doc);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!documentToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/vector/documents/${documentToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            // Success
            setIsDeleteModalOpen(false);
            setDocumentToDelete(null);
            fetchDocuments(); // Refresh list
        } catch (err: any) {
            alert(t.delete.error); // Simple feedback for error
            console.error(err);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen font-[family-name:var(--font-geist-sans)] bg-white dark:bg-gray-950 transition-colors duration-300">
            <Header />

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.documents.title}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{t.documents.subtitle}</p>
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow transition-colors flex items-center gap-2 font-medium"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {t.documents.uploadButton}
                    </button>
                </div>

                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
                        <p className="font-bold">{t.documents.error}</p>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && documents.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <div className="text-gray-400 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{t.documents.noDocuments}</p>
                    </div>
                )}

                {!loading && !error && documents.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t.documents.filename}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                                        {t.documents.organization}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t.documents.date}
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">

                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg mr-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">{doc.path}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500 font-mono hidden sm:block">ID: {doc.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                                                {doc.organization}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(doc.creation_date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link
                                                    href={`/documents/${doc.id}`}
                                                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium transition-colors"
                                                >
                                                    {t.documents.viewDetails}
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteClick(doc)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    title={t.delete.title}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            <Footer />

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                title={t.delete.title}
                message={t.delete.warning}
                confirmText={t.delete.confirm}
                cancelText={t.delete.cancel}
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                isLoading={isDeleting}
            />
        </div>
    );
}
