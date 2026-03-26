const { translateAudioToSpeech } = require('../services/audio-translation-service');

const translateAudioController = async (request, response, next) => {
    try {
        const uploadedFile = request.file;
        const sourceCode = (request.body.sourceCode || 'auto').trim();
        const targetCode = (request.body.targetCode || '').trim();

        if (!uploadedFile) {
            return response.status(400).json({ message: 'Please upload an audio file.' });
        }

        if (!targetCode) {
            return response.status(400).json({ message: 'Target language is required.' });
        }

        if (sourceCode !== 'auto' && sourceCode === targetCode) {
            return response.status(400).json({ message: 'Source and target language cannot be the same.' });
        }

        const { translatedAudioBuffer, sourceText, translatedText, totalChunks } = await translateAudioToSpeech({
            audioBuffer: uploadedFile.buffer,
            fileName: uploadedFile.originalname,
            mimeType: uploadedFile.mimetype,
            sourceCode,
            targetCode,
        });

        const safeBaseName = uploadedFile.originalname
            .replace(/\.[^/.]+$/i, '')
            .replace(/[^a-zA-Z0-9-_]/g, '_');
        const downloadName = `${safeBaseName || 'translated-audio'}-${targetCode}.mp3`;

        response.setHeader('Content-Type', 'audio/mpeg');
        response.setHeader('X-Source-Text-Length', String(sourceText.length));
        response.setHeader('X-Translated-Text-Length', String(translatedText.length));
        response.setHeader('X-Translation-Chunks', String(totalChunks));
        response.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        return response.status(200).send(translatedAudioBuffer);
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    translateAudioController,
};