'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

export default function EmbeddedChatPage() {
    const { user } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');


    // Cleanup on unmount
    useEffect(() => {
        return () => {
            const existingRoot = document.getElementById('markbot-markbot-widget-1');
            if (existingRoot) existingRoot.remove();

            // Also remove the script tag if possible, though less critical
            const scripts = document.querySelectorAll('script[data-widget-id="markbot-widget-1"]');
            scripts.forEach(s => s.remove());
        };
    }, []);

    const generateAndEmbed = async () => {
        if (!apiKey) {
            setError('Please enter an API Key');
            return;
        }
        // ... (rest of the function)
        setError('');
        setIsLoading(true);

        try {
            // Simulate Backend Call to get a short-lived token
            const res = await fetch('/api/widgets/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    widgetId: 'demo-' + Math.random().toString(36).substr(2, 9),
                    allowedOrigin: window.location.origin
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to get token');
            }

            const data = await res.json();
            const token = data.token;
            const origin = window.location.origin;

            // Construct the snippet
            const snippet = `<script src="${origin}/widget.js" 
    data-widget-id="markbot-widget-1" 
    data-token="${token}" 
    data-chat-url="${origin}/chat" 
    data-api-base="${origin}" 
    data-position="bottom-right" 
    data-theme="light">
<\/script>`;

            setGeneratedCode(snippet);

            // Inject script dynamically for the demo
            // Remove existing widget if any
            const existingRoot = document.getElementById('markbot-markbot-widget-1');
            if (existingRoot) existingRoot.remove();

            const script = document.createElement('script');
            script.src = "/widget.js";
            script.setAttribute('data-widget-id', 'markbot-widget-1');
            script.setAttribute('data-token', token);
            script.setAttribute('data-chat-url', origin + '/chat');
            script.setAttribute('data-api-base', origin);
            script.setAttribute('data-position', 'bottom-right');
            script.setAttribute('data-theme', 'light');
            document.body.appendChild(script);

        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto space-y-8">

                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Embed Markbot</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Generate a secure code snippet to add Markbot to any website.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 sm:p-8 space-y-6">

                            {/* Step 1 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm">1</div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enter your API Key</h2>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">
                                    You can copy this from your <a href="/profile" className="text-emerald-600 hover:text-emerald-500 underline">Profile</a>.
                                    This is used here only to simulate the server-side token generation.
                                </p>
                                <div className="ml-11">
                                    <input
                                        type="text"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="mk_..."
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900 dark:text-white font-mono text-sm"
                                    />
                                    {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                                </div>
                            </div>

                            {/* Action */}
                            <div className="ml-11">
                                <button
                                    onClick={generateAndEmbed}
                                    disabled={isLoading || !apiKey}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Widget Code'
                                    )}
                                </button>
                            </div>

                            {/* Step 2: Result */}
                            {generatedCode && (
                                <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm">2</div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Copy & Paste</h2>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">
                                        Place this code snippet before the closing <code>&lt;/body&gt;</code> tag of your website.
                                    </p>
                                    <div className="ml-11 relative group">
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigator.clipboard.writeText(generatedCode)}
                                                className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2.5 py-1.5 roundedmd transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-700">
                                            {generatedCode}
                                        </pre>
                                    </div>

                                    <div className="ml-11 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800 flex gap-3 text-sm text-emerald-800 dark:text-emerald-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <strong>Widget Preview Active!</strong><br />
                                            Look at the bottom right of your screen. The widget has been injected for you to test right now.
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
