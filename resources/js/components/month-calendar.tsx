import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { entryTheme } from '@/components/entry-category';
import { parseEntryDate, plainText, todayKey } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { create } from '@/routes/entries';
import { show as showYear } from '@/routes/years';
import type { Entry } from '@/types';

const weekdays = [
    ['S', 'Sun'],
    ['M', 'Mon'],
    ['T', 'Tue'],
    ['W', 'Wed'],
    ['T', 'Thu'],
    ['F', 'Fri'],
    ['S', 'Sat'],
];

type Props = {
    month: string;
    entries: Entry[];
    highlightDate?: string | null;
    onOpen: (date: string) => void;
    /** Logged in: empty past days link to a new entry on that date. */
    canAdd?: boolean;
};

const highlightRing = 'ring-2 ring-ink ring-offset-2 ring-offset-paper';

function dayKey(month: string, day: number): string {
    return `${month}-${String(day).padStart(2, '0')}`;
}

function CategoryMarker({ entry }: { entry: Entry }) {
    const theme = entryTheme(entry);

    if (!theme) {
        return null;
    }

    const Icon = theme.icon;

    return (
        <span
            className={cn(
                'absolute right-1 bottom-1 grid size-5 place-items-center rounded-full bg-paper shadow-sm sm:right-1.5 sm:bottom-1.5 sm:size-8',
                theme.accent,
            )}
        >
            <Icon className="size-3.5 sm:size-5.5" />
            <span className="sr-only">{theme.label}</span>
        </span>
    );
}

function DayCell({
    events,
    highlighted,
    onOpen,
}: {
    events: Entry[];
    highlighted: boolean;
    onOpen: () => void;
}) {
    const cover = events.find((event) => event.images.length > 0) ?? events[0];
    const hero = cover.images[0];
    const categorized = events.find((event) => entryTheme(event) !== null);
    const day = parseEntryDate(cover.date);
    const label = day.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={
                events.length === 1
                    ? `Open ${label}`
                    : `Open ${label}, ${events.length} events`
            }
            className={cn(
                'group relative flex aspect-square cursor-pointer flex-col items-start justify-start overflow-hidden rounded-sm text-left sm:rounded-md',
                'focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none',
                hero ? 'bg-cell' : 'bg-ink text-paper',
                highlighted && highlightRing,
            )}
        >
            {hero && (
                <img
                    src={hero.thumb_url}
                    loading="lazy"
                    alt=""
                    className="absolute inset-0 size-full object-cover transition duration-500 ease-out group-hover:brightness-105 motion-safe:group-hover:scale-105"
                />
            )}

            <span
                className={cn(
                    'relative block p-1 text-[11px] leading-none font-medium tabular-nums sm:p-2 sm:text-sm',
                    hero && 'text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]',
                )}
            >
                {day.getDate()}
            </span>

            {events.length > 1 && (
                <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-paper px-1 text-[10px] leading-none font-semibold text-ink tabular-nums shadow-sm sm:top-1.5 sm:right-1.5 sm:h-5 sm:min-w-5 sm:text-xs"
                >
                    {events.length}
                </span>
            )}

            {!hero && cover.body && (
                <span className="relative mx-2 line-clamp-3 hidden text-xs leading-snug opacity-80 sm:block">
                    {cover.title ?? plainText(cover.body)}
                </span>
            )}

            {categorized && <CategoryMarker entry={categorized} />}
        </button>
    );
}

export function MonthCalendar({
    month,
    entries,
    highlightDate,
    onOpen,
    canAdd = false,
}: Props) {
    const first = parseEntryDate(`${month}-01`);
    const daysInMonth = new Date(
        first.getFullYear(),
        first.getMonth() + 1,
        0,
    ).getDate();
    const leadingBlanks = first.getDay();
    const today = todayKey();
    const entriesByDay = new Map<string, Entry[]>();

    for (const entry of entries) {
        entriesByDay.set(entry.date, [
            ...(entriesByDay.get(entry.date) ?? []),
            entry,
        ]);
    }

    return (
        <section
            className="pb-16 sm:pb-24"
            aria-label={first.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
            })}
        >
            <header className="mb-5 flex items-end justify-between gap-4 sm:mb-8">
                <h2 className="font-display text-5xl leading-none font-normal tracking-tight text-ink sm:text-7xl">
                    {first.toLocaleDateString(undefined, { month: 'long' })}
                    <Link
                        href={showYear(first.getFullYear())}
                        className="ml-3 align-top font-sans text-base font-normal tracking-normal text-ink-soft underline-offset-4 hover:text-ink hover:underline sm:text-xl"
                    >
                        {first.getFullYear()}
                    </Link>
                </h2>
                <p className="pb-1 text-sm text-ink-soft">
                    {entriesByDay.size === 1
                        ? '1 day posted'
                        : `${entriesByDay.size} days posted`}
                </p>
            </header>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {weekdays.map(([short, long], index) => (
                    <div
                        key={index}
                        aria-hidden="true"
                        className="pb-1 text-center text-xs text-ink-soft sm:pb-2"
                    >
                        <span className="sm:hidden">{short}</span>
                        <span className="hidden sm:inline">{long}</span>
                    </div>
                ))}

                {Array.from({ length: leadingBlanks }, (_, index) => (
                    <div key={`blank-${index}`} aria-hidden="true" />
                ))}

                {Array.from({ length: daysInMonth }, (_, index) => {
                    const day = index + 1;
                    const key = dayKey(month, day);
                    const events = entriesByDay.get(key);

                    if (events) {
                        return (
                            <DayCell
                                key={key}
                                events={events}
                                highlighted={key === highlightDate}
                                onOpen={() => onOpen(key)}
                            />
                        );
                    }

                    const emptyClass = cn(
                        'aspect-square rounded-sm p-1 text-[11px] leading-none text-ink-soft tabular-nums sm:rounded-md sm:p-2 sm:text-sm',
                        key > today ? 'opacity-40' : 'bg-cell',
                        key === today && 'ring-1 ring-ink/40 ring-inset',
                        key === highlightDate && highlightRing,
                    );

                    if (canAdd && key <= today) {
                        return (
                            <Link
                                key={key}
                                href={create({ query: { date: key } })}
                                aria-label={`Add an entry for ${parseEntryDate(key).toLocaleDateString(undefined, { dateStyle: 'long' })}`}
                                className={cn(
                                    emptyClass,
                                    'group relative flex flex-col justify-between hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none',
                                )}
                            >
                                {day}
                                <Plus
                                    aria-hidden="true"
                                    className="size-4 self-center opacity-0 transition group-hover:opacity-60 group-focus-visible:opacity-60 sm:mb-3 sm:size-5"
                                />
                            </Link>
                        );
                    }

                    return (
                        <div key={key} className={emptyClass}>
                            {day}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
