'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { config } from '@/config';

type AuthMode = 'login' | 'register' | '2fa' | 'verify-email';

const inputClass =
    'w-full rounded-[11px] border border-line bg-surface px-4 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink-mute/70 focus:border-brand focus:ring-[3px] focus:ring-brand/20';

const labelClass = 'text-[13px] font-semibold text-ink-soft';

const LoginForm = () => {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        user,
        loginWithEmail,
        registerWithEmail,
        verify2fa,
        verifyEmail,
        resendVerificationEmail,
        logout,
    } = useAuth();

    const initialMode = (searchParams.get('mode') as AuthMode) || 'login';
    const next = searchParams.get('next') || '/';

    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [verificationStep, setVerificationStep] = useState<'request' | 'verify'>('request');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Al llegar desde VerificationGuard el email sale de la sesión abierta.
    useEffect(() => {
        if (mode === 'verify-email' && user?.email) setEmail(user.email);
    }, [mode, user]);

    // Solo rutas internas: "//host" es protocol-relative y saldría del sitio.
    const goToApp = () => {
        const isInternal = next.startsWith('/') && !next.startsWith('//');
        router.replace(isInternal ? next : '/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const data = await loginWithEmail(email, password);
                if (data?.requires_2fa) {
                    setTempToken(data.temp_token);
                    setMode('2fa');
                } else {
                    goToApp();
                }
            } else if (mode === 'register') {
                const data = await registerWithEmail(email, password, name);
                if (data?.requires_email_verification) {
                    setMode('verify-email');
                    setVerificationStep('verify');
                } else {
                    goToApp();
                }
            } else if (mode === '2fa') {
                await verify2fa(tempToken, code);
                goToApp();
            } else if (verificationStep === 'request') {
                await resendVerificationEmail(email);
                setVerificationStep('verify');
                setSuccessMessage(`${t.auth.verifyEmail.sentMessage} ${email}`);
            } else {
                await verifyEmail(email, code);
                goToApp();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t.auth.common.error);
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
            setSuccessMessage(`${t.auth.verifyEmail.resendSuccess} ${email}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : t.auth.verifyEmail.resendError);
        } finally {
            setIsLoading(false);
        }
    };

    const title =
        mode === 'login' ? t.auth.login.title
            : mode === 'register' ? t.auth.register.title
                : mode === '2fa' ? t.auth.twoFactor.title
                    : t.auth.verifyEmail.title;

    const submitLabel =
        mode === 'login' ? t.auth.login.submit
            : mode === 'register' ? t.auth.register.submit
                : mode === '2fa' ? t.auth.twoFactor.submit
                    : verificationStep === 'request' ? t.auth.verifyEmail.submitRequest
                        : t.auth.verifyEmail.submitVerify;

    const isCodeMode = mode === '2fa' || mode === 'verify-email';
    const showSocial = mode === 'login' || mode === 'register';

    return (
        <div className="flex w-full max-w-[400px] flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-ink">{title}</h2>
                        <p className="text-[14.5px] leading-relaxed text-ink-mute">
                            {mode === 'login' ? t.auth.login.subtitle
                                : mode === 'verify-email' && verificationStep === 'request'
                                    ? `${t.auth.verifyEmail.requestMessage} ${email}`
                                    : mode === 'verify-email'
                                        ? `${t.auth.verifyEmail.sentMessage} ${email}. ${t.auth.verifyEmail.checkInbox}`
                                        : ''}
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-[11px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="rounded-[11px] border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {isCodeMode ? (
                            (mode === '2fa' || verificationStep === 'verify') && (
                                <label className="flex flex-col gap-2">
                                    <span className={labelClass}>
                                        {mode === '2fa' ? t.auth.twoFactor.label : t.auth.verifyEmail.label}
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder={mode === '2fa' ? t.auth.twoFactor.placeholder : t.auth.verifyEmail.placeholder}
                                        className={inputClass}
                                        required
                                    />
                                </label>
                            )
                        ) : (
                            <>
                                {mode === 'register' && (
                                    <label className="flex flex-col gap-2">
                                        <span className={labelClass}>{t.auth.register.nameLabel}</span>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder={t.auth.register.namePlaceholder}
                                            className={inputClass}
                                            required
                                        />
                                    </label>
                                )}
                                <label className="flex flex-col gap-2">
                                    <span className={labelClass}>{t.auth.common.emailLabel}</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t.auth.common.emailPlaceholder}
                                        className={inputClass}
                                        required
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className={labelClass}>{t.auth.common.passwordLabel}</span>
                                    <span className="relative flex items-center">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={t.auth.common.passwordPlaceholder}
                                            className={`${inputClass} pr-20`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold tracking-wider text-ink-mute transition hover:bg-brand/10 hover:text-brand"
                                        >
                                            {showPassword ? t.auth.common.hidePassword : t.auth.common.showPassword}
                                        </button>
                                    </span>
                                </label>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-[11px] bg-[linear-gradient(180deg,#2fbf6f,#1f9e5e)] py-4 text-[15.5px] font-bold text-brand-ink shadow-[0_8px_22px_rgba(31,158,94,.28)] transition hover:bg-[linear-gradient(180deg,#3ad07c,#25ae69)] active:translate-y-px disabled:opacity-50"
                        >
                            {isLoading ? t.auth.common.loading : submitLabel}
                        </button>
                    </form>

                    {mode === 'verify-email' && verificationStep === 'verify' && (
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={isLoading}
                            className="text-sm font-semibold text-brand transition hover:text-brand-deep"
                        >
                            {t.auth.verifyEmail.resend}
                        </button>
                    )}

                    {showSocial && (
                        <>
                            <div className="flex items-center gap-3.5">
                                <span className="h-px flex-1 bg-line-soft" />
                                <span className="text-[12.5px] text-ink-mute">{t.auth.common.orContinue}</span>
                                <span className="h-px flex-1 bg-line-soft" />
                            </div>

                            <div className="flex justify-center">
                                <GoogleLoginButton
                                    onSuccess={(data) => {
                                        if (data?.requires_2fa) {
                                            setTempToken(data.temp_token);
                                            setMode('2fa');
                                        } else {
                                            goToApp();
                                        }
                                    }}
                                />
                            </div>

                            <p className="text-center text-[13.5px] text-ink-mute">
                                {mode === 'login' ? t.auth.login.noAccount : t.auth.register.hasAccount}{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'register' : 'login');
                                        setError('');
                                    }}
                                    className="font-semibold text-brand transition hover:text-brand-deep"
                                >
                                    {mode === 'login' ? t.auth.login.signUpLink : t.auth.register.signInLink}
                                </button>
                            </p>
                        </>
                    )}

                    {mode === 'verify-email' && (
                        <button
                            type="button"
                            onClick={() => {
                                logout();
                                setMode('login');
                            }}
                            className="text-sm text-ink-mute underline transition hover:text-ink"
                        >
                            {t.auth.verifyEmail.logout}
                        </button>
                    )}
        </div>
    );
};

// El panel de marca no depende de searchParams: fuera del Suspense evita que la
// página entera caiga a render en cliente y se vea en blanco al cargar.
const BrandPanel = () => {
    const { t } = useLanguage();

    return (
        <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,#34d17a_0%,#1f9e5e_42%,#0f5f3c_100%)] px-8 py-10 lg:min-h-[560px] lg:px-14 lg:pb-14 lg:pt-11">
                <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.07)_0_1px,transparent_1px_14px)]" />
                <div className="pointer-events-none absolute -bottom-[120px] -right-[90px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,.16),rgba(255,255,255,0)_62%)]" />

                <div className="relative flex flex-1 items-center justify-center py-4 lg:py-6">
                    <Image
                        src="/img/logo.png"
                        alt={`${config.botName}bot`}
                        width={360}
                        height={360}
                        priority
                        className="w-32 max-w-[60%] animate-[mbFloat_7s_ease-in-out_infinite] drop-shadow-[0_26px_50px_rgba(0,0,0,.35)] lg:w-[min(360px,60%)]"
                    />
                </div>

                <div className="relative hidden max-w-[620px] flex-col gap-4 lg:flex">
                    <h1 className="text-[clamp(30px,3.4vw,48px)] font-extrabold leading-[1.06] tracking-[-0.035em] text-white text-pretty">
                        {t.auth.login.tagline}
                    </h1>
                    <p className="text-[17px] leading-relaxed text-white/90 text-pretty">
                        {t.auth.login.taglineDescription}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="h-[3px] w-[34px] rounded-sm bg-white" />
                        <span className="h-[3px] w-[14px] rounded-sm bg-white/40" />
                        <span className="h-[3px] w-[14px] rounded-sm bg-white/40" />
                    </div>
                </div>
            </div>
    );
};

export default function LoginPage() {
    return (
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-canvas text-ink">
            <BrandPanel />
            <div className="flex items-center justify-center px-6 py-12 sm:px-10 dark:bg-[radial-gradient(120%_90%_at_100%_0%,#12241b_0%,#0b0f0d_58%)]">
                <Suspense fallback={<div className="w-full max-w-[400px]" />}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
