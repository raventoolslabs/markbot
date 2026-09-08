
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginModal } from './LoginModal';
import { usePathname } from 'next/navigation';

export const VerificationGuard = () => {
    const { user } = useAuth();
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Paths that don't require verification (e.g. public landing page, or maybe just root depending on requirements)
        // For now, let's say root '/' is public, everything else protected? 
        // Or if user is logged in, we enforce it everywhere except maybe profile?
        // Let's enforce it everywhere if logged in, but ensure we don't block the ability to actually verify.

        // If user is logged in and not explicitly verified
        // We use check for !== true to catch false, null, or undefined
        if (user && user.email_verified !== true) {
            setIsVerificationModalOpen(true);
        } else {
            setIsVerificationModalOpen(false);
        }
    }, [user, pathname]);

    return (
        <LoginModal
            isOpen={isVerificationModalOpen}
            onClose={() => {
                // Determine if we allow closing. 
                // Strategies:
                // 1. Force stay open until verified (don't allow close).
                // 2. Allow close but then they can't do anything? (Maybe redirect to home?)
                // 3. For now, let's keep it simple: If they close, we might just re-open or let them be but they will see it again on nav.
                // To be robust, we should probably add a prop to LoginModal to hide close button or force mode.

                // If we want to be strict: do nothing (don't close state).
                // But LoginModal might handle close internally. 
                // Let's rely on the useEffect to re-open it if they navigate or if state changes? 
                // Actually, if they close it, `isVerificationModalOpen` is still true in this parent? 
                // modify LoginModal to take an `initialMode` which we do, but also maybe `forced`?

                // For this implementation, let's just allow close but it will pop up again on navigation.
                // To make it better UX, we'd ideally pass a "force" prop.
                setIsVerificationModalOpen(false);
            }}
            initialMode="verify-email"
            preventClose={true}
        />
    );
};
