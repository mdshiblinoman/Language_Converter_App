import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import {
    downloadOrShareTranslatedPdf,
    pickPdfFile,
    requestTranslatedPdf,
    type PickedPdf,
} from '@/lib/pdf-translation';

type PdfTranslationCardProps = {
    sourceLanguageCode: string;
    targetLanguageCode: string;
    sourceLanguageName: string;
    targetLanguageName: string;
};

const formatBytes = (size?: number) => {
    if (!size) return 'Unknown size';
    const mb = size / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(size / 1024).toFixed(0)} KB`;
};

export function PdfTranslationCard({
    sourceLanguageCode,
    targetLanguageCode,
    sourceLanguageName,
    targetLanguageName,
}: PdfTranslationCardProps) {
    const [selectedFile, setSelectedFile] = useState<PickedPdf | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('Pick a PDF, then translate and download.');

    const handlePickPdf = async () => {
        try {
            const pickedFile = await pickPdfFile();
            if (!pickedFile) return;

            setSelectedFile(pickedFile);
            setStatus('PDF selected. Ready to translate.');
        } catch (error) {
            console.error(error);
            setStatus('Failed to select PDF file.');
        }
    };

    const handleTranslateAndDownload = async () => {
        if (!selectedFile) {
            Alert.alert('No PDF selected', 'Please choose a PDF file first.');
            return;
        }

        if (sourceLanguageCode !== 'auto' && sourceLanguageCode === targetLanguageCode) {
            Alert.alert('Language mismatch', 'Source and target language cannot be the same.');
            return;
        }

        setIsSubmitting(true);
        setStatus('Uploading PDF and translating text...');

        try {
            const translatedResult = await requestTranslatedPdf({
                file: selectedFile,
                sourceCode: sourceLanguageCode,
                targetCode: targetLanguageCode,
            });

            setStatus('Translated PDF ready. Download is starting...');
            await downloadOrShareTranslatedPdf(translatedResult);
            setStatus('Translated PDF downloaded successfully.');
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : 'PDF translation failed.';
            setStatus(message);
            Alert.alert('Translation failed', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="gap-2 rounded-2xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">PDF Translation</Text>
            <Text className="text-sm text-slate-600 dark:text-slate-300">
                {sourceLanguageName} ({sourceLanguageCode}) to {targetLanguageName} ({targetLanguageCode})
            </Text>

            <Pressable
                onPress={handlePickPdf}
                disabled={isSubmitting}
                className="items-center rounded-xl border border-cyan-300 bg-cyan-100 py-2.5 dark:border-cyan-700 dark:bg-cyan-950"
                style={{ opacity: isSubmitting ? 0.6 : 1 }}>
                <Text className="text-base font-semibold text-cyan-900 dark:text-cyan-200">Choose PDF</Text>
            </Pressable>

            {selectedFile ? (
                <View className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950">
                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100" numberOfLines={1}>
                        {selectedFile.name}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-300">{formatBytes(selectedFile.size)}</Text>
                </View>
            ) : null}

            <Pressable
                onPress={handleTranslateAndDownload}
                disabled={isSubmitting}
                className="min-h-11 items-center justify-center rounded-xl bg-emerald-700 dark:bg-emerald-500"
                style={{ opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? (
                    <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#ffffff" />
                        <Text className="font-bold text-white">Processing PDF...</Text>
                    </View>
                ) : (
                    <Text className="font-bold text-white">Translate PDF & Download</Text>
                )}
            </Pressable>

            <Text className="text-sm text-slate-600 dark:text-slate-300">{status}</Text>
        </View>
    );
}
