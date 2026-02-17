import axios from 'axios';
import { logger } from '@/infrastructure/logging/logger';

export interface ImageContent {
    content: string; // Base64
    mimeType: string;
}

export const downloadImageAsBase64 = async (url: string): Promise<ImageContent | null> => {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
        });

        const mimeType = response.headers['content-type'] || 'image/jpeg';
        const buffer = Buffer.from(response.data, 'binary');
        const content = buffer.toString('base64');

        return {
            content,
            mimeType,
        };
    } catch (error) {
        logger.error(`Failed to download image from ${url}`, 'ImageUtil', error);
        return null;
    }
};
