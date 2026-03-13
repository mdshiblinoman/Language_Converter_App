export type Language = {
    code: string;
    name: string;
};

export const BASE_LANGUAGES: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'bn', name: 'Bangla' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'tr', name: 'Turkish' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ur', name: 'Urdu' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ms', name: 'Malay' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'pl', name: 'Polish' },
    { code: 'uk', name: 'Ukrainian' },
];

export const SOURCE_LANGUAGES: Language[] = [{ code: 'auto', name: 'Auto Detect' }, ...BASE_LANGUAGES];
export const TARGET_LANGUAGES: Language[] = BASE_LANGUAGES;

export const SPEECH_LOCALE_BY_CODE: Record<string, string> = {
    en: 'en-US',
    bn: 'bn-BD',
    hi: 'hi-IN',
    ar: 'ar-SA',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-PT',
    ru: 'ru-RU',
    tr: 'tr-TR',
    ja: 'ja-JP',
    ko: 'ko-KR',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    ur: 'ur-PK',
    id: 'id-ID',
    ms: 'ms-MY',
    th: 'th-TH',
    vi: 'vi-VN',
    nl: 'nl-NL',
    sv: 'sv-SE',
    pl: 'pl-PL',
    uk: 'uk-UA',
};
