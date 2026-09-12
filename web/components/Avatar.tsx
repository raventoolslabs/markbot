
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface AvatarProps {
    src?: string | null;
    alt: string;
    name: string;
    className?: string;
    size?: number; // Optional size prop for Image component optimization
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, name, className = "", size = 40 }) => {
    const [imgSrc, setImgSrc] = useState<string | null>(src || null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src || null);
        setHasError(false);
    }, [src]);

    const getInitials = (name: string) => {
        return name
            ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
            : '?';
    };

    if (!imgSrc || hasError) {
        return (
            <div
                className={`flex items-center justify-center bg-brand/20 text-brand font-bold uppercase select-none ${className}`}
                title={alt}
            >
                {getInitials(name)}
            </div>
        );
    }

    // Identify if it is an external URL (Google) or internal
    // If it's a relative path (starts with /), use Next.js Image for optimization if desired,
    // but for simplicity and compatibility with external URLs (google), standard img might be safer 
    // unless we configured domains in next.config.ts.
    // Given the context, standard img with handling is safer to avoid Next.js config errors for external domains.

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={`${className} object-cover`}
            onError={() => setHasError(true)}
        />
    );
};
