const ExifIfdPointer = 0x8769;
const DateTimeOriginal = 0x9003;
const DateTime = 0x0132;

/**
 * Read the day a photo was taken from its EXIF data, as "YYYY-MM-DD".
 *
 * Supports JPEG, iPhone HEIC/HEIF and DNG (Apple ProRAW). Returns null for other formats, photos without EXIF, or unreadable data.
 */
export async function photoTakenDate(file: File): Promise<string | null> {
    try {
        if (/^image\/jpe?g$/.test(file.type)) {
            const head = await file.slice(0, 256 * 1024).arrayBuffer();

            return takenDateFromJpeg(new DataView(head));
        }

        if (
            /^image\/(x-adobe-)?dng$/.test(file.type) ||
            /\.dng$/i.test(file.name)
        ) {
            const head = await file.slice(0, 2 * 1024 * 1024).arrayBuffer();

            return readTiffDate(new DataView(head), 0);
        }

        if (
            /^image\/hei[cf]/.test(file.type) ||
            /\.hei[cf]$/i.test(file.name)
        ) {
            const head = await file.slice(0, 512 * 1024).arrayBuffer();
            const exif = findHeifExifItem(new DataView(head));

            if (!exif) {
                return null;
            }

            const item = await file
                .slice(exif.offset, exif.offset + exif.length)
                .arrayBuffer();

            return takenDateFromHeifExifItem(new DataView(item));
        }
    } catch {
        return null;
    }

    return null;
}

type Box = { type: string; start: number; contentStart: number; end: number };

/**
 * Walk ISO BMFF boxes between start and end.
 */
function boxes(view: DataView, start: number, end: number): Box[] {
    const found: Box[] = [];
    let offset = start;

    while (offset + 8 <= end) {
        let size = view.getUint32(offset);
        let headerSize = 8;

        if (size === 1) {
            if (offset + 16 > end) {
                break;
            }

            size = Number(view.getBigUint64(offset + 8));
            headerSize = 16;
        } else if (size === 0) {
            size = end - offset;
        }

        if (size < headerSize) {
            break;
        }

        found.push({
            type: readAscii(view, offset + 4, 4),
            start: offset,
            contentStart: offset + headerSize,
            end: Math.min(offset + size, end),
        });
        offset += size;
    }

    return found;
}

function readSized(view: DataView, offset: number, bytes: number): number {
    switch (bytes) {
        case 0:
            return 0;
        case 4:
            return view.getUint32(offset);
        case 8:
            return Number(view.getBigUint64(offset));
        default:
            throw new RangeError(`Unsupported field size ${bytes}`);
    }
}

/**
 * Locate the "Exif" item in a HEIC/HEIF file's meta box, as an absolute file offset and length.
 */
export function findHeifExifItem(
    view: DataView,
): { offset: number; length: number } | null {
    const meta = boxes(view, 0, view.byteLength).find(
        (box) => box.type === 'meta',
    );

    if (!meta) {
        return null;
    }

    const children = boxes(view, meta.contentStart + 4, meta.end);
    const iinf = children.find((box) => box.type === 'iinf');
    const iloc = children.find((box) => box.type === 'iloc');

    if (!iinf || !iloc) {
        return null;
    }

    const exifItemId = findExifItemId(view, iinf);

    return exifItemId === null
        ? null
        : findItemLocation(view, iloc, exifItemId);
}

function findExifItemId(view: DataView, iinf: Box): number | null {
    const version = view.getUint8(iinf.contentStart);
    const entriesStart = iinf.contentStart + 4 + (version === 0 ? 2 : 4);

    for (const infe of boxes(view, entriesStart, iinf.end)) {
        if (infe.type !== 'infe') {
            continue;
        }

        const infeVersion = view.getUint8(infe.contentStart);

        if (infeVersion < 2) {
            continue;
        }

        const idSize = infeVersion === 2 ? 2 : 4;
        const itemId =
            idSize === 2
                ? view.getUint16(infe.contentStart + 4)
                : view.getUint32(infe.contentStart + 4);
        const itemType = readAscii(view, infe.contentStart + 4 + idSize + 2, 4);

        if (itemType === 'Exif') {
            return itemId;
        }
    }

    return null;
}

function findItemLocation(
    view: DataView,
    iloc: Box,
    itemId: number,
): { offset: number; length: number } | null {
    let offset = iloc.contentStart;
    const version = view.getUint8(offset);
    offset += 4;

    const sizes = view.getUint8(offset);
    const offsetSize = sizes >> 4;
    const lengthSize = sizes & 0x0f;
    const moreSizes = view.getUint8(offset + 1);
    const baseOffsetSize = moreSizes >> 4;
    const indexSize = version === 1 || version === 2 ? moreSizes & 0x0f : 0;
    offset += 2;

    const itemCount =
        version < 2 ? view.getUint16(offset) : view.getUint32(offset);
    offset += version < 2 ? 2 : 4;

    for (let item = 0; item < itemCount; item++) {
        const id =
            version < 2 ? view.getUint16(offset) : view.getUint32(offset);
        offset += version < 2 ? 2 : 4;

        let constructionMethod = 0;

        if (version === 1 || version === 2) {
            constructionMethod = view.getUint16(offset) & 0x0f;
            offset += 2;
        }

        offset += 2;
        const baseOffset = readSized(view, offset, baseOffsetSize);
        offset += baseOffsetSize;

        const extentCount = view.getUint16(offset);
        offset += 2;

        let firstExtent: { offset: number; length: number } | null = null;

        for (let extent = 0; extent < extentCount; extent++) {
            offset += indexSize;
            const extentOffset = readSized(view, offset, offsetSize);
            offset += offsetSize;
            const extentLength = readSized(view, offset, lengthSize);
            offset += lengthSize;

            firstExtent ??= {
                offset: baseOffset + extentOffset,
                length: extentLength,
            };
        }

        if (id === itemId) {
            return constructionMethod === 0 ? firstExtent : null;
        }
    }

    return null;
}

/**
 * A HEIF Exif item starts with a 4-byte offset to the TIFF header, then the usual EXIF data.
 */
export function takenDateFromHeifExifItem(view: DataView): string | null {
    if (view.byteLength < 8) {
        return null;
    }

    return readTiffDate(view, 4 + view.getUint32(0));
}

export function takenDateFromJpeg(view: DataView): string | null {
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
        return null;
    }

    let offset = 2;

    while (offset + 4 <= view.byteLength) {
        const marker = view.getUint16(offset);

        if (marker === 0xffda) {
            return null;
        }

        const length = view.getUint16(offset + 2);

        if (marker === 0xffe1 && readAscii(view, offset + 4, 4) === 'Exif') {
            return readTiffDate(view, offset + 10);
        }

        offset += 2 + length;
    }

    return null;
}

function readTiffDate(view: DataView, tiffStart: number): string | null {
    const byteOrder = readAscii(view, tiffStart, 2);

    if (byteOrder !== 'II' && byteOrder !== 'MM') {
        return null;
    }

    const littleEndian = byteOrder === 'II';
    const ifd0 = tiffStart + view.getUint32(tiffStart + 4, littleEndian);
    const exifIfdOffset = findTag(view, ifd0, ExifIfdPointer, littleEndian);

    const original =
        exifIfdOffset === null
            ? null
            : readDateTag(
                  view,
                  tiffStart,
                  tiffStart + exifIfdOffset,
                  DateTimeOriginal,
                  littleEndian,
              );

    return (
        original ?? readDateTag(view, tiffStart, ifd0, DateTime, littleEndian)
    );
}

/**
 * Find a tag in an IFD and return its 4-byte value/offset field.
 */
function findTag(
    view: DataView,
    ifd: number,
    tag: number,
    littleEndian: boolean,
): number | null {
    if (ifd + 2 > view.byteLength) {
        return null;
    }

    const count = view.getUint16(ifd, littleEndian);

    for (let index = 0; index < count; index++) {
        const entry = ifd + 2 + index * 12;

        if (entry + 12 > view.byteLength) {
            return null;
        }

        if (view.getUint16(entry, littleEndian) === tag) {
            return view.getUint32(entry + 8, littleEndian);
        }
    }

    return null;
}

function readDateTag(
    view: DataView,
    tiffStart: number,
    ifd: number,
    tag: number,
    littleEndian: boolean,
): string | null {
    const valueOffset = findTag(view, ifd, tag, littleEndian);

    if (valueOffset === null) {
        return null;
    }

    const match = /^(\d{4}):(\d{2}):(\d{2})/.exec(
        readAscii(view, tiffStart + valueOffset, 19),
    );

    if (!match || match[1] === '0000') {
        return null;
    }

    return `${match[1]}-${match[2]}-${match[3]}`;
}

function readAscii(view: DataView, start: number, length: number): string {
    let text = '';

    for (
        let index = 0;
        index < length && start + index < view.byteLength;
        index++
    ) {
        text += String.fromCharCode(view.getUint8(start + index));
    }

    return text;
}
