import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { GoogleLoginButton } from './GoogleLoginButton';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: AuthMode;
    preventClose?: boolean;
}

type AuthMode = 'login' | 'register' | '2fa' | 'verify-email';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialMode = 'login', preventClose = false }) => {
    const { t } = useLanguage();
    const { loginWithEmail, registerWithEmail, verify2fa, verifyEmail, resendVerificationEmail, user, logout } = useAuth();

    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [verificationStep, setVerificationStep] = useState<'request' | 'verify'>('request');

    useEffect(() => {
        setMode(initialMode);
        if (initialMode === 'verify-email') {
            setVerificationStep('request');
        }
    }, [initialMode, isOpen]);

    useEffect(() => {
        if (mode === 'verify-email' && user?.email) {
            setEmail(user.email);
        }
    }, [mode, user]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const resetForm = () => {
        setMode(initialMode);
        setVerificationStep('request');
        setEmail('');
        setPassword('');
        setName('');
        setCode('');
        setTempToken('');
        setError('');
        setSuccessMessage('');
        setIsLoading(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const data = await loginWithEmail(email, password);
                if (data && data.requires_2fa) {
                    setTempToken(data.temp_token);
                    setMode('2fa');
                } else {
                    handleClose();
                }
            } else if (mode === 'register') {
                const data = await registerWithEmail(email, password, name);
                if (data && data.requires_email_verification) {
                    setMode('verify-email');
                    setVerificationStep('verify'); // Register sends code automatically
                } else {
                    handleClose();
                }
            } else if (mode === '2fa') {
                await verify2fa(tempToken, code);
                handleClose();
            } else if (mode === 'verify-email') {
                if (verificationStep === 'request') {
                    await resendVerificationEmail(email);
                    setVerificationStep('verify');
                    setSuccessMessage(`Verification code sent to ${email}`);
                } else {
                    await verifyEmail(email, code);
                    handleClose();
                }
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setSuccessMessage('');
        setIsLoading(true);
        try {
            await resendVerificationEmail(email);
            setSuccessMessage(`New code sent to ${email}`);
        } catch (err: any) {
            setError(err.message || 'Failed to resend code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => {
                if (!preventClose) {
                    onClose();
                }
            }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-800">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-6 text-center"
                                >
                                    {mode === 'login' && 'Login'}
                                    {mode === 'register' && 'Create Account'}
                                    {mode === '2fa' && 'Two-Factor Authentication'}
                                    {mode === 'verify-email' && 'Verify Email'}
                                </Dialog.Title>

                                {error && (
                                    <div className="mb-4 p-2 text-sm text-red-600 bg-red-100 rounded dark:bg-red-900/30 dark:text-red-400">
                                        {error}
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="mb-4 p-2 text-sm text-green-600 bg-green-100 rounded dark:bg-green-900/30 dark:text-green-400">
                                        {successMessage}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {mode === '2fa' || mode === 'verify-email' ? (
                                        <div>
                                            {mode === 'verify-email' && verificationStep === 'request' ? (
                                                <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                                                    Please verify your email address: <strong>{email}</strong>.
                                                    <br />
                                                    Click below to receive a verification code.
                                                </div>
                                            ) : (
                                                <>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {mode === '2fa' ? 'Authenticator Code' : 'Verification Code'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={code}
                                                        onChange={(e) => setCode(e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                                                        placeholder="123456"
                                                        required
                                                    />
                                                    {mode === 'verify-email' && (
                                                        <p className="mt-2 text-xs text-gray-500 text-center">
                                                            We sent a code to {email}. Please check your inbox.
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {mode === 'register' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                                                        placeholder="Your Name"
                                                        required
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                                                    placeholder="you@example.com"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Loading...' : (
                                            mode === 'login' ? 'Sign In' :
                                                mode === 'register' ? 'Sign Up' :
                                                    mode === 'verify-email' && verificationStep === 'request' ? 'Send Code' : 'Verify'
                                        )}
                                    </button>
                                </form>

                                {mode === 'verify-email' && verificationStep === 'verify' && (
                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={handleResendCode}
                                            disabled={isLoading}
                                            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                        >
                                            Resend Code
                                        </button>
                                    </div>
                                )}

                                {mode === 'verify-email' && preventClose && (
                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                logout();
                                                onClose();
                                            }}
                                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                                        >
                                            Log out
                                        </button>
                                    </div>
                                )}

                                {mode !== '2fa' && mode !== 'verify-email' && (
                                    <>
                                        <div className="mt-6 relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                                                    Or continue with
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-center">
                                            <GoogleLoginButton onSuccess={(data) => {
                                                if (data && data.requires_2fa) {
                                                    setTempToken(data.temp_token);
                                                    setMode('2fa');
                                                } else {
                                                    handleClose();
                                                }
                                            }} />
                                        </div>

                                        <div className="mt-6 text-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                                            </span>
                                            <button
                                                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                            >
                                                {mode === 'login' ? 'Sign up' : 'Sign in'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
