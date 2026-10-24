/**
 * Phone photos are often 5–20 MB, but the server keeps at most a 1600px copy. Shrinking them in the
 * browser first keeps uploads under the size limit and fast on mobile data.
 */

const MaxSide = 2400;

/** Photos smaller than this are uploaded as they are. */
const ShrinkAboveBytes = 2 * 1024 * 1024;

const JpegQuality = 0.85;

/** Full-size decodes of 48MP photos can use hundreds of MB, so only one photo is shrunk at a time. */
let queue: Promise<unknown> = Promise.resolve();

/**
 * Downscale a large photo to an upright JPEG of at most MaxSide pixels. Returns the original file when it's
 * already small, is a PNG (which may be transparent), or the browser can't decode it (e.g. HEIC outside Safari).
 */
export function shrinkPhoto(file: File): Promise<File> {
    if (file.size <= ShrinkAboveBytes || file.type === 'image/png') {
        return Promise.resolve(file);
    }

    const shrunk = queue.then(() => shrink(file));
    queue = shrunk.catch(() => null);

    return shrunk.catch(() => file);
}

async function shrink(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
    });

    try {
        const scale = Math.min(
            1,
            MaxSide / Math.max(bitmap.width, bitmap.height),
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext('2d');

        if (!context) {
            return file;
        }

        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', JpegQuality),
        );

        if (!blob || blob.size >= file.size) {
            return file;
        }

        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
            type: 'image/jpeg',
            lastModified: file.lastModified,
        });
    } finally {
        bitmap.close();
    }
}
