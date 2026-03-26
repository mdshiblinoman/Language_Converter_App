const express = require('express');
const multer = require('multer');

const { translateAudioController } = require('../controllers/audio-controller');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
    fileFilter: (_request, file, callback) => {
        const isAudioMime = (file.mimetype || '').startsWith('audio/');
        const isAudioName = /\.(mp3|wav|m4a|aac|ogg|webm|flac|mpeg)$/i.test(file.originalname || '');

        if (!isAudioMime && !isAudioName) {
            return callback(new Error('Only audio files are allowed.'));
        }

        return callback(null, true);
    },
});

router.post('/translate', upload.single('audio'), translateAudioController);

module.exports = {
    audioRoutes: router,
};