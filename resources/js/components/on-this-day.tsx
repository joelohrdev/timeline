import { Link } from '@inertiajs/react';
import { timelineUrl } from '@/components/timeline-filters';
import { parseEntryDate } from '@/lib/dates';

export type OnThisDayEvent = {
    id: number;
    date: string;
    label: string;
    cover_url: string | null;
};

function yearsAgo(date: string): string {
    const years = new Date().getFullYear() - parseEntryDate(date).getFullYear();

    return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function OnThisDay({ events }: { events: OnThisDayEvent[] }) {
    if (events.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="on-this-day" className="mb-12 sm:mb-16">
            <h2
                id="on-this-day"
                className="font-display text-2xl tracking-tight text-ink sm:text-3xl"
            >
                On this day
            </h2>
            <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {events.map((event) => (
                    <Link
                        key={event.id}
                        href={timelineUrl({
                            date: event.date,
                            category: null,
                            search: null,
                        })}
                        className="group w-36 shrink-0 snap-start rounded-md focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none sm:w-44"
                    >
                        <div className="aspect-[4/3] overflow-hidden rounded-md bg-ink">
                            {event.cover_url ? (
                                <img
                                    src={event.cover_url}
                                    alt=""
                                    loading="lazy"
                                    className="size-full object-cover transition duration-500 ease-out group-hover:brightness-105 motion-safe:group-hover:scale-105"
                                />
                            ) : (
                                <p className="line-clamp-3 p-3 text-sm text-paper">
                                    {event.label}
                                </p>
                            )}
                        </div>
                        <p className="mt-2 text-sm text-ink-soft">
                            {yearsAgo(event.date)}
                        </p>
                        <p className="line-clamp-1 text-sm text-ink">
                            {event.label}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
