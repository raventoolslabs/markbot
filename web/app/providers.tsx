'use client';

import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '../context/LanguageContext';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';
import { config } from '@/config';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={config.googleClientId}>
            <AuthProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <LanguageProvider>
                        {children}
                    </LanguageProvider>
                </ThemeProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}
