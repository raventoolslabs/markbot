"use client";

import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';

interface GoogleLoginButtonProps {
    onSuccess?: () => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
    const { user, logout, processLogin } = useAuth(); // Assuming processLogin is exposed or we handle it here

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user.name}
                </span>
                {user.picture && (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                )}
                <button
                    onClick={logout}
                    className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <GoogleLogin
            onSuccess={credentialResponse => {
                if (credentialResponse.credential) {
                    processLogin(credentialResponse.credential);
                    if (onSuccess) {
                        onSuccess();
                    }
                }
            }}
            onError={() => {
                console.log('Login Failed');
            }}
            useOneTap
        />
    );
};
