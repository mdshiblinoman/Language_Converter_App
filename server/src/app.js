const cors = require('cors');
const express = require('express');

const { audioRoutes } = require('./routes/audio-routes');
const { allowedOrigin } = require('./config');
const { errorHandler } = require('./middleware/error-handler');
const { pdfRoutes } = require('./routes/pdf-routes');

const app = express();

app.use(
    cors({
        origin: allowedOrigin,
    })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
});

app.use('/api/audio', audioRoutes);
app.use('/api/pdf', pdfRoutes);
app.use(errorHandler);

module.exports = {
    app,
};
