'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { config } from '@/config';

export const HomeContent = () => {
    const { t } = useLanguage();

    return (
        <main className="flex flex-col gap-12 items-center text-center animate-in fade-in zoom-in duration-700 max-w-4xl mx-auto">

            {/* Hero Section */}
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-72 h-72 sm:w-96 sm:h-96 mb-2 drop-shadow-2xl">
                    <Image
                        src="/img/logo.png"
                        alt={`${config.botName}bot Logo`}
                        fill
                        priority
                        className="object-contain"
                    />
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                    <span className="text-brand">
                        {t.home.welcome}
                    </span>
                </h1>

                <p className="text-lg sm:text-xl text-ink-mute max-w-2xl leading-relaxed">
                    {t.home.subDescription}
                </p>

                <div className="flex gap-4 mt-4">
                    <Link
                        href="/chat"
                        className="group relative px-8 py-4 bg-brand hover:bg-brand-deep text-brand-ink rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                    >
                        {t.chat.start}
                        <span className="absolute inset-0 rounded-full ring-2 ring-white/10 group-hover:ring-white/20 animate-pulse"></span>
                    </Link>
                </div>
            </div>

        </main>
    );
};
