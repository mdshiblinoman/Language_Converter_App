import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { ChatHistoryItem, getChatHistoryByUser } from '@/lib/chat-history';

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
                    <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Profile Info</Text>
                    <Text className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                        Name: {user?.displayName?.trim() || 'Not set'}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-700 dark:text-slate-200">Email: {user?.email || 'Unknown'}</Text>
                    <Text className="mt-1 text-sm text-slate-700 dark:text-slate-200">User ID: {user?.uid || 'Unknown'}</Text>
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
