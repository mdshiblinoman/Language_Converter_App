import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    SOURCE_LANGUAGES,
    TARGET_LANGUAGES,
    type Language,
} from '@/lib/languages';
import { translateTextInChunks } from '@/lib/text-translation';

type PickerType = 'source' | 'target' | null;

const MAX_CHARS_PER_REQUEST = 450;

type LanguageConverterScreenProps = {
    modeLabel: string;
};

export function LanguageConverterScreen({ modeLabel }: LanguageConverterScreenProps) {
    const router = useRouter();

    const [sourceLanguage, setSourceLanguage] = useState<Language>(SOURCE_LANGUAGES[0]);
    const [targetLanguage, setTargetLanguage] = useState<Language>(TARGET_LANGUAGES[0]);
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [searchText, setSearchText] = useState('');
    const [activePicker, setActivePicker] = useState<PickerType>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState('');

    const pickerLanguages = activePicker === 'source' ? SOURCE_LANGUAGES : TARGET_LANGUAGES;

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

    const handleTranslate = async () => {
        if (!sourceText.trim()) {
            setError('Please enter text to translate.');
            return;
        }

        if (sourceLanguage.code !== 'auto' && sourceLanguage.code === targetLanguage.code) {
            setError('Source and target language cannot be the same.');
            return;
        }

        setError('');
        setIsTranslating(true);

        try {
            const result = await translateTextInChunks({
                text: sourceText,
                sourceCode: sourceLanguage.code,
                targetCode: targetLanguage.code,
                maxCharsPerRequest: MAX_CHARS_PER_REQUEST,
            });

            setTranslatedText(result.translatedText);
        } catch (requestError) {
            console.error(requestError);
            setError('Translation failed. Please try again.');
            setTranslatedText('');
        } finally {
            setIsTranslating(false);
        }
    };

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
                        placeholder="Type text here..."
                        placeholderTextColor="#64748b"
                        value={sourceText}
                        onChangeText={setSourceText}
                        multiline
                        textAlignVertical="top"
                        className="min-h-36 text-base leading-6 text-slate-900 dark:text-slate-100"
                    />
                </View>

                <Pressable
                    onPress={handleTranslate}
                    disabled={isTranslating}
                    className="min-h-12 items-center justify-center rounded-xl bg-cyan-700 dark:bg-cyan-600"
                    style={{ opacity: isTranslating ? 0.7 : 1 }}>
                    {isTranslating ? (
                        <View className="flex-row items-center gap-2">
                            <ActivityIndicator color="#ffffff" />
                            <Text className="font-bold text-white">Translating</Text>
                        </View>
                    ) : (
                        <Text className="font-bold text-white">Translate</Text>
                    )}
                </Pressable>

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
