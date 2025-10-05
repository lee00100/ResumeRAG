import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set the worker source for pdf.js to the CDN version. This is required for it to work.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs`;

/**
 * Extracts text from a given file (PDF, DOCX, or TXT).
 * @param file The file to parse.
 * @returns A promise that resolves with the extracted text content.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
    // Check for file type based on MIME type or extension
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // The `str` property is what we want from each item
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;

    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;

    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read the text file.'));
            reader.readAsText(file);
        });

    } else {
        throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
    }
};
