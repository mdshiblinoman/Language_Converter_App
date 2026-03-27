const OpenAI = require('openai');
const { toFile } = require('openai/uploads');

const { chunkText } = require('../utils/text-chunker');
const { translateLongText } = require('./translation-service');

const TTS_MAX_CHARS = 4000;
const GEMINI_TRANSLATE_MAX_CHARS = 3000;

const buildGeminiEndpoint = (apiKey, modelName) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

const parseGeminiErrorMessage = (payload, statusCode) => {
    const upstreamMessage = payload?.error?.message;
    if (upstreamMessage) return upstreamMessage;
    return `Gemini request failed with status ${statusCode}.`;
};

const requestGeminiContent = async ({ apiKey, modelName, payload }) => {
    const response = await fetch(buildGeminiEndpoint(apiKey, modelName), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const responseJson = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(parseGeminiErrorMessage(responseJson, response.status));
    }

    return responseJson;
};

const getAudioProvider = () => (process.env.AUDIO_TRANSLATION_PROVIDER || 'openai').trim().toLowerCase();

const getGeminiApiKey = () => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY is not configured on the server.\n' +
            'Please add your Google Gemini API key to the .env file.\n' +
            'Get one from: https://aistudio.google.com/app/apikeys'
        );
    }

    return apiKey;
};

const getGeminiModel = (envName, defaultModel) => (process.env[envName] || defaultModel).trim();

const parseGeminiText = (payload) => {
    const candidate = payload?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const text = parts
        .map((part) => part?.text)
        .filter(Boolean)
        .join('')
        .trim();

    return text;
};

const inferAudioExtension = (mimeType) => {
    if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') return 'wav';
    if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') return 'mp3';
    if (mimeType === 'audio/ogg') return 'ogg';
    if (mimeType === 'audio/webm') return 'webm';
    if (mimeType === 'audio/flac') return 'flac';
    return 'bin';
};

const getOpenAiClient = () => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
        throw new Error(
            'OPENAI_API_KEY is not configured on the server.\n' +
            'Please add your OpenAI API key to the .env file.\n' +
            'Get one from: https://platform.openai.com/api-keys'
        );
    }

    return new OpenAI({ apiKey });
};

const transcribeAudio = async ({ audioBuffer, fileName, mimeType, sourceCode }) => {
    const openai = getOpenAiClient();
    const audioFile = await toFile(audioBuffer, fileName || 'audio-input', mimeType || 'audio/mpeg');

    const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        ...(sourceCode && sourceCode !== 'auto' ? { language: sourceCode } : {}),
    });

    const sourceText = transcription?.text?.trim() || '';
    if (!sourceText) {
        throw new Error('Could not transcribe speech from this audio file.');
    }

    return sourceText;
};

const transcribeAudioWithGemini = async ({ audioBuffer, mimeType, sourceCode }) => {
    const apiKey = getGeminiApiKey();
    const modelName = getGeminiModel('GEMINI_TRANSCRIBE_MODEL', 'gemini-2.0-flash');

    const languageHint = sourceCode && sourceCode !== 'auto' ? `Use language code ${sourceCode}.` : 'Detect the spoken language automatically.';
    const payload = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: `Transcribe the attached audio only. Return plain text with no markdown, no speaker labels, and no commentary. ${languageHint}`,
                    },
                    {
                        inline_data: {
                            mime_type: mimeType || 'audio/mpeg',
                            data: audioBuffer.toString('base64'),
                        },
                    },
                ],
            },
        ],
    };

    const responseJson = await requestGeminiContent({ apiKey, modelName, payload });
    const sourceText = parseGeminiText(responseJson);

    if (!sourceText) {
        throw new Error('Could not transcribe speech from this audio file.');
    }

    return sourceText;
};

const translateTextWithGemini = async ({ text, sourceCode, targetCode }) => {
    const apiKey = getGeminiApiKey();
    const modelName = getGeminiModel('GEMINI_TRANSLATE_MODEL', 'gemini-2.0-flash');
    const chunks = chunkText(text, GEMINI_TRANSLATE_MAX_CHARS);
    const translatedChunks = [];

    for (const chunk of chunks) {
        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: [
                                `Translate this text from ${sourceCode || 'auto'} to ${targetCode}.`,
                                'Return only the translated text and preserve original meaning, punctuation, and line breaks.',
                                '',
                                chunk,
                            ].join('\n'),
                        },
                    ],
                },
            ],
        };

        const responseJson = await requestGeminiContent({ apiKey, modelName, payload });
        const translatedChunk = parseGeminiText(responseJson);

        if (!translatedChunk) {
            throw new Error('No translated text returned by Gemini translation model.');
        }

        translatedChunks.push(translatedChunk);
    }

    return {
        translatedText: translatedChunks.join(''),
        totalChunks: chunks.length,
    };
};

const synthesizeTranslatedSpeech = async ({ translatedText }) => {
    if (translatedText.length > TTS_MAX_CHARS) {
        throw new Error('Translated text is too long to synthesize as a single audio file.');
    }

    const openai = getOpenAiClient();
    const voice = process.env.OPENAI_TTS_VOICE?.trim() || 'alloy';

    const audioResponse = await openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: translatedText,
        format: 'mp3',
    });

    const bytes = await audioResponse.arrayBuffer();
    return {
        audioBuffer: Buffer.from(bytes),
        audioMimeType: 'audio/mpeg',
        fileExtension: 'mp3',
    };
};

const synthesizeTranslatedSpeechWithGemini = async ({ translatedText }) => {
    const apiKey = getGeminiApiKey();
    const modelName = getGeminiModel('GEMINI_TTS_MODEL', 'gemini-2.5-flash-preview-tts');
    const voiceName = (process.env.GEMINI_TTS_VOICE || 'Kore').trim();

    const payload = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: translatedText,
                    },
                ],
            },
        ],
        generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName,
                    },
                },
            },
        },
    };

    const responseJson = await requestGeminiContent({ apiKey, modelName, payload });
    const parts = responseJson?.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find((part) => part?.inlineData?.data || part?.inline_data?.data);
    const inlineData = audioPart?.inlineData || audioPart?.inline_data;
    const base64Audio = inlineData?.data;
    const mimeType = inlineData?.mimeType || inlineData?.mime_type || 'audio/wav';

    if (!base64Audio) {
        throw new Error('Gemini did not return synthesized audio data.');
    }

    return {
        audioBuffer: Buffer.from(base64Audio, 'base64'),
        audioMimeType: mimeType,
        fileExtension: inferAudioExtension(mimeType),
    };
};

const translateAudioToSpeech = async ({ audioBuffer, fileName, mimeType, sourceCode, targetCode }) => {
    const provider = getAudioProvider();

    let sourceText;
    let translatedText;
    let totalChunks;
    let synthesizedAudio;

    if (provider === 'gemini') {
        sourceText = await transcribeAudioWithGemini({
            audioBuffer,
            mimeType,
            sourceCode,
        });

        const translated = await translateTextWithGemini({
            text: sourceText,
            sourceCode,
            targetCode,
        });

        translatedText = translated.translatedText;
        totalChunks = translated.totalChunks;
        synthesizedAudio = await synthesizeTranslatedSpeechWithGemini({ translatedText });
    } else if (provider === 'openai') {
        sourceText = await transcribeAudio({
            audioBuffer,
            fileName,
            mimeType,
            sourceCode,
        });

        const translated = await translateLongText({
            text: sourceText,
            sourceCode,
            targetCode,
        });

        translatedText = translated.translatedText;
        totalChunks = translated.totalChunks;
        synthesizedAudio = await synthesizeTranslatedSpeech({ translatedText });
    } else {
        throw new Error('Unsupported AUDIO_TRANSLATION_PROVIDER. Use "openai" or "gemini".');
    }

    return {
        sourceText,
        translatedText,
        totalChunks,
        translatedAudioBuffer: synthesizedAudio.audioBuffer,
        translatedAudioMimeType: synthesizedAudio.audioMimeType,
        translatedAudioExtension: synthesizedAudio.fileExtension,
    };
};

module.exports = {
    translateAudioToSpeech,
};