const { chunkText } = require('../utils/text-chunker');

const MAX_RETRIES = 2;
const DEFAULT_CHARS_PER_REQUEST = 3000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildGeminiEndpoint = (apiKey, modelName) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

const parseGeminiErrorMessage = (payload, statusCode) => {
    const upstreamMessage = payload?.error?.message;
    if (upstreamMessage) return upstreamMessage;
    return `Gemini request failed with status ${statusCode}.`;
};

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

const parseGeminiText = (payload) => {
    const candidate = payload?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    return parts
        .map((part) => part?.text)
        .filter(Boolean)
        .join('')
        .trim();
};

const requestTranslation = async (chunk, sourceCode, targetCode) => {
    const apiKey = getGeminiApiKey();
    const modelName = (process.env.GEMINI_TRANSLATE_MODEL || 'gemini-2.0-flash').trim();
    const sourceLabel = sourceCode && sourceCode !== 'auto' ? sourceCode : 'auto-detected language';

    const payload = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: [
                            `Translate this text from ${sourceLabel} to ${targetCode}.`,
                            'Return only translated text with original punctuation and line breaks preserved.',
                            '',
                            chunk,
                        ].join('\n'),
                    },
                ],
            },
        ],
    };

    const response = await fetch(buildGeminiEndpoint(apiKey, modelName), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const responseJson = await response.json().catch(() => ({}));
        throw new Error(parseGeminiErrorMessage(responseJson, response.status));
    }

    const data = await response.json().catch(() => ({}));
    const output = parseGeminiText(data);

    if (!output) {
        throw new Error('No translated text returned by Gemini translation model.');
    }

    return output;
};

const translateChunkWithRetry = async (chunk, sourceCode, targetCode) => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
            return await requestTranslation(chunk, sourceCode, targetCode);
        } catch (error) {
            if (attempt === MAX_RETRIES) throw error;
            await wait(300 + attempt * 300);
        }
    }

    throw new Error('Translation retries exhausted.');
};

const translateLongText = async ({ text, sourceCode, targetCode, maxCharsPerRequest = DEFAULT_CHARS_PER_REQUEST }) => {
    const chunks = chunkText(text, maxCharsPerRequest);
    const translatedChunks = [];

    for (const chunk of chunks) {
        const translatedChunk = await translateChunkWithRetry(chunk, sourceCode, targetCode);
        translatedChunks.push(translatedChunk);
    }

    return {
        translatedText: translatedChunks.join(''),
        totalChunks: chunks.length,
    };
};

module.exports = {
    translateLongText,
};
