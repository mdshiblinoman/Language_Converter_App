import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { LanguagePickerProps } from '@/components/language-converter/types';

export function LanguagePickerModal({
    activePicker,
    searchText,
    filteredLanguages,
    onChangeSearchText,
    onSelectLanguage,
    onClose,
}: LanguagePickerProps) {
    return (
        <Modal
            visible={activePicker !== null}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/35">
                <View className="max-h-[75%] gap-2.5 rounded-t-2xl border border-slate-300 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900">
                    <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">Select Language</Text>
                    <TextInput
                        value={searchText}
                        onChangeText={onChangeSearchText}
                        placeholder="Search language..."
                        placeholderTextColor="#64748b"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />

                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-2.5">
                        {filteredLanguages.map((language) => (
                            <Pressable
                                key={language.code}
                                onPress={() => onSelectLanguage(language)}
                                className="flex-row items-center justify-between border-b border-slate-300 py-3 dark:border-slate-700">
                                <Text className="text-base text-slate-900 dark:text-slate-100">{language.name}</Text>
                                <Text className="text-base text-slate-500 dark:text-slate-300">{language.code}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <Pressable
                        onPress={onClose}
                        className="items-center rounded-xl border border-lime-300 bg-lime-100 py-2.5 dark:border-lime-700 dark:bg-lime-950">
                        <Text className="text-base font-semibold text-lime-900 dark:text-lime-200">Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
