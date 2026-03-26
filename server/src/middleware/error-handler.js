const errorHandler = (error, _request, response, _next) => {
    console.error('[server-error]', error);

    if (error?.code === 'LIMIT_FILE_SIZE') {
        return response.status(400).json({ message: 'Uploaded file is too large.' });
    }

    return response.status(500).json({ message: error?.message || 'Unexpected server error.' });
};

module.exports = {
    errorHandler,
};
