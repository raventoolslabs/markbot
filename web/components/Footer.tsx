'use client';

import { useLanguage } from '../context/LanguageContext';
import { config } from '@/config';

export const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center p-4 text-ink-mute text-sm border-t border-line w-full">
            <p>© {new Date().getFullYear()} {config.botName}bot. {t.footer.rights}</p>
        </footer>
    );
};
