import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useState } from 'react';
import { EntryCategoryLine, entryTheme } from '@/components/entry-category';
import { Lightbox } from '@/components/lightbox';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { parseEntryDate } from '@/lib/dates';
import { edit } from '@/routes/entries';
import type { Entry } from '@/types';

type Props = {
    entry: Entry | null;
    canEdit: boolean;
    newer: Entry | null;
    older: Entry | null;
    onNavigate: (entry: Entry | null) => void;
};

const photoButtonClass =
    'group block w-full cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none';

function DayContent({
    entry,
    canEdit,
    newer,
    older,
    onNavigate,
}: Omit<Props, 'entry'> & { entry: Entry }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [hero, ...rest] = entry.images;
    const theme = entryTheme(entry);
    const date = parseEntryDate(entry.date);

    return (
        <>
            <div className="px-5 pt-6 pb-5 sm:px-8 sm:pt-8">
                <SheetTitle className="font-display text-3xl leading-tight font-normal tracking-tight text-ink sm:text-4xl">
                    {date.toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                    })}
                </SheetTitle>
                <SheetDescription className="mt-1 text-ink-soft">
                    {date.toLocaleDateString(undefined, { weekday: 'long' })},{' '}
                    {date.getFullYear()}
                </SheetDescription>
                {theme && (
                    <EntryCategoryLine
                        entry={entry}
                        theme={theme}
                        className="mt-3"
                    />
                )}
            </div>

            {hero && (
                <button
                    type="button"
                    onClick={() => setOpenIndex(0)}
                    className={photoButtonClass}
                >
                    <span className="sr-only">Open photo 1</span>
                    <img
                        src={hero.url}
                        width={hero.width}
                        height={hero.height}
                        alt=""
                        className="w-full bg-cell object-cover transition duration-500 ease-out group-hover:brightness-105"
                    />
                </button>
            )}

            {rest.length > 0 && (
                <div className="mt-1 grid grid-cols-4 gap-1 px-1">
                    {rest.map((image, offset) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setOpenIndex(offset + 1)}
                            className={photoButtonClass}
                        >
                            <span className="sr-only">
                                Open photo {offset + 2}
                            </span>
                            <img
                                src={image.thumb_url}
                                loading="lazy"
                                alt=""
                                className="aspect-square w-full bg-cell object-cover transition duration-500 ease-out group-hover:brightness-105 motion-safe:group-hover:scale-105"
                            />
                        </button>
                    ))}
                </div>
            )}

            {entry.body && (
                <div
                    className="rich-text px-5 pt-6 text-base leading-7 text-ink sm:px-8"
                    dangerouslySetInnerHTML={{ __html: entry.body }}
                />
            )}

            <div className="mt-auto flex items-center justify-between gap-2 px-5 pt-8 pb-6 sm:px-8">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!newer}
                        onClick={() => onNavigate(newer)}
                    >
                        <ChevronLeft />
                        Newer
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!older}
                        onClick={() => onNavigate(older)}
                    >
                        Older
                        <ChevronRight />
                    </Button>
                </div>

                {canEdit && (
                    <Link
                        href={edit(entry.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                    >
                        <Pencil className="size-3.5" />
                        Edit
                    </Link>
                )}
            </div>

            <Lightbox
                images={entry.images}
                index={openIndex}
                title={`Photos from ${date.toLocaleDateString(undefined, { dateStyle: 'long' })}`}
                onIndexChange={setOpenIndex}
            />
        </>
    );
}

export function DaySheet({ entry, onNavigate, ...props }: Props) {
    return (
        <Sheet
            open={entry !== null}
            onOpenChange={(open) => !open && onNavigate(null)}
        >
            <SheetContent
                side="right"
                className="w-full gap-0 overflow-y-auto border-none bg-paper p-0 sm:max-w-xl"
            >
                {entry && (
                    <DayContent
                        key={entry.id}
                        entry={entry}
                        onNavigate={onNavigate}
                        {...props}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}
