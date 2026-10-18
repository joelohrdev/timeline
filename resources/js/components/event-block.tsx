import { Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { EntryCategoryLine, entryTheme } from '@/components/entry-category';
import { Lightbox } from '@/components/lightbox';
import { parseEntryDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/entries';
import type { Entry } from '@/types';

const photoButtonClass =
    'group block w-full cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none';

/**
 * One event: title, category, photos (opening in the lightbox), text and, for its poster, an Edit link.
 *
 * Inset adds side padding for the day panel; without it the event fills its column (timeline view).
 */
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
    const theme = entryTheme(event);
    const date = parseEntryDate(event.date);

    return (
        <article
            className={cn(!isFirst && 'mt-10 border-t border-ink/10 pt-8')}
        >
            {(event.title || theme || canEdit) && (
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

            {rest.length > 0 && (
                <div
                    className={cn(
                        'mt-1 grid grid-cols-4 gap-1',
                        inset && 'px-1',
                    )}
                >
                    {rest.map((image, offset) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setOpenIndex(offset + 1)}
                            className={cn(
                                photoButtonClass,
                                !inset && 'rounded-sm',
                            )}
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
