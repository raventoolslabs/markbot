'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { useLanguage } from '@/context/LanguageContext';

type Message = {
    role: 'user' | 'bot';
    content: string;
};

export default function ChatPage() {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const mainRef = useRef<HTMLElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        if (mainRef.current) {
            const { scrollHeight, clientHeight } = mainRef.current;
            mainRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }
    };

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

    const sendMessage = async (e: React.FormEvent) => {
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
            const botMessage: Message = { role: 'bot', content: data.response || data.text };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = { role: 'bot', content: t.chat.error };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e as unknown as React.FormEvent);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            <Header />

            <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full pb-8 scroll-smooth bg-emerald-50/20 dark:bg-transparent">
                {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 flex items-center justify-center mb-4">
                            <Image src="/img/logo-without-title.png" alt="Markbot" width={80} height={80} className="object-contain" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">{t.chat.start}</p>
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
                            <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
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
