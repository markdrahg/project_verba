import { jsPDF } from 'jspdf';
import { downloadBlob, timestampedFilename } from './downloadBlob';

const PAGE_MARGIN_MM = 18;
const LINE_HEIGHT_MM = 7;
const PARAGRAPH_SPACING_MM = 4;
const FONT_SIZE_PT = 12;

/**
 * Renders the document as a simple, paginated PDF: one numbered paragraph
 * per block, word-wrapped to the page width, with automatic page breaks.
 * Runs entirely client-side (jsPDF generates the PDF bytes in-browser) —
 * no server round-trip needed for export.
 *
 * Deliberately plain — this turns dictated words into a PDF you can send
 * someone, not a layout/typesetting tool. Rich formatting (headings,
 * styles) is a bigger feature that would build on top of this.
 */
export function exportToPdf(paragraphs: string[]): void {
  const content = paragraphs
    .map((text, index) => ({ text, index }))
    .filter((p) => p.text.length > 0);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - PAGE_MARGIN_MM * 2;

  doc.setFontSize(FONT_SIZE_PT);

  let cursorY = PAGE_MARGIN_MM;

  if (content.length === 0) {
    doc.text('(empty document)', PAGE_MARGIN_MM, cursorY);
  }

  content.forEach(({ text, index }) => {
    // Line breaks from the "new line" command are within-paragraph, not
    // paragraph boundaries — split on them so each rendered line still
    // wraps independently rather than jsPDF treating '\n' as plain text.
    const rawLines = text.split('\n');
    rawLines.forEach((rawLine, lineIdx) => {
      const prefix = lineIdx === 0 ? `${index + 1}. ` : '   ';
      const wrapped: string[] = doc.splitTextToSize(prefix + rawLine, usableWidth);
      wrapped.forEach((line) => {
        if (cursorY + LINE_HEIGHT_MM > pageHeight - PAGE_MARGIN_MM) {
          doc.addPage();
          cursorY = PAGE_MARGIN_MM;
        }
        doc.text(line, PAGE_MARGIN_MM, cursorY);
        cursorY += LINE_HEIGHT_MM;
      });
    });
    cursorY += PARAGRAPH_SPACING_MM;
  });

  const blob = doc.output('blob');
  downloadBlob(blob, timestampedFilename('verba-transcript', 'pdf'));
}
