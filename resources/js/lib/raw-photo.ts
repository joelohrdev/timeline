/**
 * Apple ProRAW (and other DNG) photos are 50–100 MB, too large to upload. Every DNG carries a
 * full-colour JPEG preview, so we pull that out in the browser, apply the photo's orientation,
 * shrink it, and upload a normal JPEG instead.
 */

const MaxPreviewSide = 2400;

const Tag = {
    NewSubfileType: 0x00fe,
    ImageWidth: 0x0100,
    Compression: 0x0103,
    Photometric: 0x0106,
    StripOffsets: 0x0111,
    Orientation: 0x0112,
    StripByteCounts: 0x0117,
    SubIfds: 0x014a,
    JpegOffset: 0x0201,
    JpegLength: 0x0202,
} as const;

type IfdEntry = { type: number; count: number; valuePosition: number };
type Ifd = { entries: Map<number, IfdEntry>; next: number };
type Preview = { offset: number; length: number; width: number };

export function isRawPhoto(file: File): boolean {
    return (
        /^image\/(x-adobe-)?dng$/.test(file.type) || /\.dng$/i.test(file.name)
    );
}

/**
 * Turn a DNG into an upright JPEG File, or null when no usable preview is found.
 */
export async function rawPhotoToJpeg(file: File): Promise<File | null> {
    try {
        const head = new DataView(
            await file.slice(0, 2 * 1024 * 1024).arrayBuffer(),
        );
        const found = findPreview(head);

        if (!found) {
            return null;
        }

        const jpeg = file.slice(
            found.preview.offset,
            found.preview.offset + found.preview.length,
            'image/jpeg',
        );
        const bitmap = await createImageBitmap(jpeg);
        const blob = await drawUpright(bitmap, found.orientation);
        bitmap.close();

        if (!blob) {
            return null;
        }

        return new File([blob], file.name.replace(/\.dng$/i, '') + '.jpg', {
            type: 'image/jpeg',
            lastModified: file.lastModified,
        });
    } catch {
        return null;
    }
}

function findPreview(
    view: DataView,
): { preview: Preview; orientation: number } | null {
    const byteOrder = String.fromCharCode(view.getUint8(0), view.getUint8(1));

    if (byteOrder !== 'II' && byteOrder !== 'MM') {
        return null;
    }

    const littleEndian = byteOrder === 'II';
    const ifd0Offset = view.getUint32(4, littleEndian);
    const ifd0 = readIfd(view, ifd0Offset, littleEndian);

    if (!ifd0) {
        return null;
    }

    const ifds: Ifd[] = [ifd0];

    for (const offset of values(view, ifd0, Tag.SubIfds, littleEndian)) {
        const sub = readIfd(view, offset, littleEndian);

        if (sub) {
            ifds.push(sub);
        }
    }

    let next = ifd0.next;

    while (next > 0 && ifds.length < 16) {
        const chained = readIfd(view, next, littleEndian);

        if (!chained) {
            break;
        }

        ifds.push(chained);
        next = chained.next;
    }

    const previews = ifds
        .map((ifd) => previewIn(view, ifd, littleEndian))
        .filter((preview): preview is Preview => preview !== null)
        .sort((a, b) => b.width - a.width);

    if (previews.length === 0) {
        return null;
    }

    return {
        preview: previews[0],
        orientation: values(view, ifd0, Tag.Orientation, littleEndian)[0] ?? 1,
    };
}

/**
 * A viewable JPEG preview: JPEG-compressed RGB/YCbCr data (not the lossless-JPEG raw sensor data).
 */
function previewIn(
    view: DataView,
    ifd: Ifd,
    littleEndian: boolean,
): Preview | null {
    const read = (tag: number) => values(view, ifd, tag, littleEndian);
    const width = read(Tag.ImageWidth)[0] ?? 0;
    const jpegOffset = read(Tag.JpegOffset)[0];
    const jpegLength = read(Tag.JpegLength)[0];

    if (jpegOffset && jpegLength) {
        return { offset: jpegOffset, length: jpegLength, width };
    }

    const compression = read(Tag.Compression)[0];
    const photometric = read(Tag.Photometric)[0];
    const strips = read(Tag.StripOffsets);
    const stripLengths = read(Tag.StripByteCounts);

    if (
        (compression === 6 || compression === 7) &&
        (photometric === 2 || photometric === 6) &&
        strips.length === 1 &&
        stripLengths.length === 1
    ) {
        return { offset: strips[0], length: stripLengths[0], width };
    }

    return null;
}

function readIfd(
    view: DataView,
    offset: number,
    littleEndian: boolean,
): Ifd | null {
    if (offset <= 0 || offset + 2 > view.byteLength) {
        return null;
    }

    const count = view.getUint16(offset, littleEndian);
    const end = offset + 2 + count * 12;

    if (end + 4 > view.byteLength) {
        return null;
    }

    const entries = new Map<number, IfdEntry>();

    for (let index = 0; index < count; index++) {
        const entry = offset + 2 + index * 12;
        entries.set(view.getUint16(entry, littleEndian), {
            type: view.getUint16(entry + 2, littleEndian),
            count: view.getUint32(entry + 4, littleEndian),
            valuePosition: entry + 8,
        });
    }

    return { entries, next: view.getUint32(end, littleEndian) };
}

/**
 * Numeric values of a SHORT or LONG tag, following the offset when they don't fit inline.
 */
function values(
    view: DataView,
    ifd: Ifd,
    tag: number,
    littleEndian: boolean,
): number[] {
    const entry = ifd.entries.get(tag);

    if (!entry || (entry.type !== 3 && entry.type !== 4)) {
        return [];
    }

    const size = entry.type === 3 ? 2 : 4;
    const start =
        entry.count * size <= 4
            ? entry.valuePosition
            : view.getUint32(entry.valuePosition, littleEndian);
    const found: number[] = [];

    for (let index = 0; index < entry.count; index++) {
        const position = start + index * size;

        if (position + size > view.byteLength) {
            break;
        }

        found.push(
            size === 2
                ? view.getUint16(position, littleEndian)
                : view.getUint32(position, littleEndian),
        );
    }

    return found;
}

/**
 * Draw the preview the right way up (per EXIF orientation), no larger than MaxPreviewSide.
 */
function drawUpright(
    bitmap: ImageBitmap,
    orientation: number,
): Promise<Blob | null> {
    const scale = Math.min(
        1,
        MaxPreviewSide / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const sideways = orientation >= 5 && orientation <= 8;

    const canvas = document.createElement('canvas');
    canvas.width = sideways ? height : width;
    canvas.height = sideways ? width : height;
    const context = canvas.getContext('2d');

    if (!context) {
        return Promise.resolve(null);
    }

    const transforms: Record<
        number,
        [number, number, number, number, number, number]
    > = {
        2: [-1, 0, 0, 1, width, 0],
        3: [-1, 0, 0, -1, width, height],
        4: [1, 0, 0, -1, 0, height],
        5: [0, 1, 1, 0, 0, 0],
        6: [0, 1, -1, 0, height, 0],
        7: [0, -1, -1, 0, height, width],
        8: [0, -1, 1, 0, 0, width],
    };
    const transform = transforms[orientation];

    if (transform) {
        context.transform(...transform);
    }

    context.drawImage(bitmap, 0, 0, width, height);

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}
