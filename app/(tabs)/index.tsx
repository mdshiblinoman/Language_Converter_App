import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Language = {
    code: string;
    name: string;
};

type PickerType = 'source' | 'target' | null;

type HistoryItem = {
    id: string;
    sourceCode: string;
    targetCode: string;
    inputPreview: string;
    outputPreview: string;
};

const BASE_LANGUAGES: Language[] = [
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

const SOURCE_LANGUAGES: Language[] = [{ code: 'auto', name: 'Auto Detect' }, ...BASE_LANGUAGES];
const TARGET_LANGUAGES: Language[] = BASE_LANGUAGES;

const SPEECH_LOCALE_BY_CODE: Record<string, string> = {
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

const MAX_CHARS_PER_REQUEST = 450;
const MAX_HISTORY = 5;
const MAX_RETRIES = 2;

const lightColors = {
    bg: '#f4f7ff',
    card: '#ffffff',
    textMuted: '#5e6470',
    border: '#d6deec',
    accent: '#1060ff',
    accentSoft: '#e6efff',
    successSoft: '#e9f8ef',
    successText: '#146c43',
};

const darkColors = {
    bg: '#0d111a',
    card: '#141b28',
    textMuted: '#a9b2c7',
    border: '#2a3345',
    accent: '#6ea3ff',
    accentSoft: '#1c2a44',
    successSoft: '#163326',
    successText: '#7fe2ae',
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getLanguageName = (code: string) => {
    const language = SOURCE_LANGUAGES.find((item) => item.code === code);
    return language?.name ?? code;
};

const buildPreview = (text: string, maxLength: number) => {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength)}...`;
};

const splitLargeToken = (token: string, maxChars: number) => {
    if (token.length <= maxChars) return [token];

    const parts: string[] = [];
    let current = '';
    const segments = token.split(/(\s+)/);

    for (const segment of segments) {
        if (!segment) continue;

        if (segment.length > maxChars) {
            if (current) {
                parts.push(current);
                current = '';
            }

            for (let index = 0; index < segment.length; index += maxChars) {
                parts.push(segment.slice(index, index + maxChars));
            }
            continue;
        }

        if ((current + segment).length > maxChars) {
            if (current) parts.push(current);
            current = segment;
        } else {
            current += segment;
        }
    }

    if (current) parts.push(current);
    return parts;
};

const chunkTextForTranslation = (text: string, maxChars: number) => {
    const chunks: string[] = [];
    let current = '';
    const tokens = text.split(/(\n+)/);

    for (const token of tokens) {
        if (!token) continue;

        const tokenParts = splitLargeToken(token, maxChars);

        for (const part of tokenParts) {
            if ((current + part).length > maxChars) {
                if (current) chunks.push(current);
                current = part;
            } else {
                current += part;
            }
        }
    }

    if (current) chunks.push(current);
    return chunks;
};

const requestTranslation = async (chunk: string, sourceCode: string, targetCode: string) => {
    const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(`${sourceCode}|${targetCode}`)}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const output = data?.responseData?.translatedText;

    if (!output) {
        throw new Error('No translation returned by the API.');
    }

    return output as string;
};

const translateChunkWithRetry = async (chunk: string, sourceCode: string, targetCode: string) => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
            return await requestTranslation(chunk, sourceCode, targetCode);
        } catch (error) {
            if (attempt === MAX_RETRIES) throw error;
            await wait(300 + attempt * 300);
        }
    }

    throw new Error('Translation retry failed.');
};

export default function HomeScreen() {
    const scheme = useColorScheme();
    const colors = scheme === 'dark' ? darkColors : lightColors;

    const [sourceLanguage, setSourceLanguage] = useState<Language>(SOURCE_LANGUAGES[0]);
    const [targetLanguage, setTargetLanguage] = useState<Language>(TARGET_LANGUAGES[0]);
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [searchText, setSearchText] = useState('');
    const [activePicker, setActivePicker] = useState<PickerType>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState('');
    const [progressIndex, setProgressIndex] = useState(0);
    const [progressTotal, setProgressTotal] = useState(0);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');

    useSpeechRecognitionEvent('start', () => {
        setIsListening(true);
        setSpeechError('');
    });

    useSpeechRecognitionEvent('end', () => {
        setIsListening(false);
        setInterimTranscript('');
    });

    useSpeechRecognitionEvent('error', (event) => {
        setIsListening(false);
        setInterimTranscript('');
        setSpeechError(event.message ?? 'Voice input failed. Please try again.');
    });

    useSpeechRecognitionEvent('result', (event) => {
        const transcript = event.results?.[0]?.transcript?.trim();
        if (!transcript) return;

        if (event.isFinal) {
            setSourceText((current) =>
                current.trim().length > 0 ? `${current.trimEnd()} ${transcript}` : transcript
            );
            setInterimTranscript('');
            return;
        }

        setInterimTranscript(transcript);
    });

    const pickerLanguages = activePicker === 'source' ? SOURCE_LANGUAGES : TARGET_LANGUAGES;

    const filteredLanguages = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) return pickerLanguages;

        return pickerLanguages.filter(
            (language) =>
                language.name.toLowerCase().includes(query) || language.code.toLowerCase().includes(query)
        );
    }, [pickerLanguages, searchText]);

    const chunkCount = useMemo(
        () => chunkTextForTranslation(sourceText, MAX_CHARS_PER_REQUEST).length,
        [sourceText]
    );

    const handleSelectLanguage = (language: Language) => {
        if (activePicker === 'source') {
            setSourceLanguage(language);
            if (language.code !== 'auto' && language.code === targetLanguage.code) {
                const fallback = TARGET_LANGUAGES.find((item) => item.code !== language.code);
                if (fallback) setTargetLanguage(fallback);
            }
        }

        if (activePicker === 'target') {
            setTargetLanguage(language);
            if (sourceLanguage.code !== 'auto' && language.code === sourceLanguage.code) {
                const fallback = SOURCE_LANGUAGES.find(
                    (item) => item.code !== 'auto' && item.code !== language.code
                );
                if (fallback) setSourceLanguage(fallback);
            }
        }

        setSearchText('');
        setActivePicker(null);
    };

    const handleSwap = () => {
        if (sourceLanguage.code === 'auto') {
            const english = TARGET_LANGUAGES.find((item) => item.code === 'en') ?? TARGET_LANGUAGES[0];
            setSourceLanguage(targetLanguage);
            setTargetLanguage(english.code === targetLanguage.code ? TARGET_LANGUAGES[1] : english);
        } else {
            setSourceLanguage(targetLanguage);
            setTargetLanguage(sourceLanguage);
        }

        setSourceText(translatedText || sourceText);
        setTranslatedText(sourceText);
        setError('');
    };

    const handleClear = () => {
        setSourceText('');
        setTranslatedText('');
        setError('');
        setSpeechError('');
        setInterimTranscript('');
        setProgressIndex(0);
        setProgressTotal(0);
    };

    const handleStartVoiceInput = async () => {
        try {
            const isAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
            if (!isAvailable) {
                setSpeechError('Voice recognition is not available on this device.');
                return;
            }

            const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!permission.granted) {
                setSpeechError('Microphone or speech permission was not granted.');
                return;
            }

            const locale =
                sourceLanguage.code !== 'auto'
                    ? SPEECH_LOCALE_BY_CODE[sourceLanguage.code] ?? 'en-US'
                    : undefined;

            setSpeechError('');

            ExpoSpeechRecognitionModule.start({
                lang: locale,
                interimResults: true,
                maxAlternatives: 1,
                continuous: false,
            });
        } catch (voiceError) {
            console.error(voiceError);
            setSpeechError('Could not start voice input. Please try again.');
        }
    };

    const handleStopVoiceInput = () => {
        try {
            ExpoSpeechRecognitionModule.stop();
        } catch (voiceError) {
            console.error(voiceError);
        }
    };

    const pushHistory = (inputText: string, outputText: string) => {
        const nextItem: HistoryItem = {
            id: `${Date.now()}`,
            sourceCode: sourceLanguage.code,
            targetCode: targetLanguage.code,
            inputPreview: buildPreview(inputText, 80),
            outputPreview: buildPreview(outputText, 80),
        };

        setHistory((current) => [nextItem, ...current].slice(0, MAX_HISTORY));
    };

    const handleTranslate = async () => {
        const text = sourceText;

        if (!text.trim()) {
            setError('Please enter text to translate.');
            setTranslatedText('');
            return;
        }

        if (sourceLanguage.code !== 'auto' && sourceLanguage.code === targetLanguage.code) {
            setError('Source and target language cannot be the same.');
            setTranslatedText('');
            return;
        }

        setError('');
        setIsTranslating(true);

        try {
            const chunks = chunkTextForTranslation(text, MAX_CHARS_PER_REQUEST);
            const translatedChunks: string[] = [];
            setProgressTotal(chunks.length);
            setProgressIndex(0);

            for (let index = 0; index < chunks.length; index += 1) {
                const chunk = chunks[index];
                setProgressIndex(index + 1);

                const translatedChunk = await translateChunkWithRetry(
                    chunk,
                    sourceLanguage.code,
                    targetLanguage.code
                );

                translatedChunks.push(translatedChunk);
            }

            const finalResult = translatedChunks.join('');
            setTranslatedText(finalResult);
            pushHistory(text, finalResult);
        } catch (requestError) {
            console.error(requestError);
            setError('Translation failed for this text. Please try again.');
            setTranslatedText('');
        } finally {
            setIsTranslating(false);
            setProgressIndex(0);
            setProgressTotal(0);
        }
    };

    const openPicker = (type: PickerType) => {
        setSearchText('');
        setActivePicker(type);
    };

    return (
        <ThemedView style={[styles.screen, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <ThemedText type="title">Language Converter</ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>Text, paragraph, and document translation</ThemedText>

                <View style={styles.languageRow}>
                    <Pressable
                        onPress={() => openPicker('source')}
                        style={[styles.languageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <ThemedText type="defaultSemiBold">From</ThemedText>
                        <ThemedText>{sourceLanguage.name}</ThemedText>
                        <ThemedText style={[styles.languageCode, { color: colors.textMuted }]}>{sourceLanguage.code}</ThemedText>
                    </Pressable>

                    <Pressable
                        onPress={handleSwap}
                        style={[styles.swapButton, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
                        accessibilityLabel="Swap languages"
                    >
                        <ThemedText type="defaultSemiBold" style={{ color: colors.accent }}>
                            Swap
                        </ThemedText>
                    </Pressable>

                    <Pressable
                        onPress={() => openPicker('target')}
                        style={[styles.languageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <ThemedText type="defaultSemiBold">To</ThemedText>
                        <ThemedText>{targetLanguage.name}</ThemedText>
                        <ThemedText style={[styles.languageCode, { color: colors.textMuted }]}>{targetLanguage.code}</ThemedText>
                    </Pressable>
                </View>

                <View style={[styles.infoRow, { backgroundColor: colors.successSoft, borderColor: colors.border }]}>
                    <ThemedText style={[styles.infoText, { color: colors.successText }]}>
                        {`Characters: ${sourceText.length} | Chunks: ${chunkCount}`}
                    </ThemedText>
                </View>

                <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ThemedText type="defaultSemiBold">Input Text</ThemedText>
                    <TextInput
                        placeholder="Type word, paragraph, or full document here..."
                        placeholderTextColor={colors.textMuted}
                        value={sourceText}
                        onChangeText={setSourceText}
                        multiline
                        textAlignVertical="top"
                        style={[styles.textArea, { color: scheme === 'dark' ? '#ffffff' : '#111111' }]}
                    />

                    <View style={styles.actionsRow}>
                        <Pressable
                            onPress={isListening ? handleStopVoiceInput : handleStartVoiceInput}
                            style={[
                                styles.secondaryButton,
                                styles.voiceButton,
                                {
                                    borderColor: colors.border,
                                    backgroundColor: isListening ? colors.accentSoft : 'transparent',
                                },
                            ]}
                        >
                            <ThemedText type="defaultSemiBold" style={{ color: isListening ? colors.accent : undefined }}>
                                {isListening ? 'Stop Voice' : 'Voice Input'}
                            </ThemedText>
                        </Pressable>
                        <Pressable onPress={handleClear} style={[styles.secondaryButton, { borderColor: colors.border }]}>
                            <ThemedText type="defaultSemiBold">Clear</ThemedText>
                        </Pressable>
                    </View>

                    {interimTranscript ? (
                        <ThemedText style={[styles.voiceHint, { color: colors.textMuted }]}>
                            {`Listening: ${interimTranscript}`}
                        </ThemedText>
                    ) : null}

                    {speechError ? <ThemedText style={styles.errorText}>{speechError}</ThemedText> : null}
                </View>

                <Pressable
                    onPress={handleTranslate}
                    disabled={isTranslating}
                    style={[
                        styles.translateButton,
                        { backgroundColor: colors.accent, opacity: isTranslating ? 0.7 : 1 },
                    ]}
                >
                    {isTranslating ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator color="#ffffff" />
                            <ThemedText style={styles.translateButtonText}>
                                {progressTotal > 0
                                    ? `Translating ${progressIndex}/${progressTotal}`
                                    : 'Translating'}
                            </ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={styles.translateButtonText}>Translate</ThemedText>
                    )}
                </Pressable>

                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

                <View style={[styles.outputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ThemedText type="defaultSemiBold">Translated Text</ThemedText>
                    <ThemedText style={[styles.outputText, { color: translatedText ? undefined : colors.textMuted }]}>
                        {translatedText || 'Your translated result will appear here.'}
                    </ThemedText>
                </View>

                {history.length > 0 ? (
                    <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <ThemedText type="defaultSemiBold">Recent Translations</ThemedText>
                        {history.map((item) => (
                            <View key={item.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                                <ThemedText style={[styles.historyLang, { color: colors.textMuted }]}>
                                    {`${getLanguageName(item.sourceCode)} -> ${getLanguageName(item.targetCode)}`}
                                </ThemedText>
                                <ThemedText numberOfLines={1}>{item.inputPreview}</ThemedText>
                                <ThemedText numberOfLines={1} style={{ color: colors.textMuted }}>
                                    {item.outputPreview}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                ) : null}
            </ScrollView>

            <Modal
                visible={activePicker !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setActivePicker(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <ThemedText type="subtitle">Select Language</ThemedText>
                        <TextInput
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search language..."
                            placeholderTextColor={colors.textMuted}
                            style={[
                                styles.searchInput,
                                {
                                    borderColor: colors.border,
                                    color: scheme === 'dark' ? '#ffffff' : '#111111',
                                    backgroundColor: scheme === 'dark' ? '#0c1320' : '#f8faff',
                                },
                            ]}
                        />

                        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listWrap}>
                            {filteredLanguages.map((language) => (
                                <Pressable
                                    key={language.code}
                                    onPress={() => handleSelectLanguage(language)}
                                    style={[styles.languageItem, { borderBottomColor: colors.border }]}
                                >
                                    <ThemedText>{language.name}</ThemedText>
                                    <ThemedText style={{ color: colors.textMuted }}>{language.code}</ThemedText>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Pressable
                            onPress={() => setActivePicker(null)}
                            style={[styles.closeButton, { borderColor: colors.border }]}
                        >
                            <ThemedText type="defaultSemiBold">Close</ThemedText>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 40,
        gap: 14,
    },
    subtitle: {
        marginTop: -6,
        marginBottom: 6,
    },
    languageRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'stretch',
    },
    languageButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 14,
        padding: 10,
        gap: 2,
    },
    languageCode: {
        fontSize: 12,
    },
    swapButton: {
        borderWidth: 1,
        borderRadius: 14,
        justifyContent: 'center',
        paddingHorizontal: 14,
    },
    infoRow: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    infoText: {
        fontSize: 13,
        fontWeight: '600',
    },
    inputCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 8,
    },
    textArea: {
        minHeight: 160,
        fontSize: 16,
        lineHeight: 22,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-end',
    },
    voiceButton: {
        minWidth: 110,
    },
    voiceHint: {
        fontSize: 13,
        fontWeight: '500',
    },
    secondaryButton: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    translateButton: {
        borderRadius: 12,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    translateButtonText: {
        color: '#ffffff',
        fontWeight: '700',
    },
    errorText: {
        color: '#c62828',
        fontWeight: '600',
    },
    outputCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 8,
        minHeight: 120,
    },
    outputText: {
        fontSize: 16,
        lineHeight: 24,
    },
    historyCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 10,
    },
    historyItem: {
        borderBottomWidth: 1,
        paddingBottom: 8,
        gap: 4,
    },
    historyLang: {
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    modalSheet: {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderWidth: 1,
        padding: 14,
        maxHeight: '75%',
        gap: 10,
    },
    searchInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    listWrap: {
        paddingBottom: 10,
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingVertical: 12,
    },
    closeButton: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
});
