const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const port = Number(process.env.PORT || 4000);
const audioProvider = (process.env.AUDIO_TRANSLATION_PROVIDER || 'openai').trim().toLowerCase();

// Validate API keys configuration
const validateApiKeys = () => {
    if (audioProvider === 'openai') {
        if (!process.env.OPENAI_API_KEY?.trim()) {
            console.warn(
                '⚠️  WARNING: OPENAI_API_KEY is not configured.\n' +
                '   Audio, video, and text-to-speech features will not work.\n' +
                '   Get an API key from: https://platform.openai.com/api-keys'
            );
        }
    } else if (audioProvider === 'gemini') {
        if (!process.env.GEMINI_API_KEY?.trim()) {
            console.warn(
                '⚠️  WARNING: GEMINI_API_KEY is not configured.\n' +
                '   Audio and video translation features will not work.\n' +
                '   Get an API key from: https://aistudio.google.com/app/apikeys'
            );
        }
    }
};

validateApiKeys();

module.exports = {
    port,
    allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
    audioProvider,
};
