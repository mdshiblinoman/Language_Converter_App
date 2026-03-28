const OpenAI = require('openai');

const { translateLongText } = require('./translation-service');

const buildDataUri = (buffer, mimeType) => {
    const encoded = buffer.toString('base64');
    return `data:${mimeType || 'image/jpeg'};base64,${encoded}`;
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

const extractTextFromImage = async ({ imageBuffer, mimeType, sourceCode }) => {
    const openai = getOpenAiClient();
    const model = (process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini').trim();
    const sourceHint = sourceCode && sourceCode !== 'auto'
        ? `The source text is likely in language code "${sourceCode}".`
        : 'Detect the source language automatically.';

    const completion = await openai.chat.completions.create({
        model,
        temperature: 0,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: [
                            'Read the attached image and extract only the visible text.',
                            sourceHint,
                            'Return plain text only with line breaks preserved.',
                            'If no readable text exists, return exactly: NO_TEXT_FOUND',
                        ].join(' '),
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: buildDataUri(imageBuffer, mimeType),
                        },
                    },
                ],
            },
        ],
    });

    const extractedText = completion?.choices?.[0]?.message?.content?.trim() || '';
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
