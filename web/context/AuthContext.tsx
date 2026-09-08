"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

interface User {
    id: string;
    email: string;
    name: string;
    picture: string;
    two_factor_enabled?: boolean;
    email_verified?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: () => void;
    logout: () => void;
    processLogin: (credential: string) => Promise<any>;
    loginWithEmail: (email: string, password: string) => Promise<any>;
    registerWithEmail: (email: string, password: string, name: string) => Promise<any>;
    verify2fa: (tempToken: string, code: string) => Promise<void>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    resendVerificationEmail: (email: string) => Promise<void>;
    isLoading: boolean;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = Cookies.get('token');
        const storedUser = Cookies.get('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user cookie", e);
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    const logout = () => {
        googleLogout();
        setToken(null);
        setUser(null);
        Cookies.remove('token');
        Cookies.remove('user');
    };

    const handleAuthResponse = (data: any) => {
        const { token: jwtToken, user: userData } = data;
        setToken(jwtToken);
        setUser(userData);
        Cookies.set('token', jwtToken, { expires: 7 });
        Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    };

    const processLogin = async (credential: string) => {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credential }),
            });

            if (!res.ok) throw new Error('Login failed');

            const data = await res.json();

            if (data.requires_2fa) {
                return data; // Return to caller to handle 2FA step
            }

            handleAuthResponse(data);
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Login failed');
            }

            const data = await res.json();

            if (data.requires_2fa) {
                return data;
            }

            handleAuthResponse(data);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, password: string, name: string) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Registration failed');
            }

            const data = await res.json();
            if (data.requires_email_verification) {
                return data;
            }
            handleAuthResponse(data);
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const verifyEmail = async (email: string, code: string) => {
        try {
            const res = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Email verification failed');
            }

            const data = await res.json();
            handleAuthResponse(data);
        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    };

    const resendVerificationEmail = async (email: string) => {
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to resend verification email');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            throw error;
        }
    };

    const verify2fa = async (tempToken: string, code: string) => {
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temp_token: tempToken, code }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Verification failed');
            }

            const data = await res.json();
            handleAuthResponse(data);
        } catch (error) {
            console.error('2FA Verification error:', error);
            throw error;
        }
    };

    const updateUser = (userData: User) => {
        setUser(userData);
        Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    };

    return (
        <AuthContext.Provider value={{ user, token, login: () => { }, logout, processLogin, loginWithEmail, registerWithEmail, verify2fa, verifyEmail, resendVerificationEmail, isLoading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
