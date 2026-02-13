'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image'; // Assuming Image is used later
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { useLanguage } from '@/context/LanguageContext';

type Message = {
    role: 'user' | 'bot';
    content: string;
    images?: Array<{
        name: string;
        mimeType: string;
        data: string; // base64
    }>;
};

type SelectedImage = {
    src: string;
    alt: string;
} | null;

export default function ChatPage() {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<SelectedImage>(null);
    const mainRef = useRef<HTMLElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const searchParams = useSearchParams();

    // Embed Mode State
    const isEmbed = searchParams.get('embed') === '1';
    const widgetToken = searchParams.get('token');
    const [isTokenValid, setIsTokenValid] = useState<boolean | null>(isEmbed ? null : true);
    const [widgetTheme, setWidgetTheme] = useState(searchParams.get('theme') || 'light');

    // 1. Validate Token if Embedded
    useEffect(() => {
        if (isEmbed) {
            if (!widgetToken) {
                setIsTokenValid(false);
                return;
            }

            const validateToken = async () => {
                try {
                    const res = await fetch('/api/widgets/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: widgetToken })
                    });
                    const data = await res.json();
                    if (data.valid) {
                        setIsTokenValid(true);
                        // Notify parent that widget is ready
                        window.parent.postMessage({ type: 'widget:ready' }, '*');
                    } else {
                        console.error('Widget token invalid:', data.error);
                        setIsTokenValid(false);
                    }
                } catch (error) {
                    console.error('Widget token validation failed:', error);
                    setIsTokenValid(false);
                }
            };
            validateToken();
        }
    }, [isEmbed, widgetToken]);

    // 2. Report Resize (optional, good for auto-height widgets)
    useEffect(() => {
        if (!isEmbed) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                window.parent.postMessage({
                    type: 'widget:resize',
                    height: entry.contentRect.height
                }, '*');
            }
        });

        if (document.body) observer.observe(document.body);
        return () => observer.disconnect();
    }, [isEmbed]);

    // ... scroll logic ...
    const scrollToBottom = () => {
        if (mainRef.current) {
            const { scrollHeight, clientHeight } = mainRef.current;
            mainRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }
    };
    // ...

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // ... sendMessage ...
    const sendMessage = async (e: React.FormEvent) => {
        // ... (existing logic) ...
        e.preventDefault();
        if (!input.trim()) return;

        const content = input;
        const userMessage: Message = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content }),
            });
            const data = await res.json();

            // Handle metadata if present (compatible with new messageHandler response)
            const botMessage: Message = {
                role: 'bot',
                content: data.response || data.text,
                images: data.images || []
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = { role: 'bot', content: t.chat.error };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    // ... handleKeyDown ...
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e as unknown as React.FormEvent);
        }
    };

    // Render Logic for Embed
    if (isEmbed && isTokenValid === false) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">
                <p>Unauthorized: Invalid or expired widget token.</p>
            </div>
        );
    }

    if (isEmbed && isTokenValid === null) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }


    return (
        <div className={`flex flex-col h-screen transition-colors duration-300 overflow-hidden relative ${isEmbed ? 'bg-white' : 'bg-gray-50 dark:bg-gray-950'}`}>
            {!isEmbed && <Header />}

            {/* Embed Close Button */}
            {isEmbed && (
                <div className="absolute top-2 right-2 z-50">
                    <button
                        onClick={() => window.parent.postMessage({ type: 'widget:close' }, '*')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-2 transition-colors"
                        title="Close Chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            )}

            <main ref={mainRef} className={`flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 w-full pb-8 scroll-smooth ${isEmbed ? 'bg-white' : 'max-w-5xl mx-auto bg-emerald-50/20 dark:bg-transparent'}`}>
                {/* Logo and Welcome for Embed */}
                {isEmbed && messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in zoom-in duration-500 mt-10">
                        <div className="w-16 h-16 flex items-center justify-center mb-2">
                            <Image src="/img/logo-without-title.png" alt="Markbot" width={64} height={64} className="object-contain" />
                        </div>
                        <p className="text-gray-500 text-sm max-w-xs">{t.chat.start}</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                        {msg.role === 'bot' && (
                            <Image src="/img/logo-without-title.png" alt="Bot" width={48} height={48} className="object-contain w-12 h-12 shrink-0" />
                        )}

                        <div className={`max-w-[80%] p-4 shadow-sm ${msg.role === 'user'
                            ? 'bg-emerald-800 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm border border-emerald-100 dark:border-gray-800'
                            }`}>
                            {msg.role === 'bot' ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:mt-3 prose-headings:mb-2 prose-li:my-0.5">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            img: ({ src, alt }) => {
                                                const imgData = msg.images?.find(i => i.name === src || i.name === alt);

                                                if (imgData) {
                                                    const imgSrc = `data:${imgData.mimeType};base64,${imgData.data}`;
                                                    return (
                                                        <div className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col items-center group">
                                                            <div
                                                                onClick={() => setSelectedImage({ src: imgSrc, alt: imgData.name })}
                                                                className="cursor-zoom-in w-full flex justify-center p-4 bg-gray-50/50 dark:bg-gray-900/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                title={`Click to enlarge ${imgData.name}`}
                                                            >
                                                                <img
                                                                    src={imgSrc}
                                                                    alt={imgData.name}
                                                                    className="max-w-full h-auto object-contain shadow-sm rounded-sm max-h-[400px]"
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                            <div className="w-full px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-center font-medium truncate flex items-center justify-center gap-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                                                                {imgData.name}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return <span className="text-gray-400 italic text-xs">[Image: {String(alt || src || '')}]</span>;
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-gray-700 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200 dark:border-gray-600">
                                <span className="text-sm font-bold text-emerald-800 dark:text-gray-300">YO</span>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 justify-start animate-pulse">
                        <Image src="/img/logo-without-title.png" alt="Bot" width={48} height={48} className="object-contain w-12 h-12 shrink-0" />
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl rounded-tl-sm border border-emerald-100 dark:border-gray-800">
                            <span className="flex gap-1.5 h-6 items-center">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                            </span>
                        </div>
                    </div>
                )}
            </main>

            {/* Image Lighbox / Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-full max-h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <img
                            src={selectedImage.src}
                            alt={selectedImage.alt}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="mt-4 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                            {selectedImage.alt}
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 bg-emerald-50/30 dark:bg-gray-950 z-10 transition-colors">
                <form onSubmit={sendMessage} className="max-w-5xl mx-auto">
                    <div className="flex items-end gap-2 bg-white dark:bg-gray-900 rounded-2xl border border-emerald-100 dark:border-gray-700 p-2 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all shadow-md">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.chat.placeholder}
                            className="flex-1 p-2 bg-transparent text-gray-800 dark:text-white focus:outline-none resize-none min-h-[40px] max-h-[200px] overflow-y-auto custom-scrollbar"
                            style={{
                                height: 'auto'
                            }}
                            disabled={isLoading}
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-emerald-800 hover:bg-emerald-700 text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all aspect-square flex items-center justify-center shadow-md shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                    <div className="text-center mt-2 text-[10px] uppercase tracking-widest font-bold text-emerald-700/50 dark:text-gray-600">
                        Markbot can make mistakes. Consider checking important information.
                    </div>
                </form>
            </div>
        </div>
    );
}

