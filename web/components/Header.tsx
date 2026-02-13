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

export const Header = () => {
    const { t } = useLanguage();
    const { user } = useAuth();

    return (
        <header className="w-full p-3 flex items-center bg-emerald-800 dark:bg-gray-950 sticky top-0 z-50 transition-colors duration-300 shadow-lg border-b border-emerald-700/30 dark:border-gray-800">
            <Link href="/" className="flex items-center mr-8 hover:opacity-90 transition-opacity group">
                <span className="text-2xl font-black italic tracking-tighter select-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    <span className="text-white">Mark</span>
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
            <Menu as="div" className="relative">
                <div>
                    <Menu.Button className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">Open user menu</span>
                        {user.picture ? (
                            <img
                                className="h-8 w-8 rounded-full border-2 border-emerald-500"
                                src={user.picture}
                                alt={user.name}
                            />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                                {user.name.charAt(0)}
                            </div>
                        )}
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
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                            {({ active }) => (
                                <Link
                                    href="/profile"
                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                        } block px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                                >
                                    {t.userMenu.profile}
                                </Link>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={logout}
                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                        } block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                                >
                                    {t.userMenu.logout}
                                </button>
                            )}
                        </Menu.Item>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            </button>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
};
