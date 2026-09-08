'use client';

import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, Fragment } from 'react';
import Cookies from 'js-cookie';
import { Dialog, Transition } from '@headlessui/react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import { ApiKeyManager } from '@/components/ApiKeyManager';
import { useLanguage } from '@/context/LanguageContext';
import { UserIcon, LockIcon, KeyIcon, SpinnerIcon, CheckIcon, XIcon, EditIcon, CheckStrokeIcon, WarningIcon } from '@/components/Icons';

function ProfileContent() {
    const { user, isLoading, updateUser, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();

    // Default to 'account' tab or from query param
    const [activeTab, setActiveTab] = useState<'account' | 'api' | 'security'>('account');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'api' || tab === 'account' || tab === 'security') {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 2FA State
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [setupSecret, setSetupSecret] = useState<string | null>(null);
    const [setupCode, setSetupCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
    const [is2faSetupOpen, setIs2faSetupOpen] = useState(false);

    // Disable 2FA State
    const [isDisable2faOpen, setIsDisable2faOpen] = useState(false);
    const [disableCode, setDisableCode] = useState('');
    const [isDisabling2fa, setIsDisabling2fa] = useState(false);
    const [disable2faError, setDisable2faError] = useState('');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        } else if (user) {
            setName(user.name);
        }
    }, [user, isLoading, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error('Failed to update profile');

            const data = await res.json();
            updateUser(data.user);
            setIsEditing(false);
            setPreviewImage(null);
            setSelectedFile(null);
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsDeleting(true);
        try {
            const token = Cookies.get('token');
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to delete account');

            logout();
            router.push('/');
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete account');
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const start2faSetup = async () => {
        try {
            const token = Cookies.get('token');
            const res = await fetch('/api/auth/2fa/enable/start', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to start 2FA setup');
            const data = await res.json();
            setQrCodeUrl(data.qrCodeUrl);
            setSetupSecret(data.secret);
            setIs2faSetupOpen(true);
        } catch (error) {
            console.error('2FA start error', error);
            alert(t.profile.security.twoFactor.setupError);
        }
    };

    const complete2faSetup = async () => {
        try {
            const token = Cookies.get('token');
            const res = await fetch('/api/auth/2fa/enable/complete', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: setupCode })
            });

            if (!res.ok) throw new Error('Failed to verify 2FA code');

            const data = await res.json();
            setRecoveryCodes(data.recovery_codes);
            setIs2faSetupOpen(false);
            setSetupCode('');
            // Update user context
            if (user) updateUser({ ...user, two_factor_enabled: true });
        } catch (error) {
            console.error('2FA complete error', error);
            alert(t.profile.security.twoFactor.verifyError);
        }
    };

    const disable2fa = async () => {
        setDisable2faError('');
        setIsDisabling2fa(true);
        try {
            const token = Cookies.get('token');
            if (!disableCode) {
                setDisable2faError(t.profile.security.twoFactor.disableError);
                setIsDisabling2fa(false);
                return;
            }

            const payload: any = {};
            if (disableCode.length === 6 && !isNaN(Number(disableCode))) {
                payload.code = disableCode;
            } else {
                payload.password = disableCode;
            }

            const res = await fetch('/api/auth/2fa/disable', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to disable 2FA');

            if (user) updateUser({ ...user, two_factor_enabled: false });
            setIsDisable2faOpen(false);
            setDisableCode('');
            // Optional: you could add a success toast here instead of alert
        } catch (error) {
            console.error('Disable 2FA error', error);
            setDisable2faError(t.profile.security.twoFactor.disableError);
        } finally {
            setIsDisabling2fa(false);
        }
    };

    const regenerateRecoveryCodes = async () => {
        if (!confirm(t.profile.security.twoFactor.regenerateConfirm)) return;
        try {
            const token = Cookies.get('token');
            const res = await fetch('/api/auth/2fa/recovery-codes', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to regenerate codes');
            const data = await res.json();
            setRecoveryCodes(data.recovery_codes);
        } catch (error) {
            console.error('Regenerate error', error);
            alert(t.profile.security.twoFactor.regenerateError);
        }
    };

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
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar Navigation */}
                        <aside className="w-full md:w-64 shrink-0">
                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveTab('account')}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'account'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                                        }`}
                                >
                                    <UserIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    {t.profile.tabs.account}
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'security'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                                        }`}
                                >
                                    <LockIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    {t.profile.tabs.security}
                                </button>
                                <button
                                    onClick={() => setActiveTab('api')}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'api'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                                        }`}
                                >
                                    <KeyIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    {t.profile.tabs.api}
                                </button>
                            </nav>
                        </aside>

                        {/* Content Area */}
                        <div className="flex-grow space-y-6">
                            {activeTab === 'account' && (
                                <>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
                                        <div className="md:flex">
                                            <div className="md:shrink-0 p-8 flex flex-col justify-center items-center bg-emerald-50 dark:bg-emerald-900/20 gap-4">
                                                <div className="relative group">
                                                    {previewImage || user.picture ? (
                                                        <img
                                                            className="h-32 w-32 object-cover rounded-full border-4 border-emerald-500 shadow-sm"
                                                            src={previewImage || user.picture}
                                                            alt={user.name}
                                                        />
                                                    ) : (
                                                        <div className="h-32 w-32 rounded-full bg-emerald-200 flex items-center justify-center text-4xl text-emerald-700 font-bold border-4 border-emerald-500">
                                                            {name.charAt(0)}
                                                        </div>
                                                    )}
                                                    {isEditing && (
                                                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-white text-sm font-medium">{t.profile.account.changePhoto}</span>
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-8 w-full">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-full mr-4">
                                                        <div className="uppercase tracking-wide text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">{t.profile.account.title}</div>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={name}
                                                                onChange={(e) => setName(e.target.value)}
                                                                className="mt-1 block w-full px-0 py-0 bg-transparent border-b-2 border-emerald-500 text-2xl leading-tight font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors rounded-none placeholder-gray-400"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <h1 className="block mt-1 text-2xl leading-tight font-bold text-gray-900 dark:text-white capitalize truncate h-[34px] flex items-center">{user.name}</h1>
                                                        )}
                                                        <p className="mt-2 text-gray-600 dark:text-gray-300">{user.email}</p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    onClick={handleSave}
                                                                    disabled={isSaving}
                                                                    className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                                                    title={t.profile.account.save}
                                                                >
                                                                    {isSaving ? (
                                                                        <SpinnerIcon className="animate-spin h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                                    ) : (
                                                                        <CheckIcon />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setIsEditing(false);
                                                                        setName(user.name);
                                                                        setPreviewImage(null);
                                                                        setSelectedFile(null);
                                                                    }}
                                                                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                                                                    title={t.profile.account.cancel}
                                                                >
                                                                    <XIcon />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => setIsEditing(true)}
                                                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                                                                title={t.profile.account.edit}
                                                            >
                                                                <EditIcon />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Account Section */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-red-100 dark:border-red-900/30">
                                        <div className="p-6">
                                            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">{t.profile.account.deleteTitle}</h3>
                                            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                                                <p>{t.profile.account.deleteDescription}</p>
                                            </div>
                                            <div className="mt-5">
                                                <button
                                                    onClick={() => setIsDeleteModalOpen(true)}
                                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                                >
                                                    {t.profile.account.deleteButton}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t.profile.security.twoFactor.title}</h3>

                                        {user.two_factor_enabled ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center text-green-600 dark:text-green-400">
                                                    <CheckStrokeIcon className="w-5 h-5 mr-2" />
                                                    {t.profile.security.twoFactor.enabled}
                                                </div>
                                                <div className="flex gap-4">
                                                    <button onClick={() => { setIsDisable2faOpen(true); setDisable2faError(''); setDisableCode(''); }} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                                                        {t.profile.security.twoFactor.disableButton}
                                                    </button>
                                                    <button onClick={regenerateRecoveryCodes} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                                                        {t.profile.security.twoFactor.regenerateButton}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-gray-500 dark:text-gray-400">{t.profile.security.twoFactor.disabled}</p>
                                                <button onClick={start2faSetup} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                                    {t.profile.security.twoFactor.enableButton}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {is2faSetupOpen && !recoveryCodes && qrCodeUrl && (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 p-6">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t.profile.security.twoFactor.setupTitle}</h3>
                                            <div className="flex flex-col items-center">
                                                <img src={qrCodeUrl} alt="QR Code" className="mb-4 bg-white p-2 rounded" />
                                                <p className="mb-2 text-sm text-gray-500">{t.profile.security.twoFactor.enterSecret} <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">{setupSecret}</code></p>
                                                <input
                                                    type="text"
                                                    value={setupCode}
                                                    onChange={e => setSetupCode(e.target.value)}
                                                    placeholder="123456"
                                                    className="mb-4 px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <button onClick={complete2faSetup} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                                    {t.profile.security.twoFactor.verifyButton}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {recoveryCodes && (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-yellow-100 dark:border-yellow-900/30 p-6">
                                            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-400 mb-2">{t.profile.security.twoFactor.recoveryCodesTitle}</h3>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                                                {t.profile.security.twoFactor.recoveryCodesDescription}
                                                <br /><strong>{t.profile.security.twoFactor.recoveryCodesWarning}</strong>
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                                                {recoveryCodes.map(code => (
                                                    <div key={code} className="text-center">{code}</div>
                                                ))}
                                            </div>
                                            <button onClick={() => setRecoveryCodes(null)} className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">
                                                {t.profile.security.twoFactor.savedButton}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'api' && (
                                <ApiKeyManager />
                            )}
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <Transition appear show={isDeleteModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-[100]" onClose={() => !isDeleting && setIsDeleteModalOpen(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                        </Transition.Child>

                        <div className="fixed inset-0 z-10 overflow-y-auto">
                            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                >
                                    <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-200 dark:border-gray-700">
                                        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                            <div className="sm:flex sm:items-start">
                                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                                                    <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                                </div>
                                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                                        {t.profile.account.deleteWarningTitle}
                                                    </Dialog.Title>
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-500 dark:text-gray-300">
                                                            {t.profile.account.deleteWarningDescription}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                            <button
                                                type="button"
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                                onClick={handleDeleteAccount}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? 'Deleting...' : t.profile.account.deleteConfirm}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                                onClick={() => setIsDeleteModalOpen(false)}
                                                disabled={isDeleting}
                                            >
                                                {t.profile.account.deleteCancel}
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>

                {/* Disable 2FA Modal */}
                <Transition appear show={isDisable2faOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-[100]" onClose={() => !isDisabling2fa && setIsDisable2faOpen(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                        </Transition.Child>

                        <div className="fixed inset-0 z-10 overflow-y-auto">
                            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                >
                                    <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-gray-200 dark:border-gray-700">
                                        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                            <div className="sm:flex sm:items-start">
                                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                                                    <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                                </div>
                                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                                        {t.profile.security.twoFactor.disableConfirm}
                                                    </Dialog.Title>
                                                    <div className="mt-4">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {t.profile.security.twoFactor.disablePrompt}
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={disableCode}
                                                            onChange={(e) => setDisableCode(e.target.value)}
                                                            className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-4 py-2"
                                                            placeholder="••••••••"
                                                            autoFocus
                                                        />
                                                        {disable2faError && (
                                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                                                {disable2faError}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                            <button
                                                type="button"
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                                onClick={disable2fa}
                                                disabled={isDisabling2fa || !disableCode}
                                            >
                                                {isDisabling2fa ? 'Processing...' : t.profile.security.twoFactor.disableButton}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                                onClick={() => setIsDisable2faOpen(false)}
                                                disabled={isDisabling2fa}
                                            >
                                                {t.profile.account.deleteCancel /* Using general cancel key */}
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </main>
            <Footer />
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
