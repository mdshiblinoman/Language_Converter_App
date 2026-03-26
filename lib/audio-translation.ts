import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { SelectedMediaFile } from '@/components/language-converter/types';
import { getTranslationServerBaseUrl } from '@/lib/server-url';

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let index = 0; index < bytes.byteLength; index += 1) {
        binary += String.fromCharCode(bytes[index]);
    }

    return globalThis.btoa(binary);
};

const parseServerError = async (response: Response) => {
    try {
        const payload = await response.json();
        return payload?.message || `Request failed with status ${response.status}`;
    } catch {
        return `Request failed with status ${response.status}`;
    }
};

const buildAudioFormData = (file: SelectedMediaFile, sourceCode: string, targetCode: string) => {
    const formData = new FormData();
    formData.append('sourceCode', sourceCode);
    formData.append('targetCode', targetCode);

    if (Platform.OS === 'web' && file.webFile) {
        formData.append('audio', file.webFile, file.name);
    } else {
        formData.append('audio', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'audio/mpeg',
        } as unknown as Blob);
    }

    return formData;
};

export const requestTranslatedAudio = async ({
    file,
    sourceCode,
    targetCode,
}: {
    file: SelectedMediaFile;
    sourceCode: string;
    targetCode: string;
}) => {
    const baseUrl = getTranslationServerBaseUrl();
    const response = await fetch(`${baseUrl}/api/audio/translate`, {
        method: 'POST',
        headers: {
            Accept: 'audio/mpeg',
        },
        body: buildAudioFormData(file, sourceCode, targetCode),
    });

    if (!response.ok) {
        const serverMessage = await parseServerError(response);
        throw new Error(serverMessage);
    }

    const contentDisposition = response.headers.get('content-disposition') || '';
    const nameMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
    const fileName = nameMatch?.[1] || `translated-${targetCode}.mp3`;

    if (Platform.OS === 'web') {
        const blob = await response.blob();
        return {
            fileName,
            webBlob: blob,
            fileUri: '',
        };
    }

    const bytes = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(bytes);
    const outputPath = `${FileSystem.documentDirectory}${Date.now()}-${fileName}`;

    await FileSystem.writeAsStringAsync(outputPath, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });

    return {
        fileName,
        webBlob: null,
        fileUri: outputPath,
    };
};

export const downloadOrShareTranslatedAudio = async ({
    fileName,
    fileUri,
    webBlob,
}: {
    fileName: string;
    fileUri: string;
    webBlob: Blob | null;
}) => {
    if (Platform.OS === 'web') {
        if (!webBlob) {
            throw new Error('Missing translated audio blob for web download.');
        }

        const objectUrl = URL.createObjectURL(webBlob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);
        return;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
        throw new Error('File sharing is not available on this device.');
    }

    await Sharing.shareAsync(fileUri, {
        mimeType: 'audio/mpeg',
        UTI: 'public.mp3',
        dialogTitle: 'Download translated audio',
    });
};
