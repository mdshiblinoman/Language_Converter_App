import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

import { pickMediaFile } from '@/components/language-converter/file-picker';
import { LanguagePickerModal } from '@/components/language-converter/language-picker-modal';
import {
    getChooseFileButtonLabel,
    getInputPlaceholder,
    getMediaTypeLabel,
    getModeFlags,
    getPickerErrorMessage,
} from '@/components/language-converter/mode-config';
import type { PickerType, SelectedMediaFile } from '@/components/language-converter/types';
import { useAuth } from '@/hooks/use-auth';
import { useVoiceInput } from '@/hooks/use-voice-input';
import {
    downloadOrShareTranslatedAudio,
    requestTranslatedAudio,
} from '@/lib/audio-translation';
import { addChatHistoryEntry } from '@/lib/chat-history';
import {
    BASE_LANGUAGES,
    TARGET_LANGUAGES,
    type Language
} from '@/lib/languages';
import { translateTextInChunks } from '@/lib/text-translation';
import {
    downloadOrShareTranslatedVideo,
    requestTranslatedVideo,
} from '@/lib/video-translation';

const MAX_CHARS_PER_REQUEST = 450;

type LanguageConverterScreenProps = {
    modeLabel: string;
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
    const modeFlags = getModeFlags(modeLabel);

    const [sourceLanguage, setSourceLanguage] = useState<Language>(BASE_LANGUAGES[0]);
    const [targetLanguage, setTargetLanguage] = useState<Language>(TARGET_LANGUAGES[0]);
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [searchText, setSearchText] = useState('');
    const [activePicker, setActivePicker] = useState<PickerType>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isMediaSubmitting, setIsMediaSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [mediaStatus, setMediaStatus] = useState('');
    const [selectedMediaFile, setSelectedMediaFile] = useState<SelectedMediaFile | null>(null);

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

    const handlePickMediaFile = async () => {
        try {
            const mediaFile = await pickMediaFile(modeFlags);
            if (!mediaFile) return;
            setSelectedMediaFile(mediaFile);
            if (modeFlags.isAudioMode || modeFlags.isVideoMode) {
                setMediaStatus(
                    modeFlags.isAudioMode
                        ? 'Audio selected. Ready to translate and download.'
                        : 'Video selected. Ready to translate and download.'
                );
            }
        } catch (requestError) {
            console.error(requestError);
            setError(getPickerErrorMessage(modeFlags));
        }
    };

    const handleTranslateMediaAndDownload = async () => {
        if (!selectedMediaFile) {
            setError(modeFlags.isVideoMode ? 'Please choose a video file first.' : 'Please choose an audio file first.');
            return;
        }

        if (sourceLanguage.code !== 'auto' && sourceLanguage.code === targetLanguage.code) {
            setError('Source and target language cannot be the same.');
            return;
        }

        setError('');
        setIsMediaSubmitting(true);
        setMediaStatus(
            modeFlags.isVideoMode
                ? 'Uploading video and regenerating translated output...'
                : 'Uploading audio and converting language...'
        );

        try {
            if (modeFlags.isVideoMode) {
                const translatedResult = await requestTranslatedVideo({
                    file: selectedMediaFile,
                    sourceCode: sourceLanguage.code,
                    targetCode: targetLanguage.code,
                });

                setMediaStatus('Translated video ready. Download is starting...');
                await downloadOrShareTranslatedVideo(translatedResult);
                setMediaStatus('Translated video downloaded successfully.');
            } else {
                const translatedResult = await requestTranslatedAudio({
                    file: selectedMediaFile,
                    sourceCode: sourceLanguage.code,
                    targetCode: targetLanguage.code,
                });

                setMediaStatus('Translated audio ready. Download is starting...');
                await downloadOrShareTranslatedAudio(translatedResult);
                setMediaStatus('Translated audio downloaded successfully.');
            }
        } catch (requestError) {
            console.error(requestError);
            const message = requestError instanceof Error
                ? requestError.message
                : modeFlags.isVideoMode
                    ? 'Video translation failed.'
                    : 'Audio translation failed.';
            setError(message);
            setMediaStatus(message);
        } finally {
            setIsMediaSubmitting(false);
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
                        placeholder={getInputPlaceholder(modeFlags)}
                        placeholderTextColor="#64748b"
                        value={sourceText}
                        onChangeText={setSourceText}
                        multiline
                        textAlignVertical="top"
                        className="min-h-36 text-base leading-6 text-slate-900 dark:text-slate-100"
                    />

                    {modeFlags.isVoiceMode ? (
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

                    {modeFlags.isFileMode ? (
                        <View className="gap-2">
                            <Pressable
                                onPress={handlePickMediaFile}
                                className="min-h-11 items-center justify-center rounded-xl bg-cyan-700 dark:bg-cyan-600">
                                <Text className="font-semibold text-white">{getChooseFileButtonLabel(modeFlags)}</Text>
                            </Pressable>

                            {selectedMediaFile ? (
                                <View className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950">
                                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100" numberOfLines={1}>
                                        {selectedMediaFile.name}
                                    </Text>
                                    <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                                        {selectedMediaFile.mimeType || getMediaTypeLabel(modeFlags)} • {formatBytes(selectedMediaFile.size)}
                                    </Text>
                                </View>
                            ) : null}

                            {modeFlags.isAudioMode || modeFlags.isVideoMode ? (
                                <>
                                    <Pressable
                                        onPress={handleTranslateMediaAndDownload}
                                        disabled={isMediaSubmitting}
                                        className="min-h-11 items-center justify-center rounded-xl bg-emerald-700 dark:bg-emerald-500"
                                        style={{ opacity: isMediaSubmitting ? 0.7 : 1 }}>
                                        {isMediaSubmitting ? (
                                            <View className="flex-row items-center gap-2">
                                                <ActivityIndicator color="#ffffff" />
                                                <Text className="font-semibold text-white">
                                                    {modeFlags.isVideoMode ? 'Processing Video...' : 'Processing Audio...'}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text className="font-semibold text-white">
                                                {modeFlags.isVideoMode ? 'Translate Video & Download' : 'Translate Audio & Download'}
                                            </Text>
                                        )}
                                    </Pressable>

                                    {mediaStatus ? (
                                        <Text className="text-sm text-slate-600 dark:text-slate-300">{mediaStatus}</Text>
                                    ) : null}
                                </>
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

            <LanguagePickerModal
                activePicker={activePicker}
                searchText={searchText}
                filteredLanguages={filteredLanguages}
                onChangeSearchText={setSearchText}
                onSelectLanguage={handleSelectLanguage}
                onClose={() => setActivePicker(null)}
            />
        </View>
    );
}
