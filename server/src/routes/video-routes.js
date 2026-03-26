const express = require('express');
const multer = require('multer');

const { translateVideoController } = require('../controllers/video-controller');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
    fileFilter: (_request, file, callback) => {
        const isVideoMime = (file.mimetype || '').startsWith('video/');
        const isVideoName = /\.(mp4|mov|m4v|avi|mkv|webm|mpeg|mpg)$/i.test(file.originalname || '');

        if (!isVideoMime && !isVideoName) {
            return callback(new Error('Only video files are allowed.'));
        }

        return callback(null, true);
    },
});

router.post('/translate', upload.single('video'), translateVideoController);

module.exports = {
    videoRoutes: router,
};
