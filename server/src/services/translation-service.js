const { chunkText } = require('../utils/text-chunker');

const MAX_RETRIES = 2;
const DEFAULT_CHARS_PER_REQUEST = 450;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestTranslation = async (chunk, sourceCode, targetCode) => {
    const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(`${sourceCode}|${targetCode}`)}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error(`Translation API failed with status ${response.status}`);
    }

    const data = await response.json();
    const output = data?.responseData?.translatedText;

    if (!output) {
        throw new Error('No translated text returned by translation API.');
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
