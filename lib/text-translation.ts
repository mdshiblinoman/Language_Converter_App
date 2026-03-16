const MAX_RETRIES = 2;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const splitLargeToken = (token: string, maxChars: number) => {
    if (token.length <= maxChars) return [token];

    const parts: string[] = [];
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

export const chunkTextForTranslation = (text: string, maxChars: number) => {
    const chunks: string[] = [];
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

const requestTranslation = async (chunk: string, sourceCode: string, targetCode: string) => {
    const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(`${sourceCode}|${targetCode}`)}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const output = data?.responseData?.translatedText;

    if (!output) {
        throw new Error('No translation returned by the API.');
    }

    return output as string;
};

const translateChunkWithRetry = async (chunk: string, sourceCode: string, targetCode: string) => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
            return await requestTranslation(chunk, sourceCode, targetCode);
        } catch (error) {
            if (attempt === MAX_RETRIES) throw error;
            await wait(300 + attempt * 300);
        }
    }

    throw new Error('Translation retry failed.');
};

type TranslateTextOptions = {
    text: string;
    sourceCode: string;
    targetCode: string;
    maxCharsPerRequest: number;
    onProgress?: (index: number, total: number) => void;
};

export const translateTextInChunks = async ({
    text,
    sourceCode,
    targetCode,
    maxCharsPerRequest,
    onProgress,
}: TranslateTextOptions) => {
    const chunks = chunkTextForTranslation(text, maxCharsPerRequest);
    const translatedChunks: string[] = [];

    onProgress?.(0, chunks.length);

    for (let index = 0; index < chunks.length; index += 1) {
        onProgress?.(index + 1, chunks.length);
        const translatedChunk = await translateChunkWithRetry(chunks[index], sourceCode, targetCode);
        translatedChunks.push(translatedChunk);
    }

    return {
        translatedText: translatedChunks.join(''),
        totalChunks: chunks.length,
    };
};
