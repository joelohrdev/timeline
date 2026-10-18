import { Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Lightbox } from '@/components/lightbox';
import { edit } from '@/routes/entries';
import type { Entry } from '@/types';

export function parseEntryDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
}

export function TimelineDate({ date }: { date: string }) {
    const parsed = parseEntryDate(date);
    const showYear = parsed.getFullYear() !== new Date().getFullYear();

    return (
        <time dateTime={date} className="block text-right">
            <span className="block text-2xl leading-none font-medium tabular-nums sm:text-3xl">
                {parsed.getDate()}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
                {parsed.toLocaleDateString(undefined, { month: 'short' })} ·{' '}
                {parsed.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
            {showYear && (
                <span className="block text-xs text-muted-foreground">
                    {parsed.getFullYear()}
                </span>
            )}
        </time>
    );
}

export function TimelineRow({
    marker,
    children,
}: {
    marker: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-5 pb-12 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-x-7">
            <div className="pt-1">{marker}</div>
            <span
                aria-hidden="true"
                className="absolute top-2.5 left-[calc(3.5rem+0.625rem-4.5px)] size-[9px] rounded-full bg-foreground ring-4 ring-background sm:left-[calc(4.5rem+0.875rem-4.5px)]"
            />
            <div>{children}</div>
        </div>
    );
}

export function TimelineEntry({
    entry,
    canEdit,
}: {
    entry: Entry;
    canEdit: boolean;
}) {
    const [hero, ...rest] = entry.images;
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const imageButtonClass =
        'group block w-full cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none';

    return (
        <article>
            <TimelineRow marker={<TimelineDate date={entry.date} />}>
                {hero && (
                    <button
                        type="button"
                        onClick={() => setOpenIndex(0)}
                        className={`${imageButtonClass} rounded-xl`}
                    >
                        <span className="sr-only">Open photo 1</span>
                        <img
                            src={hero.url}
                            width={hero.width}
                            height={hero.height}
                            loading="lazy"
                            alt=""
                            className="aspect-[3/2] w-full bg-muted object-cover transition duration-500 ease-out group-hover:brightness-105 motion-safe:group-hover:scale-[1.03]"
                        />
                    </button>
                )}

                {rest.length > 0 && (
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                        {rest.map((image, offset) => (
                            <button
                                key={image.id}
                                type="button"
                                onClick={() => setOpenIndex(offset + 1)}
                                className={`${imageButtonClass} rounded-md`}
                            >
                                <span className="sr-only">
                                    Open photo {offset + 2}
                                </span>
                                <img
                                    src={image.thumb_url}
                                    loading="lazy"
                                    alt=""
                                    className="aspect-square w-full bg-muted object-cover transition duration-500 ease-out group-hover:brightness-105 motion-safe:group-hover:scale-105"
                                />
                            </button>
                        ))}
                    </div>
                )}

                {entry.body && (
                    <div
                        className="rich-text mt-4 text-[15px] leading-7"
                        dangerouslySetInnerHTML={{ __html: entry.body }}
                    />
                )}

                {canEdit && (
                    <Link
                        href={edit(entry.id)}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="size-3" />
                        Edit
                    </Link>
                )}
            </TimelineRow>

            <Lightbox
                images={entry.images}
                index={openIndex}
                title={`Photos from ${parseEntryDate(entry.date).toLocaleDateString(undefined, { dateStyle: 'long' })}`}
                onIndexChange={setOpenIndex}
            />
        </article>
    );
}
