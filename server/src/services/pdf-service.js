const PDFDocument = require('pdfkit');

const renderTranslatedPdf = (translatedText, metadata = {}) => {
    return new Promise((resolve, reject) => {
        const document = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: metadata.title || 'Translated Document',
                Author: 'LanguageConverter',
            },
        });

        const chunks = [];
        document.on('data', (chunk) => chunks.push(chunk));
        document.on('end', () => resolve(Buffer.concat(chunks)));
        document.on('error', reject);

        document.fontSize(18).text('Translated PDF', { align: 'center' });
        document.moveDown(0.7);
        document
            .fontSize(10)
            .fillColor('#475569')
            .text(`Source: ${metadata.sourceCode || 'auto'} -> Target: ${metadata.targetCode || 'n/a'}`);
        document.moveDown(0.8);
        document.fillColor('#0f172a').fontSize(12).text(translatedText, {
            align: 'left',
            lineGap: 4,
        });

        document.end();
    });
};

module.exports = {
    renderTranslatedPdf,
};
