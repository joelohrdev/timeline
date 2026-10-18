import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useRef } from 'react';
import {
    Dialog,
    DialogClose,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from '@/components/ui/dialog';
import type { EntryImage } from '@/types';

type Props = {
    images: EntryImage[];
    index: number | null;
    title: string;
    onIndexChange: (index: number | null) => void;
};

const controlClass =
    'rounded-full bg-black/40 p-2 text-white/80 transition hover:bg-black/60 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none';

export function Lightbox({ images, index, title, onIndexChange }: Props) {
    const touchStartX = useRef<number | null>(null);
    const image = index === null ? null : images[index];
    const hasMany = images.length > 1;

    const step = (direction: 1 | -1) => {
        if (index === null || !hasMany) {
            return;
        }

        onIndexChange((index + direction + images.length) % images.length);
    };

    return (
        <Dialog
            open={image !== null}
            onOpenChange={(open) => !open && onIndexChange(null)}
        >
            <DialogPortal>
                <DialogOverlay className="bg-black/90" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowRight') {
                            step(1);
                        } else if (event.key === 'ArrowLeft') {
                            step(-1);
                        }
                    }}
                    onTouchStart={(event) => {
                        touchStartX.current = event.touches[0].clientX;
                    }}
                    onTouchEnd={(event) => {
                        if (touchStartX.current === null) {
                            return;
                        }

                        const distance =
                            event.changedTouches[0].clientX -
                            touchStartX.current;
                        touchStartX.current = null;

                        if (Math.abs(distance) > 50) {
                            step(distance < 0 ? 1 : -1);
                        }
                    }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            onIndexChange(null);
                        }
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:p-12"
                >
                    <DialogTitle className="sr-only">{title}</DialogTitle>

                    {image && (
                        <img
                            key={image.id}
                            src={image.url}
                            width={image.width}
                            height={image.height}
                            alt=""
                            className="max-h-full max-w-full rounded-md object-contain select-none"
                        />
                    )}

                    <DialogClose
                        className={`${controlClass} absolute top-4 right-4`}
                    >
                        <X className="size-5" />
                        <span className="sr-only">Close</span>
                    </DialogClose>

                    {hasMany && index !== null && (
                        <>
                            <button
                                type="button"
                                onClick={() => step(-1)}
                                className={`${controlClass} absolute top-1/2 left-3 -translate-y-1/2 sm:left-5`}
                            >
                                <ChevronLeft className="size-6" />
                                <span className="sr-only">Previous image</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => step(1)}
                                className={`${controlClass} absolute top-1/2 right-3 -translate-y-1/2 sm:right-5`}
                            >
                                <ChevronRight className="size-6" />
                                <span className="sr-only">Next image</span>
                            </button>
                            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70 tabular-nums">
                                {index + 1} / {images.length}
                            </p>
                        </>
                    )}
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
