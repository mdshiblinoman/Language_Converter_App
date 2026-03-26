import * as DocumentPicker from 'expo-document-picker';

import {
    getFallbackFileName,
    getPickerType,
} from '@/components/language-converter/mode-config';
import type { ModeFlags, SelectedMediaFile } from '@/components/language-converter/types';

export const pickMediaFile = async (flags: ModeFlags): Promise<SelectedMediaFile | null> => {
    const result = await DocumentPicker.getDocumentAsync({
        type: getPickerType(flags),
        copyToCacheDirectory: true,
        multiple: false,
    });

    if (result.canceled || result.assets.length === 0) return null;

    const asset = result.assets[0];
    return {
        uri: asset.uri,
        name: asset.name || getFallbackFileName(flags),
        size: asset.size,
        mimeType: asset.mimeType,
        webFile: asset.file,
    };
};
