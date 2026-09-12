import React from 'react';
import { WarningIcon, SpinnerIcon } from './Icons';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full p-6 border border-line transform transition-all">
                <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                    <WarningIcon className="w-6 h-6" />
                    <h3 className="text-lg font-bold">{title}</h3>
                </div>

                <p className="text-ink-mute mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                                Processing...
                            </>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
