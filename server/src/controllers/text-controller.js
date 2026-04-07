const { translateLongText } = require('../services/translation-service');

const translateTextController = async (request, response, next) => {
    try {
        const sourceText = typeof request.body.text === 'string' ? request.body.text : '';
        const sourceCode = (request.body.sourceCode || 'auto').trim();
        const targetCode = (request.body.targetCode || '').trim();
        const requestedChunkSize = Number(request.body.maxCharsPerRequest);

        if (!sourceText.trim()) {
            return response.status(400).json({ message: 'Text is required.' });
        }

        if (!targetCode) {
            return response.status(400).json({ message: 'Target language is required.' });
        }

        if (sourceCode !== 'auto' && sourceCode === targetCode) {
            return response.status(400).json({ message: 'Source and target language cannot be the same.' });
        }

        const maxCharsPerRequest = Number.isFinite(requestedChunkSize) && requestedChunkSize > 0
            ? requestedChunkSize
            : undefined;

        const { translatedText, totalChunks } = await translateLongText({
            text: sourceText,
            sourceCode,
            targetCode,
            maxCharsPerRequest,
        });

        return response.status(200).json({
            translatedText,
            totalChunks,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    translateTextController,
};
