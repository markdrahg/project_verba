import { Document, Packer, Paragraph, TextRun } from 'docx';
import { downloadBlob, timestampedFilename } from './downloadBlob';

/**
 * Renders the document as a .docx with one numbered Word paragraph per
 * app paragraph. Uses the `docx` package's Packer.toBlob, which runs
 * entirely in the browser (no server round-trip needed for export).
 */
export async function exportToDocx(paragraphs: string[]): Promise<void> {
  const content = paragraphs.filter((p) => p.length > 0);

  const wordParagraphs =
    content.length > 0
      ? content.map((text, index) => {
          // Line breaks from the "new line" command are within-paragraph;
          // represent each as a Word soft line break (TextRun.break)
          // rather than starting a new Word paragraph.
          const rawLines = text.split('\n');
          const runs = rawLines.map(
            (line, lineIdx) =>
              new TextRun(
                lineIdx === 0 ? { text: `${index + 1}. ${line}` } : { text: line, break: 1 }
              )
          );
          return new Paragraph({ children: runs, spacing: { after: 200 } });
        })
      : [new Paragraph({ children: [new TextRun('(empty document)')] })];

  const doc = new Document({
    sections: [{ properties: {}, children: wordParagraphs }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, timestampedFilename('verba-transcript', 'docx'));
}
