'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
// import { GoogleLoginButton } from './GoogleLoginButton'; // No longer needed directly here
import { LoginModal } from './LoginModal';
import { useAuth } from '@/context/AuthContext';
import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Avatar } from './Avatar';
import { UserIcon, LockIcon, KeyIcon, LoginIcon } from './Icons';
import { config } from '@/config';

export const Header = () => {
    const { t } = useLanguage();
    const { user } = useAuth();

    return (
        <header className="w-full p-3 flex items-center bg-emerald-800 dark:bg-gray-950 sticky top-0 z-50 transition-colors duration-300 shadow-lg border-b border-emerald-700/30 dark:border-gray-800">
            <Link href="/" className="flex items-center mr-8 hover:opacity-90 transition-opacity group">
                <span className="text-2xl font-black italic tracking-tighter select-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    <span className="text-white">{config.botName}</span>
                    <span className="text-lime-400 group-hover:text-lime-300 transition-colors">bot</span>
                </span>
            </Link>

            <nav className="flex gap-4 sm:gap-6">
                <Link href="/chat" className="hover:text-white transition-colors font-semibold text-white/90">
                    {t.nav.chat}
                </Link>
                {/* Only show documents link and embedded chat if user is logged in */}
                {user && (
                    <>
                        <Link href="/documents" className="hover:text-white transition-colors font-semibold text-white/90">
                            {t.nav.documents}
                        </Link>
                        <Link href="/embedded-chat" className="hover:text-white transition-colors font-semibold text-white/90">
                            {t.nav.embeddedChat}
                        </Link>
                    </>
                )}
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-2 text-white">
                <LanguageToggle />
                <ThemeToggle />
                <HeaderActions />
            </div>
        </header>
    );
};

// Extracted to manage state cleanly
const HeaderActions = () => {
    const { user, logout } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const { t } = useLanguage();

    if (user) {
        return (
            <Menu as="div" className="relative ml-2">
                <div>
                    <Menu.Button className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">Open user menu</span>
                        <Avatar
                            className="h-9 w-9 rounded-full border-2 border-emerald-500"
                            src={user.picture}
                            name={user.name}
                            alt={user.name}
                        />
                    </Menu.Button>
                </div>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-xl bg-white dark:bg-gray-800 py-2 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        <div className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>

                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <Link
                                        href="/profile?tab=account"
                                        className={`${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                                            } group flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 transition-colors`}
                                    >
                                        <UserIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-emerald-500 dark:text-gray-500 dark:group-hover:text-emerald-400 transition-colors" />
                                        {t.userMenu.account}
                                    </Link>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <Link
                                        href="/profile?tab=security"
                                        className={`${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                                            } group flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 transition-colors`}
                                    >
                                        <LockIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-emerald-500 dark:text-gray-500 dark:group-hover:text-emerald-400 transition-colors" />
                                        {t.userMenu.security}
                                    </Link>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <Link
                                        href="/profile?tab=api"
                                        className={`${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                                            } group flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 transition-colors`}
                                    >
                                        <KeyIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-emerald-500 dark:text-gray-500 dark:group-hover:text-emerald-400 transition-colors" />
                                        {t.userMenu.apiKey}
                                    </Link>
                                )}
                            </Menu.Item>
                        </div>

                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={logout}
                                        className={`${active ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                                            } block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                                    >
                                        <div className="flex items-center justify-center w-full font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                            {t.userMenu.logout}
                                        </div>
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white border border-white/10 backdrop-blur-sm"
                title="Login"
            >
                <LoginIcon className="w-5 h-5" />
            </button>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
};
