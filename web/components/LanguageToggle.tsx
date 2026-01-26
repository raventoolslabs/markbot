'use client';

import { useLanguage } from '../context/LanguageContext';

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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 500" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
                        <rect width="750" height="500" fill="#c60b1e" />
                        <rect width="750" height="250" y="125" fill="#ffc400" />
                    </svg>
                </div>
            ) : (
                <div className="w-6 h-6 rounded-sm shadow-sm overflow-hidden flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className="w-full h-full scale-110">
                        <rect width="60" height="30" fill="#012169" />
                        <path d="M0 0l60 30M60 0L0 30" stroke="#fff" strokeWidth="6" />
                        <path d="M0 0l60 30M60 0L0 30" stroke="#C8102E" strokeWidth="4" />
                        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
                        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
                    </svg>
                </div>
            )}
        </button>
    );
};
