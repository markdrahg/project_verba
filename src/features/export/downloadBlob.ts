/**
 * Triggers a browser download for a Blob via a temporary, invisible
 * anchor element. Shared by every export format so each format module
 * only has to worry about producing the Blob, not getting it onto disk.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Deferred slightly so Firefox/Safari reliably start the download
  // before the object URL backing it is revoked.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Builds a sortable, collision-resistant filename like "verba-transcript-2026-08-16-14-30-00.pdf". */
export function timestampedFilename(base: string, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${base}-${stamp}.${extension}`;
}
