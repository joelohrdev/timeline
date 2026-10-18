const ExifIfdPointer = 0x8769;
const DateTimeOriginal = 0x9003;
const DateTime = 0x0132;

/**
 * Read the day a JPEG photo was taken from its EXIF data, as "YYYY-MM-DD".
 *
 * Returns null for other formats, photos without EXIF, or unreadable data.
 */
export async function photoTakenDate(file: File): Promise<string | null> {
    if (!/^image\/jpe?g$/.test(file.type)) {
        return null;
    }

    try {
        const buffer = await file.slice(0, 256 * 1024).arrayBuffer();

        return takenDateFromJpeg(new DataView(buffer));
    } catch {
        return null;
    }
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
