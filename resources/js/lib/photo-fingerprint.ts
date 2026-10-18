/**
 * A fingerprint for a photo file, so a later upload can tell the same file was already posted.
 *
 * Hashes the first 2 MB (plenty to tell photos apart) plus the file size. Uses a small JavaScript hash rather
 * than crypto.subtle, which only exists on HTTPS pages, so the value is the same everywhere.
 */
export async function photoFingerprint(file: File): Promise<string> {
    const bytes = new Uint8Array(
        await file.slice(0, 2 * 1024 * 1024).arrayBuffer(),
    );

    return `${file.size.toString(36)}-${cyrb53(bytes).toString(36)}`;
}

/**
 * cyrb53: a fast, well-distributed 53-bit hash (public domain).
 */
function cyrb53(bytes: Uint8Array, seed = 0): number {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;

    for (const byte of bytes) {
        h1 = Math.imul(h1 ^ byte, 2654435761);
        h2 = Math.imul(h2 ^ byte, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
