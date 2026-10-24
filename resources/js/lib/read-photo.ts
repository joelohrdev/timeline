import { photoLocation, photoTakenAt } from '@/lib/photo-date';
import type { PhotoLocation, PhotoTaken } from '@/lib/photo-date';
import { photoFingerprint } from '@/lib/photo-fingerprint';
import { isRawPhoto, rawPhotoToJpeg } from '@/lib/raw-photo';
import { shrinkPhoto } from '@/lib/shrink-photo';

export type ReadPhoto = {
    /** The file to upload: the original, a downscaled JPEG of a large photo, or a JPEG made from a RAW photo. */
    upload: File;
    fingerprint: string;
    taken: PhotoTaken | null;
    gps: PhotoLocation | null;
};

/** How long one photo may take to read before it's given up on, so a bad file can't stall a batch. */
const ReadTimeoutMs = 30_000;

/** How many photos are read at once. */
const ReadConcurrency = 4;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        promise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
}

/**
 * Read a photo's fingerprint, taken time and GPS (all from the original file) and prepare the file to upload.
 * Returns null when the photo can't be read.
 */
export async function readPhoto(file: File): Promise<ReadPhoto | null> {
    const read = async (): Promise<ReadPhoto | null> => {
        const [taken, fingerprint, gps] = await Promise.all([
            photoTakenAt(file),
            photoFingerprint(file),
            photoLocation(file),
        ]);
        const upload = isRawPhoto(file)
            ? await rawPhotoToJpeg(file)
            : await shrinkPhoto(file);

        return upload ? { upload, fingerprint, taken, gps } : null;
    };

    try {
        return await withTimeout(read(), ReadTimeoutMs);
    } catch {
        return null;
    }
}

/**
 * Read several photos a few at a time, keeping their order, and report progress after each one.
 */
export async function readPhotoBatch(
    files: File[],
    onProgress?: (done: number) => void,
): Promise<(ReadPhoto | null)[]> {
    const results: (ReadPhoto | null)[] = Array.from(
        { length: files.length },
        () => null,
    );
    let next = 0;
    let done = 0;

    const worker = async () => {
        while (next < files.length) {
            const index = next++;
            results[index] = await readPhoto(files[index]);
            onProgress?.(++done);
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(ReadConcurrency, files.length) }, worker),
    );

    return results;
}
