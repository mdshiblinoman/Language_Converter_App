const cors = require('cors');
const express = require('express');

const { audioRoutes } = require('./routes/audio-routes');
const { allowedOrigin } = require('./config');
const { docsRoutes } = require('./routes/docs-routes');
const { errorHandler } = require('./middleware/error-handler');
const { imageRoutes } = require('./routes/image-routes');
const { pdfRoutes } = require('./routes/pdf-routes');
const { textRoutes } = require('./routes/text-routes');
const { videoRoutes } = require('./routes/video-routes');

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
app.use('/api/docs', docsRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/text', textRoutes);
app.use(errorHandler);

module.exports = {
    app,
};
