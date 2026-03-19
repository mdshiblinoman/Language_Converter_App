const splitLargeToken = (token, maxChars) => {
    if (token.length <= maxChars) return [token];

    const parts = [];
    let current = '';
    const segments = token.split(/(\s+)/);

    for (const segment of segments) {
        if (!segment) continue;

        if (segment.length > maxChars) {
            if (current) {
                parts.push(current);
                current = '';
            }

            for (let index = 0; index < segment.length; index += maxChars) {
                parts.push(segment.slice(index, index + maxChars));
            }
            continue;
        }

        if ((current + segment).length > maxChars) {
            if (current) parts.push(current);
            current = segment;
        } else {
            current += segment;
        }
    }

    if (current) parts.push(current);
    return parts;
};

const chunkText = (text, maxChars) => {
    const chunks = [];
    let current = '';
    const tokens = text.split(/(\n+)/);

    for (const token of tokens) {
        if (!token) continue;

        const tokenParts = splitLargeToken(token, maxChars);

        for (const part of tokenParts) {
            if ((current + part).length > maxChars) {
                if (current) chunks.push(current);
                current = part;
            } else {
                current += part;
            }
        }
    }

    if (current) chunks.push(current);
    return chunks;
};

module.exports = {
    chunkText,
};
