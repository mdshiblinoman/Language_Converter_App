const express = require('express');
const multer = require('multer');

const { translateDocsController } = require('../controllers/docs-controller');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
    fileFilter: (_request, file, callback) => {
        const mime = (file.mimetype || '').toLowerCase();
        const name = file.originalname || '';
        const isAllowedMime = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/rtf',
            'application/rtf',
        ].includes(mime);
        const isAllowedExt = /\.(docx|txt|rtf)$/i.test(name);

        if (!isAllowedMime && !isAllowedExt) {
            return callback(new Error('Only DOCX, TXT, and RTF files are supported.'));
        }

        return callback(null, true);
    },
});

router.post('/translate', upload.single('document'), translateDocsController);

module.exports = {
    docsRoutes: router,
};
