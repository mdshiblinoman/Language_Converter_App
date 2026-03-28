const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const port = Number(process.env.PORT || 4000);

// Validate API keys configuration
const validateApiKeys = () => {
    if (!process.env.GEMINI_API_KEY?.trim()) {
        console.warn(
            '⚠️  WARNING: GEMINI_API_KEY is not configured.\n' +
            '   Audio, video, and image translation features will not work.\n' +
            '   Get an API key from: https://aistudio.google.com/app/apikeys'
        );
    }
};

validateApiKeys();

module.exports = {
    port,
    allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
};
