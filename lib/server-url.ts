import { Platform } from 'react-native';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const getTranslationServerBaseUrl = () => {
    const configuredUrl = process.env.EXPO_PUBLIC_TRANSLATION_SERVER_URL?.trim();
    if (configuredUrl) return stripTrailingSlash(configuredUrl);

    // Reasonable defaults for local development; set EXPO_PUBLIC_TRANSLATION_SERVER_URL for real devices.
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:4000';
    }

    return 'http://localhost:4000';
};
