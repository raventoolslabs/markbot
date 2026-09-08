'use client';

import { useLanguage } from '../context/LanguageContext';
import { SpainFlagIcon, UKFlagIcon } from './Icons';

export const LanguageToggle = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-xl leading-none text-white"
            aria-label="Toggle Language"
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
            {language === 'es' ? (
                <div className="w-6 h-6 rounded-sm shadow-sm overflow-hidden flex items-center justify-center">
                    <SpainFlagIcon className="w-full h-full" />
                </div>
            ) : (
                <div className="w-6 h-6 rounded-sm shadow-sm overflow-hidden flex items-center justify-center">
                    <UKFlagIcon className="w-full h-full scale-110" />
                </div>
            )}
        </button>
    );
};
