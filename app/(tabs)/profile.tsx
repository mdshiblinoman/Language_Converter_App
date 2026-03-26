import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { ChatHistoryItem, clearChatHistoryByUser, getChatHistoryByUser } from '@/lib/chat-history';
import { auth } from '@/services/firebase';

const formatDateTime = (timestamp: number) => {
    try {
        return new Date(timestamp).toLocaleString();
    } catch {
        return 'Unknown time';
    }
};

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const userName = user?.displayName?.trim() || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    const [isLoading, setIsLoading] = useState(true);
    const [chats, setChats] = useState<ChatHistoryItem[]>([]);

    const loadChats = useCallback(async () => {
        if (!user?.uid) {
            setChats([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const history = await getChatHistoryByUser(user.uid);
        setChats(history);
        setIsLoading(false);
    }, [user?.uid]);

    useFocusEffect(
        useCallback(() => {
            void loadChats();
        }, [loadChats])
    );

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
        }
    };

    const handleResetChats = async () => {
        if (!user?.uid) return;

        await clearChatHistoryByUser(user.uid);
        setChats([]);
    };

    return (
        <View className="flex-1 bg-cyan-50 dark:bg-slate-950">
            <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-10 pt-6">
                <View className="flex-row items-center justify-between">
                    <Pressable
                        onPress={() => router.back()}
                        className="h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <Ionicons name="arrow-back" size={20} color="#334155" />
                    </Pressable>
                    <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile</Text>
                    <View className="h-10 w-10" />
                </View>

                <View className="rounded-2xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <View className="flex-row items-center gap-3">
                        <View className="h-14 w-14 items-center justify-center rounded-full bg-cyan-700 dark:bg-cyan-600">
                            <Text className="text-xl font-bold text-white">{userInitial || 'U'}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">{userName}</Text>
                            <Text className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                                {user?.email || 'No email found'}
                            </Text>
                        </View>
                    </View>

                    <View className="mt-4 gap-2">
                        <View className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Total Chats</Text>
                            <Text className="mt-1 text-sm text-slate-800 dark:text-slate-100">{chats.length}</Text>
                        </View>
                    </View>

                    <View className="mt-4 gap-2">
                        <Pressable
                            onPress={handleSignOut}
                            className="flex-row items-center justify-center gap-2 rounded-xl bg-rose-700 py-3 dark:bg-rose-600">
                            <Ionicons name="log-out-outline" size={18} color="#ffffff" />
                            <Text className="font-semibold text-white">Sign Out</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleResetChats}
                            className="flex-row items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-100 py-3 dark:border-amber-700 dark:bg-amber-900/40">
                            <Ionicons name="refresh-outline" size={18} color="#92400e" />
                            <Text className="font-semibold text-amber-900 dark:text-amber-200">Reset All Chats</Text>
                        </Pressable>
                    </View>
                </View>

                <View className="rounded-2xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">All Chat</Text>

                    {isLoading ? (
                        <View className="mt-4 flex-row items-center gap-2">
                            <ActivityIndicator color="#0f766e" />
                            <Text className="text-sm text-slate-600 dark:text-slate-300">Loading chat history...</Text>
                        </View>
                    ) : null}

                    {!isLoading && chats.length === 0 ? (
                        <Text className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                            No chat history yet. Start translating to see chats here.
                        </Text>
                    ) : null}

                    {!isLoading
                        ? chats.map((chat) => (
                            <View
                                key={chat.id}
                                className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {chat.modeLabel} • {chat.sourceLanguageCode} to {chat.targetLanguageCode}
                                    </Text>
                                    <Text className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(chat.createdAt)}</Text>
                                </View>

                                <Text className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                    You
                                </Text>
                                <Text className="mt-1 text-sm text-slate-800 dark:text-slate-100">{chat.sourceText}</Text>

                                <Text className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                    Translated
                                </Text>
                                <Text className="mt-1 text-sm text-slate-800 dark:text-slate-100">{chat.translatedText}</Text>
                            </View>
                        ))
                        : null}
                </View>
            </ScrollView>
        </View>
    );
}
