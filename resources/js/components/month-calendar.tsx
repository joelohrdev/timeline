import { entryTheme } from '@/components/entry-category';
import { parseEntryDate, plainText, todayKey } from '@/lib/dates';
import { cn } from '@/lib/utils';
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
    onOpen: (entry: Entry) => void;
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
                'absolute right-1 bottom-1 grid size-4 place-items-center rounded-full bg-paper shadow-sm sm:right-1.5 sm:bottom-1.5 sm:size-6',
                theme.accent,
            )}
        >
            <Icon className="size-2.5 sm:size-3.5" />
            <span className="sr-only">{theme.label}</span>
        </span>
    );
}

function EntryCell({
    entry,
    highlighted,
    onOpen,
}: {
    entry: Entry;
    highlighted: boolean;
    onOpen: () => void;
}) {
    const hero = entry.images[0];
    const day = parseEntryDate(entry.date);
    const label = day.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`Open ${label}`}
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

            {!hero && entry.body && (
                <span className="relative mx-2 line-clamp-3 hidden text-xs leading-snug opacity-80 sm:block">
                    {plainText(entry.body)}
                </span>
            )}

            <CategoryMarker entry={entry} />
        </button>
    );
}

export function MonthCalendar({
    month,
    entries,
    highlightDate,
    onOpen,
}: Props) {
    const first = parseEntryDate(`${month}-01`);
    const daysInMonth = new Date(
        first.getFullYear(),
        first.getMonth() + 1,
        0,
    ).getDate();
    const leadingBlanks = first.getDay();
    const today = todayKey();
    const entriesByDay = new Map(entries.map((entry) => [entry.date, entry]));

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
                    <span className="ml-3 align-top font-sans text-base font-normal tracking-normal text-ink-soft sm:text-xl">
                        {first.getFullYear()}
                    </span>
                </h2>
                <p className="pb-1 text-sm text-ink-soft">
                    {entries.length === 1
                        ? '1 day posted'
                        : `${entries.length} days posted`}
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
                    const entry = entriesByDay.get(key);

                    if (entry) {
                        return (
                            <EntryCell
                                key={key}
                                entry={entry}
                                highlighted={key === highlightDate}
                                onOpen={() => onOpen(entry)}
                            />
                        );
                    }

                    return (
                        <div
                            key={key}
                            className={cn(
                                'aspect-square rounded-sm p-1 text-[11px] leading-none text-ink-soft tabular-nums sm:rounded-md sm:p-2 sm:text-sm',
                                key > today ? 'opacity-40' : 'bg-cell',
                                key === today &&
                                    'ring-1 ring-ink/40 ring-inset',
                                key === highlightDate && highlightRing,
                            )}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
