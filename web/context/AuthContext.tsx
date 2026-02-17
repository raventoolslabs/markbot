"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

interface User {
    id: string;
    email: string;
    name: string;
    picture: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: () => void;
    logout: () => void;
    processLogin: (credential: string) => Promise<void>;
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

    const processLogin = async (credential: string) => {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: credential }),
            });

            if (!res.ok) {
                throw new Error('Login failed');
            }

            const data = await res.json();
            const { token: jwtToken, user: userData } = data;

            setToken(jwtToken);
            setUser(userData);

            Cookies.set('token', jwtToken, { expires: 7 }); // 7 days
            Cookies.set('user', JSON.stringify(userData), { expires: 7 });
        } catch (error) {
            console.error('Google login error:', error);
            alert('Login failed');
        }
    }

    const updateUser = (userData: User) => {
        setUser(userData);
        Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    };

    return (
        <AuthContext.Provider value={{ user, token, login: () => { }, logout, processLogin, isLoading, updateUser }}>
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
