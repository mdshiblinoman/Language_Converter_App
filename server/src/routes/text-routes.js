const express = require('express');

const { translateTextController } = require('../controllers/text-controller');

const router = express.Router();

router.post('/translate', translateTextController);

module.exports = {
    textRoutes: router,
};
