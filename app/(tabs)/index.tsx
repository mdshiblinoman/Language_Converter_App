import { useCallback, useMemo, useState } from 'react';
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

import { useVoiceInput } from '@/app/_hooks/use-voice-input';
import {
    SOURCE_LANGUAGES,
    TARGET_LANGUAGES,
    type Language,
} from '@/app/_lib/languages';
import {
    chunkTextForTranslation,
    translateTextInChunks,
} from '@/app/_lib/text-translation';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type PickerType = 'source' | 'target' | null;

const MAX_CHARS_PER_REQUEST = 450;

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

    const handleFinalTranscript = useCallback((transcript: string) => {
        setSourceText((current) =>
            current.trim().length > 0 ? `${current.trimEnd()} ${transcript}` : transcript
        );
    }, []);

    const {
        isListening,
        speechError,
        interimTranscript,
        startVoiceInput,
        stopVoiceInput,
        clearVoiceState,
    } = useVoiceInput({
        sourceLanguageCode: sourceLanguage.code,
        onFinalTranscript: handleFinalTranscript,
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
        clearVoiceState();
        setProgressIndex(0);
        setProgressTotal(0);
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
            const result = await translateTextInChunks({
                text,
                sourceCode: sourceLanguage.code,
                targetCode: targetLanguage.code,
                maxCharsPerRequest: MAX_CHARS_PER_REQUEST,
                onProgress: (index, total) => {
                    setProgressIndex(index);
                    setProgressTotal(total);
                },
            });

            setTranslatedText(result.translatedText);
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
                <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                    Text, paragraph, and document translation
                </ThemedText>

                <View style={styles.languageRow}>
                    <Pressable
                        onPress={() => openPicker('source')}
                        style={[
                            styles.languageButton,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}>
                        <ThemedText type="defaultSemiBold">From</ThemedText>
                        <ThemedText>{sourceLanguage.name}</ThemedText>
                        <ThemedText style={[styles.languageCode, { color: colors.textMuted }]}>
                            {sourceLanguage.code}
                        </ThemedText>
                    </Pressable>

                    <Pressable
                        onPress={handleSwap}
                        style={[
                            styles.swapButton,
                            { backgroundColor: colors.accentSoft, borderColor: colors.border },
                        ]}
                        accessibilityLabel="Swap languages">
                        <ThemedText type="defaultSemiBold" style={{ color: colors.accent }}>
                            Swap
                        </ThemedText>
                    </Pressable>

                    <Pressable
                        onPress={() => openPicker('target')}
                        style={[
                            styles.languageButton,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}>
                        <ThemedText type="defaultSemiBold">To</ThemedText>
                        <ThemedText>{targetLanguage.name}</ThemedText>
                        <ThemedText style={[styles.languageCode, { color: colors.textMuted }]}>
                            {targetLanguage.code}
                        </ThemedText>
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
                            onPress={isListening ? stopVoiceInput : startVoiceInput}
                            style={[
                                styles.secondaryButton,
                                styles.voiceButton,
                                {
                                    borderColor: colors.border,
                                    backgroundColor: isListening ? colors.accentSoft : 'transparent',
                                },
                            ]}>
                            <ThemedText
                                type="defaultSemiBold"
                                style={{ color: isListening ? colors.accent : undefined }}>
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
                    ]}>
                    {isTranslating ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator color="#ffffff" />
                            <ThemedText style={styles.translateButtonText}>
                                {progressTotal > 0 ? `Translating ${progressIndex}/${progressTotal}` : 'Translating'}
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
            </ScrollView>

            <Modal
                visible={activePicker !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setActivePicker(null)}>
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
                                    style={[styles.languageItem, { borderBottomColor: colors.border }]}>
                                    <ThemedText>{language.name}</ThemedText>
                                    <ThemedText style={{ color: colors.textMuted }}>{language.code}</ThemedText>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Pressable
                            onPress={() => setActivePicker(null)}
                            style={[styles.closeButton, { borderColor: colors.border }]}>
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
