'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

export const Header = () => {
    const { t } = useLanguage();

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
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-2 text-white">
                <LanguageToggle />
                <ThemeToggle />
            </div>
        </header>
    );
};
