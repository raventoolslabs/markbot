'use client';

import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import { ApiKeyManager } from '@/components/ApiKeyManager';

export default function ProfilePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-emerald-600 dark:text-emerald-400 font-medium">Loading...</div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* User Profile Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="md:flex">
                            <div className="md:shrink-0 p-8 flex justify-center items-center bg-emerald-50 dark:bg-emerald-900/20">
                                {user.picture ? (
                                    <img
                                        className="h-32 w-32 object-cover rounded-full border-4 border-emerald-500 shadow-sm"
                                        src={user.picture}
                                        alt={user.name}
                                    />
                                ) : (
                                    <div className="h-32 w-32 rounded-full bg-emerald-200 flex items-center justify-center text-4xl text-emerald-700 font-bold border-4 border-emerald-500">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="p-8 w-full">
                                <div className="uppercase tracking-wide text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">User Profile</div>
                                <h1 className="block mt-1 text-2xl leading-tight font-bold text-gray-900 dark:text-white capitalize">{user.name}</h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-300">{user.email}</p>

                                <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white truncate font-mono bg-gray-50 dark:bg-gray-900/50 p-1 rounded" title={user.id}>{user.id}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* API Key Manager */}
                    <ApiKeyManager />
                </div>
            </main>
            <Footer />
        </div>
    );
}
