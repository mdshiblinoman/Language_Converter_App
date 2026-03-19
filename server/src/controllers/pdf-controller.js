const { parsePdfText } = require('../services/pdf-parser');
const { renderTranslatedPdf } = require('../services/pdf-service');
const { translateLongText } = require('../services/translation-service');

const translatePdfController = async (request, response, next) => {
    try {
        const uploadedFile = request.file;
        const sourceCode = (request.body.sourceCode || 'auto').trim();
        const targetCode = (request.body.targetCode || '').trim();

        if (!uploadedFile) {
            return response.status(400).json({ message: 'Please upload a PDF file.' });
        }

        if (!targetCode) {
            return response.status(400).json({ message: 'Target language is required.' });
        }

        if (sourceCode !== 'auto' && sourceCode === targetCode) {
            return response.status(400).json({ message: 'Source and target language cannot be the same.' });
        }

        const sourceText = await parsePdfText(uploadedFile.buffer);

        if (!sourceText.trim()) {
            return response.status(400).json({ message: 'Could not extract text from this PDF.' });
        }

        const { translatedText, totalChunks } = await translateLongText({
            text: sourceText,
            sourceCode,
            targetCode,
        });

        const translatedPdfBuffer = await renderTranslatedPdf(translatedText, {
            sourceCode,
            targetCode,
            title: `translated-${uploadedFile.originalname}`,
        });

        const safeBaseName = uploadedFile.originalname.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9-_]/g, '_');
        const downloadName = `${safeBaseName || 'translated'}-${targetCode}.pdf`;

        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('X-Translation-Chunks', String(totalChunks));
        response.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        return response.status(200).send(translatedPdfBuffer);
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    translatePdfController,
};
