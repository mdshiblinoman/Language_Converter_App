const pdf = require('pdf-parse');

const parsePdfText = async (buffer) => {
    const result = await pdf(buffer);
    return result.text || '';
};

module.exports = {
    parsePdfText,
};
