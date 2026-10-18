import { Link } from '@inertiajs/react';
import { MapPin, Pencil } from 'lucide-react';
import { useState } from 'react';
import { EntryCategoryLine, entryTheme } from '@/components/entry-category';
import { Lightbox } from '@/components/lightbox';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { parseEntryDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/entries';
import type { Entry, EntryImage } from '@/types';

const photoButtonClass =
    'group relative block w-full cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none';

/**
 * One event: title, category, photos (opening in the lightbox), text and, for its poster, an Edit link.
 *
 * Inset adds side padding for the day panel; without it the event fills its column (timeline view).
 */
function ExtraPhoto({
    image,
    number,
    rounded,
    onOpen,
}: {
    image: EntryImage;
    number: number;
    rounded: boolean;
    onOpen: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(photoButtonClass, rounded && 'rounded-sm')}
        >
            <span className="sr-only">Open photo {number}</span>
            <img
                src={image.thumb_url}
                loading="lazy"
                alt=""
                className="aspect-square w-full bg-cell object-cover transition duration-500 ease-out group-hover:brightness-105 motion-safe:group-hover:scale-105"
            />
        </button>
    );
}

export function EventBlock({
    event,
    canEdit,
    isFirst,
    inset = true,
}: {
    event: Entry;
    canEdit: boolean;
    isFirst: boolean;
    inset?: boolean;
}) {
    const padding = inset ? 'px-5 sm:px-8' : '';
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [hero, ...rest] = event.images;
    // In the timeline view, more than four extra photos go in a carousel instead of adding rows.
    const scrollsExtras = !inset && rest.length > 4;
    const theme = entryTheme(event);
    const location = [
        event.location_place,
        event.location_city,
        event.location_state,
    ]
        .filter(Boolean)
        .join(', ');
    const date = parseEntryDate(event.date);

    return (
        <article
            className={cn(!isFirst && 'mt-10 border-t border-ink/10 pt-8')}
        >
            {(event.title || theme || location || canEdit) && (
                <div
                    className={cn(
                        'flex items-start justify-between gap-4 pb-4',
                        padding,
                    )}
                >
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
                        {location && (
                            <p
                                className={cn(
                                    'flex items-center gap-1.5 text-sm text-ink-soft',
                                    (event.title || theme) && 'mt-1',
                                )}
                            >
                                <MapPin className="size-4 shrink-0" />
                                {location}
                            </p>
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
                    className={cn(photoButtonClass, !inset && 'rounded-md')}
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

            {rest.length > 0 && !scrollsExtras && (
                <div
                    className={cn(
                        'mt-1 grid grid-cols-4 gap-1',
                        inset && 'px-1',
                    )}
                >
                    {rest.map((image, offset) => (
                        <ExtraPhoto
                            key={image.id}
                            image={image}
                            number={offset + 2}
                            rounded={!inset}
                            onOpen={() => setOpenIndex(offset + 1)}
                        />
                    ))}
                </div>
            )}

            {scrollsExtras && (
                <Carousel
                    opts={{ align: 'start', dragFree: true }}
                    className="mt-1"
                    aria-label={`${rest.length} more photos`}
                >
                    <CarouselContent className="-ml-1">
                        {rest.map((image, offset) => (
                            <CarouselItem
                                key={image.id}
                                className="basis-[23%] pl-1"
                            >
                                <ExtraPhoto
                                    image={image}
                                    number={offset + 2}
                                    rounded
                                    onOpen={() => setOpenIndex(offset + 1)}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 hidden border-none bg-paper/90 text-ink shadow-md hover:bg-paper disabled:opacity-0 sm:inline-flex" />
                    <CarouselNext className="right-2 hidden border-none bg-paper/90 text-ink shadow-md hover:bg-paper disabled:opacity-0 sm:inline-flex" />
                </Carousel>
            )}

            {event.body && (
                <div
                    className={cn(
                        'rich-text pt-6 text-base leading-7 text-ink',
                        padding,
                    )}
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
