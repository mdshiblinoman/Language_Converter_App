const OpenAI = require('openai');
const { toFile } = require('openai/uploads');

const { translateLongText } = require('./translation-service');

const TTS_MAX_CHARS = 4000;

const getOpenAiClient = () => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured on the server.');
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
    return Buffer.from(bytes);
};

const translateAudioToSpeech = async ({ audioBuffer, fileName, mimeType, sourceCode, targetCode }) => {
    const sourceText = await transcribeAudio({
        audioBuffer,
        fileName,
        mimeType,
        sourceCode,
    });

    const { translatedText, totalChunks } = await translateLongText({
        text: sourceText,
        sourceCode,
        targetCode,
    });

    const translatedAudioBuffer = await synthesizeTranslatedSpeech({ translatedText });

    return {
        sourceText,
        translatedText,
        totalChunks,
        translatedAudioBuffer,
    };
};

module.exports = {
    translateAudioToSpeech,
};