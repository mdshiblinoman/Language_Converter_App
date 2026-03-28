const { translateImageText } = require('../services/image-translation-service');

const translateImageController = async (request, response, next) => {
    try {
        const uploadedFile = request.file;
        const sourceCode = (request.body.sourceCode || 'auto').trim();
        const targetCode = (request.body.targetCode || '').trim();

        if (!uploadedFile) {
            return response.status(400).json({ message: 'Please upload an image file.' });
        }

        if (!targetCode) {
            return response.status(400).json({ message: 'Target language is required.' });
        }

        if (sourceCode !== 'auto' && sourceCode === targetCode) {
            return response.status(400).json({ message: 'Source and target language cannot be the same.' });
        }

        const { sourceText, translatedText, totalChunks } = await translateImageText({
            imageBuffer: uploadedFile.buffer,
            mimeType: uploadedFile.mimetype,
            sourceCode,
            targetCode,
        });

        return response.status(200).json({
            sourceText,
            translatedText,
            totalChunks,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    translateImageController,
};
