import { Share } from 'lucide-react';
import { EventBlock } from '@/components/event-block';
import { monthKey, parseEntryDate } from '@/lib/dates';
import { shareDay } from '@/lib/share-day';
import { cn } from '@/lib/utils';
import type { Entry } from '@/types';

type Props = {
    entries: Entry[];
    userId: number | null;
    highlightDate: string | null;
};

/**
 * The element id for a day, so a searched-for day can be scrolled into view.
 */
export function dayElementId(date: string): string {
    return `day-${date}`;
}

/**
 * Group newest-first entries into months, then days, keeping their order.
 */
function groupByMonthAndDay(entries: Entry[]): [string, [string, Entry[]][]][] {
    const months = new Map<string, Map<string, Entry[]>>();

    for (const entry of entries) {
        const days =
            months.get(monthKey(entry.date)) ?? new Map<string, Entry[]>();
        days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
        months.set(monthKey(entry.date), days);
    }

    return [...months.entries()].map(([month, days]) => [
        month,
        [...days.entries()],
    ]);
}

/**
 * The timeline view as month sections. Returned as a list (not wrapped in a component) so each month is a
 * direct child of InfiniteScroll, which tracks its children to know what has loaded.
 */
export function timelineSections({ entries, userId, highlightDate }: Props) {
    return groupByMonthAndDay(entries).map(([month, days]) => (
        <section key={month} className="mx-auto max-w-2xl pb-6">
            <h2 className="mb-8 font-display text-4xl tracking-tight text-ink sm:text-5xl">
                {parseEntryDate(`${month}-01`).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                })}
            </h2>

            {days.map(([date, events]) => {
                const day = parseEntryDate(date);
                const label = day.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                });

                return (
                    <div
                        key={date}
                        id={dayElementId(date)}
                        className={cn(
                            'scroll-mt-6 pb-16',
                            date === highlightDate &&
                                '-mx-3 mb-10 rounded-xl px-3 pt-3 pb-6 ring-2 ring-ink/15 sm:-mx-5 sm:px-5 sm:pt-5',
                        )}
                    >
                        <div className="mb-4 flex items-baseline justify-between gap-4">
                            <h3 className="text-lg font-medium text-ink">
                                {label}
                            </h3>
                            <button
                                type="button"
                                onClick={() =>
                                    void shareDay(
                                        date,
                                        day.toLocaleDateString(undefined, {
                                            dateStyle: 'long',
                                        }),
                                    )
                                }
                                aria-label={`Share ${label}`}
                                title="Share this day"
                                className="rounded-sm p-1 text-ink-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
                            >
                                <Share className="size-4" />
                            </button>
                        </div>

                        {events.map((event, index) => (
                            <EventBlock
                                key={event.id}
                                event={event}
                                canEdit={userId === event.user_id}
                                isFirst={index === 0}
                                inset={false}
                            />
                        ))}
                    </div>
                );
            })}
        </section>
    ));
}
