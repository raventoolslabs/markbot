'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from './Icons';

export const ThemeToggle = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-8 h-8" />;
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                // Sun Icon (Minimalist)
                <SunIcon width="20" height="20" />
            ) : (
                // Moon Icon (Minimalist)
                <MoonIcon width="20" height="20" />
            )}
        </button>
    );
};
