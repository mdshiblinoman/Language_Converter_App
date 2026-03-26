const { translateVideoWithDubbedAudio } = require('../services/video-translation-service');

const translateVideoController = async (request, response, next) => {
    try {
        const uploadedFile = request.file;
        const sourceCode = (request.body.sourceCode || 'auto').trim();
        const targetCode = (request.body.targetCode || '').trim();

        if (!uploadedFile) {
            return response.status(400).json({ message: 'Please upload a video file.' });
        }

        if (!targetCode) {
            return response.status(400).json({ message: 'Target language is required.' });
        }

        if (sourceCode !== 'auto' && sourceCode === targetCode) {
            return response.status(400).json({ message: 'Source and target language cannot be the same.' });
        }

        const {
            translatedVideoBuffer,
            translatedVideoMimeType = 'video/mp4',
            translatedVideoExtension = 'mp4',
            sourceText,
            translatedText,
            totalChunks,
        } = await translateVideoWithDubbedAudio({
            videoBuffer: uploadedFile.buffer,
            fileName: uploadedFile.originalname,
            mimeType: uploadedFile.mimetype,
            sourceCode,
            targetCode,
        });

        const safeBaseName = uploadedFile.originalname
            .replace(/\.[^/.]+$/i, '')
            .replace(/[^a-zA-Z0-9-_]/g, '_');
        const downloadName = `${safeBaseName || 'translated-video'}-${targetCode}.${translatedVideoExtension}`;

        response.setHeader('Content-Type', translatedVideoMimeType);
        response.setHeader('X-Source-Text-Length', String(sourceText.length));
        response.setHeader('X-Translated-Text-Length', String(translatedText.length));
        response.setHeader('X-Translation-Chunks', String(totalChunks));
        response.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        return response.status(200).send(translatedVideoBuffer);
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    translateVideoController,
};
