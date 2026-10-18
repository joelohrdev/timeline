import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { create, edit } from '@/routes/entries';
import type { Entry } from '@/types';

type Props = {
    date: string | null;
    events: Entry[];
    userId: number | null;
    newer: string | null;
    older: string | null;
    onNavigate: (date: string | null) => void;
};

const photoButtonClass =
    'group block w-full cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none';

function EventBlock({
    event,
    canEdit,
    isFirst,
}: {
    event: Entry;
    canEdit: boolean;
    isFirst: boolean;
}) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [hero, ...rest] = event.images;
    const theme = entryTheme(event);
    const date = parseEntryDate(event.date);

    return (
        <article
            className={cn(!isFirst && 'mt-10 border-t border-ink/10 pt-8')}
        >
            {(event.title || theme || canEdit) && (
                <div className="flex items-start justify-between gap-4 px-5 pb-4 sm:px-8">
                    <div>
                        {event.title && (
                            <h3 className="font-display text-2xl leading-snug tracking-tight text-ink">
                                {event.title}
                            </h3>
                        )}
                        {theme && (
                            <EntryCategoryLine
                                entry={event}
                                theme={theme}
                                className={cn(event.title && 'mt-1')}
                            />
                        )}
                    </div>
                    {canEdit && (
                        <Link
                            href={edit(event.id)}
                            className="mt-1 inline-flex shrink-0 items-center gap-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                        >
                            <Pencil className="size-3.5" />
                            Edit
                        </Link>
                    )}
                </div>
            )}

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
                        loading="lazy"
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

            {event.body && (
                <div
                    className="rich-text px-5 pt-6 text-base leading-7 text-ink sm:px-8"
                    dangerouslySetInnerHTML={{ __html: event.body }}
                />
            )}

            <Lightbox
                images={event.images}
                index={openIndex}
                title={`Photos from ${event.title ?? date.toLocaleDateString(undefined, { dateStyle: 'long' })}`}
                onIndexChange={setOpenIndex}
            />
        </article>
    );
}

function DayContent({
    date,
    events,
    userId,
    newer,
    older,
    onNavigate,
}: Props & { date: string }) {
    const day = parseEntryDate(date);

    return (
        <>
            <div className="px-5 pt-6 pb-5 sm:px-8 sm:pt-8">
                <SheetTitle className="font-display text-3xl leading-tight font-normal tracking-tight text-ink sm:text-4xl">
                    {day.toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                    })}
                </SheetTitle>
                <SheetDescription className="mt-1 text-ink-soft">
                    {day.toLocaleDateString(undefined, { weekday: 'long' })},{' '}
                    {day.getFullYear()}
                    {events.length > 1 && `, ${events.length} events`}
                </SheetDescription>
            </div>

            {events.map((event, index) => (
                <EventBlock
                    key={event.id}
                    event={event}
                    canEdit={userId === event.user_id}
                    isFirst={index === 0}
                />
            ))}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 px-5 pt-10 pb-6 sm:px-8">
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

                {userId !== null && (
                    <Link
                        href={create({ query: { date } })}
                        className="inline-flex items-center gap-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                    >
                        <Plus className="size-3.5" />
                        Add another event
                    </Link>
                )}
            </div>
        </>
    );
}

export function DaySheet(props: Props) {
    const { date, onNavigate } = props;

    return (
        <Sheet
            open={date !== null}
            onOpenChange={(open) => !open && onNavigate(null)}
        >
            <SheetContent
                side="right"
                className="w-full gap-0 overflow-y-auto border-none bg-paper p-0 sm:max-w-xl"
            >
                {date && <DayContent key={date} {...props} date={date} />}
            </SheetContent>
        </Sheet>
    );
}
