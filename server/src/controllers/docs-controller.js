const { parseDocText } = require('../services/docs-parser');
const { translateLongText } = require('../services/translation-service');

const translateDocsController = async (request, response, next) => {
    try {
        const uploadedFile = request.file;
        const sourceCode = (request.body.sourceCode || 'auto').trim();
        const targetCode = (request.body.targetCode || '').trim();

        if (!uploadedFile) {
            return response.status(400).json({ message: 'Please upload a document file.' });
        }

        if (!targetCode) {
            return response.status(400).json({ message: 'Target language is required.' });
        }

        if (sourceCode !== 'auto' && sourceCode === targetCode) {
            return response.status(400).json({ message: 'Source and target language cannot be the same.' });
        }

        const sourceText = await parseDocText({
            buffer: uploadedFile.buffer,
            mimeType: uploadedFile.mimetype,
            fileName: uploadedFile.originalname,
        });

        if (!sourceText.trim()) {
            return response.status(400).json({ message: 'Could not extract text from this document file.' });
        }

        const { translatedText, totalChunks } = await translateLongText({
            text: sourceText,
            sourceCode,
            targetCode,
        });

        const safeBaseName = uploadedFile.originalname
            .replace(/\.[^/.]+$/i, '')
            .replace(/[^a-zA-Z0-9-_]/g, '_');
        const downloadName = `${safeBaseName || 'translated-doc'}-${targetCode}.txt`;

        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.setHeader('X-Source-Text-Length', String(sourceText.length));
        response.setHeader('X-Translated-Text-Length', String(translatedText.length));
        response.setHeader('X-Translation-Chunks', String(totalChunks));
        response.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);

        return response.status(200).send(translatedText);
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    translateDocsController,
};
