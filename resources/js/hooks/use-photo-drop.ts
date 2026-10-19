import { useRef, useState } from 'react';
import type { DragEvent } from 'react';

const photoTypes =
    /^image\/(jpe?g|png|webp|hei[cf](-sequence)?|(x-adobe-)?dng)$/;
const photoExtensions = /\.(jpe?g|png|webp|hei[cf]|dng)$/i;

/**
 * Whether a file is a photo the app accepts, by type or (when the browser leaves the type blank) by extension.
 */
export function isAcceptedPhoto(file: File): boolean {
    return photoTypes.test(file.type) || photoExtensions.test(file.name);
}

/**
 * Drag-and-drop handling for a photo drop area: highlights while files are dragged over it and hands dropped
 * photos to onPhotos. Anything else dropped is counted in `ignored` so the page can say so.
 */
export function usePhotoDrop(onPhotos: (photos: File[]) => void) {
    const [isDragging, setIsDragging] = useState(false);
    const [ignored, setIgnored] = useState(0);
    // dragenter/dragleave fire for every child element; count them so the highlight doesn't flicker.
    const depth = useRef(0);

    const carriesFiles = (event: DragEvent) =>
        Array.from(event.dataTransfer.types).includes('Files');

    const dropProps = {
        onDragEnter: (event: DragEvent) => {
            if (!carriesFiles(event)) {
                return;
            }

            event.preventDefault();
            depth.current++;
            setIsDragging(true);
        },
        onDragOver: (event: DragEvent) => {
            if (!carriesFiles(event)) {
                return;
            }

            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        },
        onDragLeave: (event: DragEvent) => {
            if (!carriesFiles(event)) {
                return;
            }

            depth.current = Math.max(0, depth.current - 1);

            if (depth.current === 0) {
                setIsDragging(false);
            }
        },
        onDrop: (event: DragEvent) => {
            if (!carriesFiles(event)) {
                return;
            }

            event.preventDefault();
            depth.current = 0;
            setIsDragging(false);

            const files = Array.from(event.dataTransfer.files);
            const photos = files.filter(isAcceptedPhoto);

            setIgnored(files.length - photos.length);

            if (photos.length > 0) {
                onPhotos(photos);
            }
        },
    };

    return { isDragging, ignored, dropProps };
}
