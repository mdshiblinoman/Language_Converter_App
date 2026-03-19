import { Ionicons } from '@expo/vector-icons';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

import { SignInForm } from '@/auth/sign-in-form';
import { SignUpForm } from '@/auth/sign-up-form';
import { PdfTranslationCard } from '@/components/pdf-translation-card';
import { useAuth } from '@/hooks/use-auth';
import { useVoiceInput } from '@/hooks/use-voice-input';
import {
    SOURCE_LANGUAGES,
    TARGET_LANGUAGES,
    type Language,
} from '@/lib/languages';
import {
    translateTextInChunks,
} from '@/lib/text-translation';
import { auth } from '@/services/firebase';

type PickerType = 'source' | 'target' | null;

const MAX_CHARS_PER_REQUEST = 450;

export default function HomeScreen() {
    const { user, isAuthLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
    const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
    const [authError, setAuthError] = useState('');

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

    const handleSignIn = async () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            setAuthError('Please enter both email and password.');
            return;
        }

        setAuthError('');
        setIsAuthSubmitting(true);

        try {
            await signInWithEmailAndPassword(auth, normalizedEmail, password);
            setPassword('');
        } catch (requestError) {
            console.error(requestError);
            setAuthError('Authentication failed. Check your credentials and try again.');
        } finally {
            setIsAuthSubmitting(false);
        }
    };

    const handleSignUp = async () => {
        const normalizedName = fullName.trim();
        const normalizedPhone = phoneNumber.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedName || !normalizedPhone || !normalizedEmail || !password || !confirmPassword) {
            setAuthError('Please fill name, phone number, email, password, and confirm password.');
            return;
        }

        const phoneDigits = normalizedPhone.replace(/\D/g, '');
        if (phoneDigits.length < 8) {
            setAuthError('Please enter a valid phone number.');
            return;
        }

        if (password.length < 6) {
            setAuthError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setAuthError('Password and confirm password do not match.');
            return;
        }

        setAuthError('');
        setIsAuthSubmitting(true);

        try {
            const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            await updateProfile(credential.user, { displayName: normalizedName });
            setPassword('');
            setConfirmPassword('');
        } catch (requestError) {
            console.error(requestError);
            setAuthError('Authentication failed. Check your credentials and try again.');
        } finally {
            setIsAuthSubmitting(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (requestError) {
            console.error(requestError);
            setError('Unable to sign out right now. Please try again.');
        }
    };

    if (isAuthLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-950">
                <ActivityIndicator size="large" color="#334155" />
                <Text className="mt-3 text-base text-slate-600 dark:text-slate-300">Checking session...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <ScrollView
                className="flex-1 bg-cyan-50 dark:bg-slate-950"
                contentContainerClassName="flex-grow justify-center px-4 py-8"
                keyboardShouldPersistTaps="handled">
                <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    {authMode === 'sign-in' ? (
                        <SignInForm
                            email={email}
                            password={password}
                            isSubmitting={isAuthSubmitting}
                            authError={authError}
                            onEmailChange={setEmail}
                            onPasswordChange={setPassword}
                            onSubmit={handleSignIn}
                            onSwitchToSignUp={() => {
                                setAuthMode('sign-up');
                                setAuthError('');
                            }}
                        />
                    ) : (
                        <SignUpForm
                            name={fullName}
                            phoneNumber={phoneNumber}
                            email={email}
                            password={password}
                            confirmPassword={confirmPassword}
                            isSubmitting={isAuthSubmitting}
                            authError={authError}
                            onNameChange={setFullName}
                            onPhoneNumberChange={setPhoneNumber}
                            onEmailChange={setEmail}
                            onPasswordChange={setPassword}
                            onConfirmPasswordChange={setConfirmPassword}
                            onSubmit={handleSignUp}
                            onSwitchToSignIn={() => {
                                setAuthMode('sign-in');
                                setAuthError('');
                            }}
                        />
                    )}
                </View>
            </ScrollView>
        );
    }

    return (
        <View className="flex-1 bg-slate-100 dark:bg-slate-950">
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-3.5 px-4 pb-10 pt-6"
                keyboardShouldPersistTaps="handled">
                <Text className="text-4xl font-bold leading-9 text-slate-900 dark:text-slate-50">
                    Language Converter
                </Text>
                <Text className="-mt-1.5 mb-1.5 text-base text-slate-500 dark:text-slate-300">
                    Text, paragraph, and document translation
                </Text>

                <View className="-mt-1 mb-1.5 flex-row items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                    <Text className="flex-1 pr-3 text-sm text-slate-600 dark:text-slate-300" numberOfLines={1}>
                        Signed in as {user.email ?? 'user'}
                    </Text>
                    <Pressable
                        onPress={handleSignOut}
                        className="rounded-lg border border-rose-300 bg-rose-100 px-3 py-1.5 dark:border-rose-700 dark:bg-rose-950">
                        <Text className="font-semibold text-rose-900 dark:text-rose-200">Sign Out</Text>
                    </Pressable>
                </View>

                <View className="flex-row items-stretch gap-2">
                    <Pressable
                        onPress={() => openPicker('source')}
                        className="flex-1 gap-0.5 rounded-2xl border border-amber-300 bg-amber-100 p-2.5 dark:border-amber-700 dark:bg-amber-950">
                        <Text className="text-base font-semibold text-amber-900 dark:text-amber-200">From</Text>
                        <Text className="text-base text-amber-900 dark:text-amber-200">{sourceLanguage.name}</Text>
                        <Text className="text-xs text-amber-700 dark:text-amber-300">
                            {sourceLanguage.code}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleSwap}
                        className="justify-center rounded-2xl border border-cyan-300 bg-cyan-100 px-3.5 dark:border-cyan-700 dark:bg-cyan-950"
                        accessibilityLabel="Swap languages">
                        <Text className="text-base font-semibold text-cyan-800 dark:text-cyan-300">Swap</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => openPicker('target')}
                        className="flex-1 gap-0.5 rounded-2xl border border-emerald-300 bg-emerald-100 p-2.5 dark:border-emerald-700 dark:bg-emerald-950">
                        <Text className="text-base font-semibold text-emerald-900 dark:text-emerald-200">To</Text>
                        <Text className="text-base text-emerald-900 dark:text-emerald-200">{targetLanguage.name}</Text>
                        <Text className="text-xs text-emerald-700 dark:text-emerald-300">
                            {targetLanguage.code}
                        </Text>
                    </Pressable>
                </View>

                <View className="gap-2 rounded-2xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Input Text</Text>
                    <TextInput
                        placeholder="Type word, paragraph, or full document here..."
                        placeholderTextColor="#64748b"
                        value={sourceText}
                        onChangeText={setSourceText}
                        multiline
                        textAlignVertical="top"
                        className="min-h-40 text-base leading-6 text-slate-900 dark:text-slate-100"
                    />

                    <View className="flex-row justify-end gap-2">
                        <Pressable
                            onPress={isListening ? stopVoiceInput : startVoiceInput}
                            accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
                            className={`items-center justify-center rounded-lg border p-2.5 ${isListening
                                ? 'border-rose-300 bg-rose-100 dark:border-rose-700 dark:bg-rose-950'
                                : 'border-teal-300 bg-teal-100 dark:border-teal-700 dark:bg-teal-950'
                                }`}>
                            <Ionicons
                                name={isListening ? 'stop-circle-outline' : 'mic-outline'}
                                size={22}
                                color={isListening ? '#be123c' : '#0f766e'}
                            />
                        </Pressable>
                        <Pressable
                            onPress={handleClear}
                            className="rounded-lg border border-orange-300 bg-orange-100 px-3 py-2 dark:border-orange-700 dark:bg-orange-950">
                            <Text className="text-base font-semibold text-orange-900 dark:text-orange-200">Clear</Text>
                        </Pressable>
                    </View>

                    {interimTranscript ? (
                        <Text className="text-sm font-medium text-slate-500 dark:text-slate-300">
                            {`Listening: ${interimTranscript}`}
                        </Text>
                    ) : null}

                    {speechError ? <Text className="font-semibold text-red-700">{speechError}</Text> : null}
                </View>

                <Pressable
                    onPress={handleTranslate}
                    disabled={isTranslating}
                    className="min-h-12 items-center justify-center rounded-xl bg-violet-700 dark:bg-violet-500"
                    style={{ opacity: isTranslating ? 0.7 : 1 }}>
                    {isTranslating ? (
                        <View className="flex-row items-center gap-2">
                            <ActivityIndicator color="#ffffff" />
                            <Text className="font-bold text-white">
                                {progressTotal > 0 ? `Translating ${progressIndex}/${progressTotal}` : 'Translating'}
                            </Text>
                        </View>
                    ) : (
                        <Text className="font-bold text-white">Translate</Text>
                    )}
                </Pressable>

                {error ? <Text className="font-semibold text-red-700">{error}</Text> : null}

                <View className="min-h-30 gap-2 rounded-2xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Translated Text</Text>
                    <Text
                        className={`text-base leading-6 ${translatedText ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-300'
                            }`}>
                        {translatedText || 'Your translated result will appear here.'}
                    </Text>
                </View>

                <PdfTranslationCard
                    sourceLanguageCode={sourceLanguage.code}
                    targetLanguageCode={targetLanguage.code}
                    sourceLanguageName={sourceLanguage.name}
                    targetLanguageName={targetLanguage.name}
                />
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
