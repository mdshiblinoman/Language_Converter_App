const { translateLongText } = require('./translation-service');

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

const extractTextFromImage = async ({ imageBuffer, mimeType, sourceCode }) => {
    const apiKey = getGeminiApiKey();
    const modelName = (process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash').trim();
    const sourceHint = sourceCode && sourceCode !== 'auto'
        ? `The source text is likely in language code "${sourceCode}".`
        : 'Detect the source language automatically.';

    const payload = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: [
                            'Read the attached image and extract only the visible text.',
                            sourceHint,
                            'Return plain text only with line breaks preserved.',
                            'If no readable text exists, return exactly: NO_TEXT_FOUND',
                        ].join(' '),
                    },
                    {
                        inline_data: {
                            mime_type: mimeType || 'image/jpeg',
                            data: imageBuffer.toString('base64'),
                        },
                    },
                ],
            },
        ],
    };

    const completion = await requestGeminiContent({
        apiKey,
        modelName,
        payload,
    });

    const extractedText = (completion?.candidates?.[0]?.content?.parts || [])
        .map((part) => part?.text)
        .filter(Boolean)
        .join('')
        .trim();

    if (!extractedText || extractedText === 'NO_TEXT_FOUND') {
        throw new Error('Could not extract readable text from this image.');
    }

    return extractedText;
};

const translateImageText = async ({ imageBuffer, mimeType, sourceCode, targetCode }) => {
    const sourceText = await extractTextFromImage({
        imageBuffer,
        mimeType,
        sourceCode,
    });

    const { translatedText, totalChunks } = await translateLongText({
        text: sourceText,
        sourceCode,
        targetCode,
    });

    return {
        sourceText,
        translatedText,
        totalChunks,
    };
};

module.exports = {
    translateImageText,
};
