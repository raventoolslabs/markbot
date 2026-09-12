'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

export const VerificationGuard = () => {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (pathname === '/login') return;
        // email_verified puede llegar como false, null o undefined.
        if (user && user.email_verified !== true) {
            router.replace('/login?mode=verify-email');
        }
    }, [user, pathname, router]);

    return null;
};
