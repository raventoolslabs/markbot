'use client';

import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CloseIcon, SpinnerIcon } from './Icons';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

export const UploadModal = ({ isOpen, onClose, onUploadSuccess }: UploadModalProps) => {
    const { t } = useLanguage();
    const { authFetch } = useAuth();
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
            const response = await authFetch('/api/document', {
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
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-ink">{t.upload.title}</h2>
                    <button
                        onClick={onClose}
                        className="text-ink-mute hover:text-ink"
                    >
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-ink-soft mb-2">
                        {t.upload.selectLabel}
                    </label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-brand file:text-brand-ink
              hover:file:bg-brand-deep
              file:transition-colors file:duration-200
              file:cursor-pointer
              
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
                        className="px-4 py-2 text-ink-soft bg-surface-2 rounded-xl hover:bg-line transition-colors"
                        disabled={isUploading}
                    >
                        {t.upload.cancel}
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className={`px-4 py-2 text-brand-ink rounded-xl transition-colors flex items-center gap-2
              ${!file || isUploading
                                ? 'bg-brand/50 cursor-not-allowed'
                                : 'bg-brand hover:bg-brand-deep shadow-md'
                            }
            `}
                    >
                        {isUploading && (
                            <SpinnerIcon className="animate-spin h-4 w-4 text-brand-ink" />
                        )}
                        {isUploading ? t.upload.uploading : t.upload.upload}
                    </button>
                </div>
            </div>
        </div>
    );
};
