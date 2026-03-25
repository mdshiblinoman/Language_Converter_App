import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

import { SignInForm } from '@/auth/sign-in-form';
import { SignUpForm } from '@/auth/sign-up-form';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/services/firebase';

type HomeOptionId = 'text' | 'voice' | 'audio' | 'video' | 'pdf' | 'docs' | 'other';

const ROUTE_BY_OPTION: Record<HomeOptionId, '/(tabs)/text-converter' | '/(tabs)/voice-converter' | '/(tabs)/audio-converter' | '/(tabs)/video-converter' | '/(tabs)/pdf-converter' | '/(tabs)/docs-converter' | '/(tabs)/other-converter'> = {
    text: '/(tabs)/text-converter',
    voice: '/(tabs)/voice-converter',
    audio: '/(tabs)/audio-converter',
    video: '/(tabs)/video-converter',
    pdf: '/(tabs)/pdf-converter',
    docs: '/(tabs)/docs-converter',
    other: '/(tabs)/other-converter',
};

const HOME_OPTIONS: {
    id: HomeOptionId;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
}[] = [
        {
            id: 'text',
            title: 'Text',
            description: 'Translate typed words or long paragraphs.',
            icon: 'text-outline',
        },
        {
            id: 'voice',
            title: 'Voice',
            description: 'Convert your speech to translation input.',
            icon: 'mic-outline',
        },
        {
            id: 'audio',
            title: 'Audio File',
            description: 'Upload audio and translate spoken content.',
            icon: 'musical-notes-outline',
        },
        {
            id: 'video',
            title: 'Video File',
            description: 'Upload video and translate subtitle text.',
            icon: 'videocam-outline',
        },
        {
            id: 'pdf',
            title: 'PDF File',
            description: 'Upload and translate PDF content.',
            icon: 'document-text-outline',
        },
        {
            id: 'docs',
            title: 'Docs File',
            description: 'Translate document files quickly.',
            icon: 'reader-outline',
        },
        {
            id: 'other',
            title: 'Other File',
            description: 'Select any supported file type.',
            icon: 'folder-open-outline',
        },
    ];

export default function HomeScreen() {
    const { user, isAuthLoading } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
    const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
    const [authError, setAuthError] = useState('');

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
        <View className="flex-1 bg-cyan-50 dark:bg-slate-950">
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-4 px-4 pb-10 pt-6"
                keyboardShouldPersistTaps="handled">
                <View className="flex-row items-start justify-end">
                    <Pressable
                        onPress={() => router.push('/(tabs)/profile')}
                        accessibilityLabel="Profile"
                        className="h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <Ionicons name="person-outline" size={22} color="#334155" />
                    </Pressable>
                </View>

                {HOME_OPTIONS.map((option) => {
                    return (
                        <Pressable
                            key={option.id}
                            onPress={() => router.push(ROUTE_BY_OPTION[option.id])}
                            className="flex-row items-center justify-between rounded-2xl border border-slate-300 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900">
                            <View className="flex-1 pr-3">
                                <View className="flex-row items-center gap-2">
                                    <Ionicons name={option.icon} size={20} color="#0f766e" />
                                    <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        {option.title}
                                    </Text>
                                </View>
                                <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    {option.description}
                                </Text>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color="#0f766e" />
                        </Pressable>
                    );
                })}

                {authError ? <Text className="font-semibold text-red-700">{authError}</Text> : null}
            </ScrollView>
        </View>
    );
}
