import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useState } from 'react';

import { SPEECH_LOCALE_BY_CODE } from '@/app/_lib/languages';

type UseVoiceInputParams = {
    sourceLanguageCode: string;
    onFinalTranscript: (text: string) => void;
};

export function useVoiceInput({ sourceLanguageCode, onFinalTranscript }: UseVoiceInputParams) {
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');

    useSpeechRecognitionEvent('start', () => {
        setIsListening(true);
        setSpeechError('');
    });

    useSpeechRecognitionEvent('end', () => {
        setIsListening(false);
        setInterimTranscript('');
    });

    useSpeechRecognitionEvent('error', (event) => {
        setIsListening(false);
        setInterimTranscript('');
        setSpeechError(event.message ?? 'Voice input failed. Please try again.');
    });

    useSpeechRecognitionEvent('result', (event) => {
        const transcript = event.results?.[0]?.transcript?.trim();
        if (!transcript) return;

        if (event.isFinal) {
            onFinalTranscript(transcript);
            setInterimTranscript('');
            return;
        }

        setInterimTranscript(transcript);
    });

    const startVoiceInput = async () => {
        try {
            const isAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
            if (!isAvailable) {
                setSpeechError('Voice recognition is not available on this device.');
                return;
            }

            const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!permission.granted) {
                setSpeechError('Microphone or speech permission was not granted.');
                return;
            }

            const locale =
                sourceLanguageCode !== 'auto'
                    ? SPEECH_LOCALE_BY_CODE[sourceLanguageCode] ?? 'en-US'
                    : undefined;

            setSpeechError('');

            ExpoSpeechRecognitionModule.start({
                lang: locale,
                interimResults: true,
                maxAlternatives: 1,
                continuous: false,
            });
        } catch (voiceError) {
            console.error(voiceError);
            setSpeechError('Could not start voice input. Please try again.');
        }
    };

    const stopVoiceInput = () => {
        try {
            ExpoSpeechRecognitionModule.stop();
        } catch (voiceError) {
            console.error(voiceError);
        }
    };

    const clearVoiceState = () => {
        setSpeechError('');
        setInterimTranscript('');
    };

    return {
        isListening,
        speechError,
        interimTranscript,
        startVoiceInput,
        stopVoiceInput,
        clearVoiceState,
    };
}
