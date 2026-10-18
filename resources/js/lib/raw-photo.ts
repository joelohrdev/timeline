/**
 * Apple ProRAW (and other DNG) photos are 50–100 MB, too large to upload. Every DNG carries a
 * full-colour JPEG preview, so we pull that out in the browser, apply the photo's orientation,
 * shrink it, and upload a normal JPEG instead.
 */

const MaxPreviewSide = 2400;

const Tag = {
    NewSubfileType: 0x00fe,
    ImageWidth: 0x0100,
    ImageLength: 0x0101,
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

        const jpeg = new Uint8Array(
            await file
                .slice(
                    found.preview.offset,
                    found.preview.offset + found.preview.length,
                )
                .arrayBuffer(),
        );

        // Decode the pixels exactly as stored: with EXIF removed, no browser can rotate them on its own.
        const bitmap = await createImageBitmap(
            new Blob([withoutExif(jpeg)], { type: 'image/jpeg' }),
        );
        const orientation = previewOrientation(
            found.orientation !== 1
                ? found.orientation
                : (jpegOrientation(jpeg) ?? 1),
            found.rawIsLandscape,
            bitmap.width >= bitmap.height,
        );
        const blob = await drawUpright(bitmap, orientation);
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

/**
 * The rotation still needed for the preview. Orientations 5–8 turn the picture sideways; if the preview's
 * shape already differs from the raw sensor image, it was stored upright and must not be turned again.
 */
function previewOrientation(
    stated: number,
    rawIsLandscape: boolean | null,
    previewIsLandscape: boolean,
): number {
    const turnsSideways = stated >= 5 && stated <= 8;

    if (
        turnsSideways &&
        rawIsLandscape !== null &&
        rawIsLandscape !== previewIsLandscape
    ) {
        return 1;
    }

    return stated;
}

function findPreview(view: DataView): {
    preview: Preview;
    orientation: number;
    rawIsLandscape: boolean | null;
} | null {
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
        rawIsLandscape: rawShape(view, ifds, littleEndian),
    };
}

/**
 * Whether the raw sensor image (CFA or LinearRaw) is wider than tall, or null when it can't be found.
 */
function rawShape(
    view: DataView,
    ifds: Ifd[],
    littleEndian: boolean,
): boolean | null {
    for (const ifd of ifds) {
        const photometric = values(view, ifd, Tag.Photometric, littleEndian)[0];
        const width = values(view, ifd, Tag.ImageWidth, littleEndian)[0];
        const height = values(view, ifd, Tag.ImageLength, littleEndian)[0];

        if (
            (photometric === 32803 || photometric === 34892) &&
            width &&
            height
        ) {
            return width >= height;
        }
    }

    return null;
}

/**
 * The EXIF orientation inside a JPEG, if it has one.
 */
function jpegOrientation(jpeg: Uint8Array): number | null {
    const view = new DataView(jpeg.buffer, jpeg.byteOffset, jpeg.byteLength);

    for (const segment of jpegSegments(view)) {
        if (
            segment.marker === 0xffe1 &&
            String.fromCharCode(
                ...jpeg.subarray(segment.start + 4, segment.start + 8),
            ) === 'Exif'
        ) {
            const tiff = segment.start + 10;
            const littleEndian = view.getUint8(tiff) === 0x49;
            const ifd = readIfd(
                view,
                tiff + view.getUint32(tiff + 4, littleEndian),
                littleEndian,
            );
            const entry = ifd?.entries.get(Tag.Orientation);

            return entry
                ? view.getUint16(entry.valuePosition, littleEndian)
                : null;
        }
    }

    return null;
}

/**
 * A copy of the JPEG with its APP1 (EXIF/XMP) segments removed.
 */
function withoutExif(jpeg: Uint8Array): Uint8Array<ArrayBuffer> {
    const view = new DataView(jpeg.buffer, jpeg.byteOffset, jpeg.byteLength);
    const kept: Uint8Array[] = [jpeg.subarray(0, 2)];
    let imageDataStart = 2;

    for (const segment of jpegSegments(view)) {
        if (segment.marker !== 0xffe1) {
            kept.push(jpeg.subarray(segment.start, segment.end));
        }

        imageDataStart = segment.end;
    }

    kept.push(jpeg.subarray(imageDataStart));

    const result = new Uint8Array(
        kept.reduce((total, part) => total + part.length, 0),
    );
    let offset = 0;

    for (const part of kept) {
        result.set(part, offset);
        offset += part.length;
    }

    return result;
}

/**
 * Header segments of a JPEG, up to (not including) the start of image data.
 */
function jpegSegments(
    view: DataView,
): { marker: number; start: number; end: number }[] {
    const segments: { marker: number; start: number; end: number }[] = [];

    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
        return segments;
    }

    let offset = 2;

    while (offset + 4 <= view.byteLength) {
        const marker = view.getUint16(offset);

        if (marker === 0xffda || (marker & 0xff00) !== 0xff00) {
            break;
        }

        const end = offset + 2 + view.getUint16(offset + 2);
        segments.push({ marker, start: offset, end });
        offset = end;
    }

    return segments;
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
