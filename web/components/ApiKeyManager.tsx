'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    expirationDate: string | null;
    domain: string | null;
    createdAt: string;
}

export const ApiKeyManager = () => {
    const { token } = useAuth();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newKeyData, setNewKeyData] = useState<{ name: string; expirationDate: string; domain: string }>({ name: '', expirationDate: '', domain: '' });
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            fetchKeys();
        }
    }, [token]);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/keys', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setKeys(data);
            }
        } catch (error) {
            console.error('Failed to fetch keys', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newKeyData)
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedKey(data.keySecret);
                setKeys(prev => [data.apiKey, ...prev]);
                setNewKeyData({ name: '', expirationDate: '', domain: '' });
                // Don't close modal yet, show the key
            }
        } catch (error) {
            console.error('Failed to create key', error);
        }
    };

    const handleDeleteKey = async (id: string) => {
        if (!confirm('Are you sure you want to delete this API Key? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/keys/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setKeys(prev => prev.filter(k => k.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete key', error);
        }
    };

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Generate New Key
                </button>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                ) : keys.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No API keys found. Generate one to get started.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prefix</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Domain</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiration</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {keys.map(key => (
                                    <tr key={key.id}>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{key.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">{key.prefix}...</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{key.domain || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {key.expirationDate ? format(new Date(key.expirationDate), 'MMM d, yyyy') : 'Never'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(key.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteKey(key.id)}
                                                className="text-red-600 hover:text-red-900 dark:hover:text-red-400 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Result Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        {generatedKey ? (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                        <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Key Generated</h3>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Please copy your API key now. You won't be able to see it again!
                                    </p>
                                </div>
                                <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                                    <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm break-all">{generatedKey}</code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(generatedKey)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                                        title="Copy to clipboard"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setGeneratedKey(null);
                                        setIsCreateModalOpen(false);
                                    }}
                                    className="w-full mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateKey} className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create API Key</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newKeyData.name}
                                        onChange={e => setNewKeyData({ ...newKeyData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="My App Key"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={newKeyData.expirationDate}
                                        onChange={e => setNewKeyData({ ...newKeyData, expirationDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domain Restriction (Optional)</label>
                                    <input
                                        type="text"
                                        value={newKeyData.domain}
                                        onChange={e => setNewKeyData({ ...newKeyData, domain: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="example.com"
                                    />
                                </div>
                                <div className="flex gap-3 justify-end mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Create Key
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
