/**
 * html-escape.ts — Escapes user-supplied text before it's interpolated into
 * HTML email templates (Resend `html:` bodies).
 *
 * Without this, a lead could submit a "message" containing raw HTML/links
 * (e.g. `<a href="...">click here</a>`) that would render live inside
 * Austin's email client when the notification email is opened. This is a
 * lightweight defense — it does not replace validating the content itself,
 * just prevents it from being interpreted as markup.
 */
export function escapeHtml(input: unknown): string {
  const str = input == null ? '' : String(input)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
