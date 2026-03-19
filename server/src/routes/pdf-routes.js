const express = require('express');
const multer = require('multer');

const { translatePdfController } = require('../controllers/pdf-controller');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_request, file, callback) => {
        const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname || '');
        if (!isPdf) {
            return callback(new Error('Only PDF files are allowed.'));
        }

        return callback(null, true);
    },
});

router.post('/translate', upload.single('pdf'), translatePdfController);

module.exports = {
    pdfRoutes: router,
};
