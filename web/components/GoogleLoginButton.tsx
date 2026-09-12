"use client";

import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';

interface GoogleLoginButtonProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess?: (data?: any) => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
    const { processLogin } = useAuth();

    return (
        <GoogleLogin
            onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                    try {
                        const data = await processLogin(credentialResponse.credential);
                        onSuccess?.(data);
                    } catch (error) {
                        console.error("Google Login failed", error);
                    }
                }
            }}
            onError={() => {
                console.error('Google Login failed');
            }}
            useOneTap
        />
    );
};
