import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_HISTORY_KEY = 'translation_chat_history_v1';
const MAX_HISTORY_ITEMS = 200;

export type ChatHistoryItem = {
    id: string;
    userId: string;
    modeLabel: string;
    sourceLanguageCode: string;
    targetLanguageCode: string;
    sourceText: string;
    translatedText: string;
    createdAt: number;
};

type AddChatHistoryInput = Omit<ChatHistoryItem, 'id' | 'createdAt'>;

const normalizeForMatch = (value: string) => value.trim().toLowerCase();

export const getChatHistoryByUser = async (userId: string): Promise<ChatHistoryItem[]> => {
    try {
        const payload = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if (!payload) return [];

        const parsed = JSON.parse(payload) as ChatHistoryItem[];
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter((item) => item.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const addChatHistoryEntry = async (input: AddChatHistoryInput) => {
    try {
        const payload = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        const existing = payload ? ((JSON.parse(payload) as ChatHistoryItem[]) || []) : [];

        const nextItem: ChatHistoryItem = {
            ...input,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: Date.now(),
        };

        const deduped = existing.filter((item) => {
            return !(
                item.userId === input.userId &&
                item.modeLabel === input.modeLabel &&
                item.sourceLanguageCode === input.sourceLanguageCode &&
                item.targetLanguageCode === input.targetLanguageCode &&
                normalizeForMatch(item.sourceText) === normalizeForMatch(input.sourceText)
            );
        });

        const merged = [nextItem, ...deduped].slice(0, MAX_HISTORY_ITEMS);
        await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(merged));
    } catch (error) {
        console.error(error);
    }
};

export const clearChatHistoryByUser = async (userId: string) => {
    try {
        const payload = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if (!payload) return;

        const existing = (JSON.parse(payload) as ChatHistoryItem[]) || [];
        const filtered = existing.filter((item) => item.userId !== userId);
        await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error(error);
    }
};
