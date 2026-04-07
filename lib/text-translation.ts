import { getTranslationServerBaseUrl } from '@/lib/server-url';

const parseServerError = async (response: Response) => {
    try {
        const payload = await response.json();
        return payload?.message || `Request failed with status ${response.status}`;
    } catch {
        return `Request failed with status ${response.status}`;
    }
};

type TranslateTextOptions = {
    text: string;
    sourceCode: string;
    targetCode: string;
    maxCharsPerRequest: number;
    onProgress?: (index: number, total: number) => void;
};

export const translateTextInChunks = async ({
    text,
    sourceCode,
    targetCode,
    maxCharsPerRequest,
    onProgress,
}: TranslateTextOptions) => {
    const baseUrl = getTranslationServerBaseUrl();
    onProgress?.(0, 1);

    const response = await fetch(`${baseUrl}/api/text/translate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            sourceCode,
            targetCode,
            maxCharsPerRequest,
        }),
    });

    if (!response.ok) {
        const serverMessage = await parseServerError(response);
        throw new Error(serverMessage);
    }

    const payload = await response.json();
    onProgress?.(1, 1);

    return {
        translatedText: String(payload?.translatedText || ''),
        totalChunks: Number(payload?.totalChunks || 1),
    };
};
