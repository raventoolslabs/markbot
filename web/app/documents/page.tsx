'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UploadModal } from '@/components/UploadModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { UploadIcon, DocumentIcon, EyeIcon, TrashIcon } from '@/components/Icons';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface Document {
    id: string;
    path: string;
    organization: string;
    creationDate: string;
    metadata: any;
}

export default function DocumentsPage() {
    const { t } = useLanguage();
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push('/');
        }
    }, [user, isAuthLoading, router]);

    useEffect(() => {
        if (user) {
            fetchDocuments();
        }
    }, [user]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/document/list');
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
            const response = await fetch(`/api/document/${documentToDelete.id}`, {
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

    if (isAuthLoading) {
        return (
            <div className="grid grid-rows-[auto_1fr_auto] min-h-screen font-[family-name:var(--font-geist-sans)] bg-white dark:bg-gray-950 transition-colors duration-300">
                <Header />
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

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
                        <UploadIcon className="h-5 w-5" />
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
                            <DocumentIcon className="h-16 w-16 mx-auto" strokeWidth={1} />
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
                                                    <DocumentIcon className="h-6 w-6" strokeWidth={2} />
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
                                            {format(new Date(doc.creationDate), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link
                                                    href={`/documents/${doc.id}`}
                                                    className="text-gray-400 hover:text-emerald-600 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    title={t.documents.viewDetails}
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteClick(doc)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    title={t.delete.title}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
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
