import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { getTranslationServerBaseUrl } from '@/lib/server-url';

export type PickedPdf = {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
    webFile?: File;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let index = 0; index < bytes.byteLength; index += 1) {
        binary += String.fromCharCode(bytes[index]);
    }

    return globalThis.btoa(binary);
};

const buildFormData = (file: PickedPdf, sourceCode: string, targetCode: string) => {
    const formData = new FormData();
    formData.append('sourceCode', sourceCode);
    formData.append('targetCode', targetCode);

    if (Platform.OS === 'web' && file.webFile) {
        formData.append('pdf', file.webFile, file.name);
    } else {
        formData.append('pdf', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/pdf',
        } as unknown as Blob);
    }

    return formData;
};

const parseServerError = async (response: Response) => {
    try {
        const payload = await response.json();
        return payload?.message || `Request failed with status ${response.status}`;
    } catch {
        return `Request failed with status ${response.status}`;
    }
};

export const pickPdfFile = async (): Promise<PickedPdf | null> => {
    const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
    });

    if (result.canceled || result.assets.length === 0) {
        return null;
    }

    const asset = result.assets[0];

    return {
        uri: asset.uri,
        name: asset.name || 'document.pdf',
        mimeType: asset.mimeType || 'application/pdf',
        size: asset.size,
        webFile: asset.file,
    };
};

export const requestTranslatedPdf = async ({
    file,
    sourceCode,
    targetCode,
}: {
    file: PickedPdf;
    sourceCode: string;
    targetCode: string;
}) => {
    const baseUrl = getTranslationServerBaseUrl();
    const response = await fetch(`${baseUrl}/api/pdf/translate`, {
        method: 'POST',
        headers: {
            Accept: 'application/pdf',
        },
        body: buildFormData(file, sourceCode, targetCode),
    });

    if (!response.ok) {
        const serverMessage = await parseServerError(response);
        throw new Error(serverMessage);
    }

    const contentDisposition = response.headers.get('content-disposition') || '';
    const nameMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
    const fileName = nameMatch?.[1] || `translated-${targetCode}.pdf`;

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

export const downloadOrShareTranslatedPdf = async ({
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
            throw new Error('Missing translated blob for web download.');
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
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Download translated PDF',
    });
};
