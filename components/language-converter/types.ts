import type { Language } from '@/lib/languages';

export type PickerType = 'source' | 'target' | null;

export type SelectedMediaFile = {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
};

export type ModeFlags = {
    isVoiceMode: boolean;
    isAudioMode: boolean;
    isVideoMode: boolean;
    isPdfMode: boolean;
    isDocsMode: boolean;
    isFileMode: boolean;
};

export type LanguagePickerProps = {
    activePicker: PickerType;
    searchText: string;
    filteredLanguages: Language[];
    onChangeSearchText: (value: string) => void;
    onSelectLanguage: (language: Language) => void;
    onClose: () => void;
};
