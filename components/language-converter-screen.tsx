import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { addChatHistoryEntry } from '@/lib/chat-history';
import {
    BASE_LANGUAGES,
    TARGET_LANGUAGES,
    type Language
} from '@/lib/languages';
import { translateTextInChunks } from '@/lib/text-translation';

type PickerType = 'source' | 'target' | null;

const MAX_CHARS_PER_REQUEST = 450;

type LanguageConverterScreenProps = {
    modeLabel: string;
};

type SelectedAudioFile = {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
};

const formatBytes = (size?: number) => {
    if (!size) return 'Unknown size';
    const mb = size / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(size / 1024).toFixed(0)} KB`;
};

export function LanguageConverterScreen({ modeLabel }: LanguageConverterScreenProps) {
    const router = useRouter();
    const { user } = useAuth();
    const latestRequestId = useRef(0);
    const isVoiceMode = modeLabel === 'Voice';
    const isAudioMode = modeLabel === 'Audio File';

    const [sourceLanguage, setSourceLanguage] = useState<Language>(BASE_LANGUAGES[0]);
    const [targetLanguage, setTargetLanguage] = useState<Language>(TARGET_LANGUAGES[0]);
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [searchText, setSearchText] = useState('');
    const [activePicker, setActivePicker] = useState<PickerType>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState('');
    const [selectedAudioFile, setSelectedAudioFile] = useState<SelectedAudioFile | null>(null);

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
    } = useVoiceInput({
        sourceLanguageCode: sourceLanguage.code,
        onFinalTranscript: handleFinalTranscript,
    });

    const pickerLanguages = activePicker === 'source' ? BASE_LANGUAGES : TARGET_LANGUAGES;

    const filteredLanguages = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) return pickerLanguages;

        return pickerLanguages.filter(
            (language) =>
                language.name.toLowerCase().includes(query) || language.code.toLowerCase().includes(query)
        );
    }, [pickerLanguages, searchText]);

    const openPicker = (type: PickerType) => {
        setSearchText('');
        setActivePicker(type);
    };

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
            if (language.code === sourceLanguage.code) {
                const fallback = BASE_LANGUAGES.find((item) => item.code !== language.code);
                if (fallback) {
                    setSourceLanguage(fallback);
                }
            }
        }

        setSearchText('');
        setActivePicker(null);
    };

    const handlePickAudioFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['audio/*'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled || result.assets.length === 0) return;

            const asset = result.assets[0];
            setSelectedAudioFile({
                uri: asset.uri,
                name: asset.name || 'audio-file',
                size: asset.size,
                mimeType: asset.mimeType,
            });
        } catch (requestError) {
            console.error(requestError);
            setError('Could not pick audio file. Please try again.');
        }
    };

    useEffect(() => {
        const normalizedText = sourceText.trim();

        if (!normalizedText) {
            setTranslatedText('');
            setError('');
            setIsTranslating(false);
            return;
        }

        if (sourceLanguage.code === targetLanguage.code) {
            setTranslatedText('');
            setError('Source and target language cannot be the same.');
            setIsTranslating(false);
            return;
        }

        setError('');

        const requestId = latestRequestId.current + 1;
        latestRequestId.current = requestId;

        const timerId = setTimeout(async () => {
            setIsTranslating(true);

            try {
                const result = await translateTextInChunks({
                    text: sourceText,
                    sourceCode: sourceLanguage.code,
                    targetCode: targetLanguage.code,
                    maxCharsPerRequest: MAX_CHARS_PER_REQUEST,
                });

                if (latestRequestId.current !== requestId) return;
                setTranslatedText(result.translatedText);

                if (user?.uid && sourceText.trim() && result.translatedText.trim()) {
                    await addChatHistoryEntry({
                        userId: user.uid,
                        modeLabel,
                        sourceLanguageCode: sourceLanguage.code,
                        targetLanguageCode: targetLanguage.code,
                        sourceText,
                        translatedText: result.translatedText,
                    });
                }
            } catch (requestError) {
                if (latestRequestId.current !== requestId) return;
                console.error(requestError);
                setError('Translation failed. Please try again.');
                setTranslatedText('');
            } finally {
                if (latestRequestId.current === requestId) {
                    setIsTranslating(false);
                }
            }
        }, 450);

        return () => {
            clearTimeout(timerId);
        };
    }, [modeLabel, sourceText, sourceLanguage.code, targetLanguage.code, user?.uid]);

    return (
        <View className="flex-1 bg-cyan-50 dark:bg-slate-950">
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-3.5 px-4 pb-10 pt-6"
                keyboardShouldPersistTaps="handled">
                <View className="flex-row items-center justify-between">
                    <Pressable
                        onPress={() => router.back()}
                        className="h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <Ionicons name="arrow-back" size={20} color="#334155" />
                    </Pressable>
                    <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">Language Converter</Text>
                    <View className="h-10 w-10" />
                </View>

                <View className="rounded-2xl border border-cyan-300 bg-cyan-100 p-3 dark:border-cyan-700 dark:bg-cyan-950">
                    <Text className="text-sm font-semibold text-cyan-900 dark:text-cyan-200">Selected Mode: {modeLabel}</Text>
                </View>

                <View className="flex-row items-stretch gap-2">
                    <Pressable
                        onPress={() => openPicker('source')}
                        className="flex-1 gap-0.5 rounded-2xl border border-amber-300 bg-amber-100 p-2.5 dark:border-amber-700 dark:bg-amber-950">
                        <Text className="text-base font-semibold text-amber-900 dark:text-amber-200">From</Text>
                        <Text className="text-base text-amber-900 dark:text-amber-200">{sourceLanguage.name}</Text>
                        <Text className="text-xs text-amber-700 dark:text-amber-300">{sourceLanguage.code}</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => openPicker('target')}
                        className="flex-1 gap-0.5 rounded-2xl border border-emerald-300 bg-emerald-100 p-2.5 dark:border-emerald-700 dark:bg-emerald-950">
                        <Text className="text-base font-semibold text-emerald-900 dark:text-emerald-200">To</Text>
                        <Text className="text-base text-emerald-900 dark:text-emerald-200">{targetLanguage.name}</Text>
                        <Text className="text-xs text-emerald-700 dark:text-emerald-300">{targetLanguage.code}</Text>
                    </Pressable>
                </View>

                <View className="gap-2 rounded-2xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Input Text</Text>
                    <TextInput
                        placeholder={isVoiceMode ? 'Speak using the mic or type text here...' : isAudioMode ? 'Choose audio file, or type transcript text here...' : 'Type text here...'}
                        placeholderTextColor="#64748b"
                        value={sourceText}
                        onChangeText={setSourceText}
                        multiline
                        textAlignVertical="top"
                        className="min-h-36 text-base leading-6 text-slate-900 dark:text-slate-100"
                    />

                    {isVoiceMode ? (
                        <View className="gap-2">
                            <Pressable
                                onPress={isListening ? stopVoiceInput : startVoiceInput}
                                accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
                                className={`min-h-11 items-center justify-center rounded-xl ${isListening
                                    ? 'bg-rose-700 dark:bg-rose-600'
                                    : 'bg-cyan-700 dark:bg-cyan-600'
                                    }`}>
                                <Text className="font-semibold text-white">
                                    {isListening ? 'Stop Voice Input' : 'Start Voice Input'}
                                </Text>
                            </Pressable>

                            {interimTranscript ? (
                                <Text className="text-sm text-slate-600 dark:text-slate-300">
                                    Listening: {interimTranscript}
                                </Text>
                            ) : null}

                            {speechError ? <Text className="text-sm font-semibold text-red-700">{speechError}</Text> : null}
                        </View>
                    ) : null}

                    {isAudioMode ? (
                        <View className="gap-2">
                            <Pressable
                                onPress={handlePickAudioFile}
                                className="min-h-11 items-center justify-center rounded-xl bg-cyan-700 dark:bg-cyan-600">
                                <Text className="font-semibold text-white">Choose Audio File</Text>
                            </Pressable>

                            {selectedAudioFile ? (
                                <View className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950">
                                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100" numberOfLines={1}>
                                        {selectedAudioFile.name}
                                    </Text>
                                    <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                                        {selectedAudioFile.mimeType || 'audio'} • {formatBytes(selectedAudioFile.size)}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}
                </View>

                {isTranslating ? (
                    <View className="flex-row items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-100 py-3 dark:border-cyan-700 dark:bg-cyan-950">
                        <ActivityIndicator color="#0e7490" />
                        <Text className="font-semibold text-cyan-900 dark:text-cyan-200">Auto translating...</Text>
                    </View>
                ) : null}

                {error ? <Text className="font-semibold text-red-700">{error}</Text> : null}

                <View className="min-h-28 gap-2 rounded-2xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Translated Text</Text>
                    <Text
                        className={`text-base leading-6 ${translatedText ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-300'}`}>
                        {translatedText || 'Your translated result will appear here.'}
                    </Text>
                </View>
            </ScrollView>

            <Modal
                visible={activePicker !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setActivePicker(null)}>
                <View className="flex-1 justify-end bg-black/35">
                    <View className="max-h-[75%] gap-2.5 rounded-t-2xl border border-slate-300 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900">
                        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">Select Language</Text>
                        <TextInput
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search language..."
                            placeholderTextColor="#64748b"
                            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />

                        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-2.5">
                            {filteredLanguages.map((language) => (
                                <Pressable
                                    key={language.code}
                                    onPress={() => handleSelectLanguage(language)}
                                    className="flex-row items-center justify-between border-b border-slate-300 py-3 dark:border-slate-700">
                                    <Text className="text-base text-slate-900 dark:text-slate-100">{language.name}</Text>
                                    <Text className="text-base text-slate-500 dark:text-slate-300">{language.code}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Pressable
                            onPress={() => setActivePicker(null)}
                            className="items-center rounded-xl border border-lime-300 bg-lime-100 py-2.5 dark:border-lime-700 dark:bg-lime-950">
                            <Text className="text-base font-semibold text-lime-900 dark:text-lime-200">Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
