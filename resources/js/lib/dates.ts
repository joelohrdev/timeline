/**
 * Parse a "YYYY-MM-DD" entry date as a local calendar day (no timezone shift).
 */
export function parseEntryDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
}

/**
 * The "YYYY-MM" month an entry date belongs to.
 */
export function monthKey(date: string): string {
    return date.slice(0, 7);
}

/**
 * Today as a "YYYY-MM-DD" string in the visitor's own timezone.
 */
export function todayKey(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Strip editor HTML down to plain words for small previews.
 */
export function plainText(html: string | null): string {
    return (html ?? '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}
