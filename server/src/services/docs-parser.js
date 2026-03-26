const mammoth = require('mammoth');

const isDocx = ({ mimeType, fileName }) => {
    const normalizedMime = (mimeType || '').toLowerCase();
    return (
        normalizedMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        /\.docx$/i.test(fileName || '')
    );
};

const isTextLike = ({ mimeType, fileName }) => {
    const normalizedMime = (mimeType || '').toLowerCase();
    return (
        normalizedMime === 'text/plain' ||
        normalizedMime === 'text/rtf' ||
        normalizedMime === 'application/rtf' ||
        /\.(txt|rtf)$/i.test(fileName || '')
    );
};

const normalizeWhitespace = (value) =>
    value
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

const stripRtfSyntax = (value) =>
    value
        .replace(/\\par[d]?/gi, '\n')
        .replace(/\\'[0-9a-fA-F]{2}/g, '')
        .replace(/\\[a-z]+-?\d* ?/gi, '')
        .replace(/[{}]/g, '');

const parseDocText = async ({ buffer, mimeType, fileName }) => {
    if (isDocx({ mimeType, fileName })) {
        const result = await mammoth.extractRawText({ buffer });
        const text = normalizeWhitespace(result.value || '');
        if (!text) {
            throw new Error('Could not extract text from this DOCX file.');
        }

        return text;
    }

    if (isTextLike({ mimeType, fileName })) {
        const rawText = buffer.toString('utf8');
        const plainText = /\.rtf$/i.test(fileName || '') || (mimeType || '').toLowerCase().includes('rtf')
            ? stripRtfSyntax(rawText)
            : rawText;
        const text = normalizeWhitespace(plainText);

        if (!text) {
            throw new Error('Could not extract text from this document file.');
        }

        return text;
    }

    throw new Error('Unsupported document format. Use DOCX, TXT, or RTF.');
};

module.exports = {
    parseDocText,
};
