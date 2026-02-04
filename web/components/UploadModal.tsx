'use client';

import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

export const UploadModal = ({ isOpen, onClose, onUploadSuccess }: UploadModalProps) => {
    const { t } = useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError(t.upload.selectFileError);
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/document', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t.upload.error);
            }

            // Reset and close on success
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            onUploadSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || t.upload.error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t.upload.title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t.upload.selectLabel}
                    </label>
                    <input
                        type="file"
                        accept=".md,.zip,application/zip,application/x-zip-compressed"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-600 file:text-white
              hover:file:bg-emerald-700
              file:transition-colors file:duration-200
              file:cursor-pointer
              dark:file:bg-emerald-600 dark:file:hover:bg-emerald-700
            "
                    />
                </div>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                        disabled={isUploading}
                    >
                        {t.upload.cancel}
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className={`px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2
              ${!file || isUploading
                                ? 'bg-emerald-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-md'
                            }
            `}
                    >
                        {isUploading && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isUploading ? t.upload.uploading : t.upload.upload}
                    </button>
                </div>
            </div>
        </div>
    );
};
