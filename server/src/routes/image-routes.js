const express = require('express');
const multer = require('multer');

const { translateImageController } = require('../controllers/image-controller');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
    fileFilter: (_request, file, callback) => {
        const mime = (file.mimetype || '').toLowerCase();
        const name = file.originalname || '';
        const isImageMime = mime.startsWith('image/');
        const isImageName = /\.(png|jpe?g|webp|bmp|gif|tiff?|heic|heif)$/i.test(name);

        if (!isImageMime && !isImageName) {
            return callback(new Error('Only image files are allowed.'));
        }

        return callback(null, true);
    },
});

router.post('/translate', upload.single('image'), translateImageController);

module.exports = {
    imageRoutes: router,
};
