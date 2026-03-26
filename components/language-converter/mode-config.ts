import type { ModeFlags } from '@/components/language-converter/types';

export const getModeFlags = (modeLabel: string): ModeFlags => {
    const isVoiceMode = modeLabel === 'Voice';
    const isAudioMode = modeLabel === 'Audio File';
    const isVideoMode = modeLabel === 'Video File';
    const isPdfMode = modeLabel === 'PDF File';
    const isDocsMode = modeLabel === 'Docs File';

    return {
        isVoiceMode,
        isAudioMode,
        isVideoMode,
        isPdfMode,
        isDocsMode,
        isFileMode: isAudioMode || isVideoMode || isPdfMode || isDocsMode,
    };
};

export const getPickerType = (flags: ModeFlags): string[] => {
    if (flags.isVideoMode) return ['video/*'];
    if (flags.isAudioMode) return ['audio/*'];
    if (flags.isPdfMode) return ['application/pdf'];

    return [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/rtf',
        'application/rtf',
    ];
};

export const getFallbackFileName = (flags: ModeFlags) => {
    if (flags.isVideoMode) return 'video-file';
    if (flags.isAudioMode) return 'audio-file';
    if (flags.isPdfMode) return 'pdf-file';
    return 'doc-file';
};

export const getPickerErrorMessage = (flags: ModeFlags) => {
    if (flags.isVideoMode) return 'Could not pick video file. Please try again.';
    if (flags.isAudioMode) return 'Could not pick audio file. Please try again.';
    if (flags.isPdfMode) return 'Could not pick PDF file. Please try again.';
    return 'Could not pick document file. Please try again.';
};

export const getInputPlaceholder = (flags: ModeFlags) => {
    if (flags.isVoiceMode) return 'Speak using the mic or type text here...';
    if (flags.isAudioMode) return 'Choose audio file, or type transcript text here...';
    if (flags.isVideoMode) return 'Choose video file, or type transcript text here...';
    if (flags.isPdfMode) return 'Choose PDF file, or type text here...';
    if (flags.isDocsMode) return 'Choose document file, or type text here...';
    return 'Type text here...';
};

export const getChooseFileButtonLabel = (flags: ModeFlags) => {
    if (flags.isVideoMode) return 'Choose Video File';
    if (flags.isAudioMode) return 'Choose Audio File';
    if (flags.isPdfMode) return 'Choose PDF File';
    return 'Choose Document File';
};

export const getMediaTypeLabel = (flags: ModeFlags) => {
    if (flags.isVideoMode) return 'video';
    if (flags.isAudioMode) return 'audio';
    if (flags.isPdfMode) return 'pdf';
    return 'document';
};
