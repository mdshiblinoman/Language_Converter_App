const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const { translateAudioToSpeech } = require('./audio-translation-service');

const inferInputExtension = (fileName, mimeType) => {
    const fromName = path.extname(fileName || '').replace('.', '').toLowerCase();
    if (fromName) return fromName;

    if (mimeType === 'video/mp4') return 'mp4';
    if (mimeType === 'video/quicktime') return 'mov';
    if (mimeType === 'video/x-matroska') return 'mkv';
    if (mimeType === 'video/webm') return 'webm';
    return 'mp4';
};

const runFfmpeg = (args) =>
    new Promise((resolve, reject) => {
        if (!ffmpegPath) {
            reject(new Error('ffmpeg binary is not available.'));
            return;
        }

        const process = spawn(ffmpegPath, args);
        let stderr = '';

        process.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        process.on('error', (error) => {
            reject(error);
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(`ffmpeg failed with exit code ${code}. ${stderr.trim()}`));
        });
    });

const translateVideoWithDubbedAudio = async ({ videoBuffer, fileName, mimeType, sourceCode, targetCode }) => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-translate-'));

    try {
        const inputExtension = inferInputExtension(fileName, mimeType);
        const inputVideoPath = path.join(tempDir, `input.${inputExtension}`);
        const extractedAudioPath = path.join(tempDir, 'extracted-audio.mp3');

        await fs.writeFile(inputVideoPath, videoBuffer);

        await runFfmpeg([
            '-y',
            '-i',
            inputVideoPath,
            '-vn',
            '-ac',
            '1',
            '-ar',
            '16000',
            '-c:a',
            'libmp3lame',
            extractedAudioPath,
        ]);

        const extractedAudioBuffer = await fs.readFile(extractedAudioPath);

        const translated = await translateAudioToSpeech({
            audioBuffer: extractedAudioBuffer,
            fileName: 'extracted-audio.mp3',
            mimeType: 'audio/mpeg',
            sourceCode,
            targetCode,
        });

        const translatedAudioPath = path.join(
            tempDir,
            `translated-audio.${translated.translatedAudioExtension || 'mp3'}`
        );
        const outputVideoPath = path.join(tempDir, 'translated-video.mp4');

        await fs.writeFile(translatedAudioPath, translated.translatedAudioBuffer);

        await runFfmpeg([
            '-y',
            '-i',
            inputVideoPath,
            '-i',
            translatedAudioPath,
            '-map',
            '0:v:0',
            '-map',
            '1:a:0',
            '-c:v',
            'copy',
            '-c:a',
            'aac',
            '-shortest',
            outputVideoPath,
        ]);

        const outputBuffer = await fs.readFile(outputVideoPath);

        return {
            sourceText: translated.sourceText,
            translatedText: translated.translatedText,
            totalChunks: translated.totalChunks,
            translatedVideoBuffer: outputBuffer,
            translatedVideoMimeType: 'video/mp4',
            translatedVideoExtension: 'mp4',
        };
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
};

module.exports = {
    translateVideoWithDubbedAudio,
};
