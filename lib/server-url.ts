import Constants from 'expo-constants';
import { Platform } from 'react-native';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getExpoLanHost = () => {
    const hostUri =
        Constants.expoConfig?.hostUri ||
        Constants.manifest2?.extra?.expoGo?.debuggerHost ||
        Constants.manifest?.debuggerHost;

    if (!hostUri) return null;
    const host = String(hostUri).split(':')[0]?.trim();
    return host || null;
};

export const getTranslationServerBaseUrl = () => {
    const configuredUrl = process.env.EXPO_PUBLIC_TRANSLATION_SERVER_URL?.trim();
    if (configuredUrl) return stripTrailingSlash(configuredUrl);

    const lanHost = getExpoLanHost();
    if (lanHost) {
        return `http://${lanHost}:4000`;
    }

    // Reasonable defaults for local development; set EXPO_PUBLIC_TRANSLATION_SERVER_URL for real devices.
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:4000';
    }

    return 'http://localhost:4000';
};
