import { Platform } from 'react-native';

import type { SelectedMediaFile } from '@/components/language-converter/types';
import { getTranslationServerBaseUrl } from '@/lib/server-url';

const parseServerError = async (response: Response) => {
    try {
        const payload = await response.json();
        return payload?.message || `Request failed with status ${response.status}`;
    } catch {
        return `Request failed with status ${response.status}`;
    }
};

const buildImageFormData = (file: SelectedMediaFile, sourceCode: string, targetCode: string) => {
    const formData = new FormData();
    formData.append('sourceCode', sourceCode);
    formData.append('targetCode', targetCode);

    if (Platform.OS === 'web' && file.webFile) {
        formData.append('image', file.webFile, file.name);
    } else {
        formData.append('image', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'image/jpeg',
        } as unknown as Blob);
    }

    return formData;
};

export const requestTranslatedImage = async ({
    file,
    sourceCode,
    targetCode,
}: {
    file: SelectedMediaFile;
    sourceCode: string;
    targetCode: string;
}) => {
    const baseUrl = getTranslationServerBaseUrl();
    const response = await fetch(`${baseUrl}/api/image/translate`, {
        method: 'POST',
        body: buildImageFormData(file, sourceCode, targetCode),
    });

    if (!response.ok) {
        const serverMessage = await parseServerError(response);
        throw new Error(serverMessage);
    }

    return response.json() as Promise<{
        sourceText: string;
        translatedText: string;
        totalChunks: number;
    }>;
};
