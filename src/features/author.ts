/**
 * Author attribution — single source of truth so the name/email/LinkedIn
 * only need updating in one place. Rendered in the app footer; also
 * mirrored in index.html's meta tags and JSON-LD structured data (that
 * file can't import this, since it's static HTML evaluated before the
 * app loads — keep the two in sync by hand if these details ever change).
 */
export const AUTHOR = {
  name: 'Mark Drah',
  email: 'neutral520@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/markdrah',
} as const;
