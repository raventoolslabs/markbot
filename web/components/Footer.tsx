'use client';

import { useLanguage } from '../context/LanguageContext';

export const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center p-4 text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-800 w-full">
            <p>© {new Date().getFullYear()} Markbot. {t.footer.rights}</p>
        </footer>
    );
};
