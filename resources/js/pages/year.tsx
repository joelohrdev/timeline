import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { timelineUrl } from '@/components/timeline-filters';
import { parseEntryDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { show as showYear } from '@/routes/years';

type Month = { month: string; days: number; cover_url: string | null };

type Game = {
    date: string;
    opponent: string | null;
    our_score: number | null;
    their_score: number | null;
};

type Listed = { date: string; label: string };

type Props = {
    year: number;
    years: number[];
    stats: { days: number; events: number; photos: number };
    months: Month[];
    games: {
        wins: number;
        losses: number;
        ties: number;
        scored: number;
        list: Game[];
    };
    birthdays: Listed[];
    holidays: Listed[];
};

function shortDate(date: string): string {
    return parseEntryDate(date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

function plural(count: number, one: string, many: string): string {
    return `${count.toLocaleString()} ${count === 1 ? one : many}`;
}

function dayLink(date: string) {
    return timelineUrl({ date, category: null, search: null });
}

function DayList({ title, items }: { title: string; items: Listed[] }) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section>
            <h2 className="font-display text-2xl tracking-tight text-ink">
                {title}
            </h2>
            <ul className="mt-3 divide-y divide-ink/10">
                {items.map((item) => (
                    <li key={`${item.date}-${item.label}`}>
                        <Link
                            href={dayLink(item.date)}
                            className="flex items-baseline justify-between gap-4 py-2.5 text-ink hover:underline hover:underline-offset-4"
                        >
                            <span>{item.label}</span>
                            <span className="shrink-0 text-sm text-ink-soft tabular-nums">
                                {shortDate(item.date)}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function Year({
    year,
    years,
    stats,
    months,
    games,
    birthdays,
    holidays,
}: Props) {
    const newer = years.filter((value) => value > year).at(-1) ?? null;
    const older = years.find((value) => value < year) ?? null;
    const gameCount = games.list.length;

    return (
        <>
            <Head title={`${year} in review`} />

            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-7xl leading-none tracking-tight text-ink sm:text-9xl">
                        {year}
                    </h1>
                    <p className="mt-4 max-w-md text-ink-soft">
                        {stats.events === 0
                            ? 'Nothing was posted this year.'
                            : `${plural(stats.days, 'day', 'days')} posted, ${plural(stats.events, 'event', 'events')}, ${plural(stats.photos, 'photo', 'photos')}.`}
                    </p>
                </div>
                <nav aria-label="Other years" className="flex gap-2 pb-1">
                    {newer !== null && (
                        <Link
                            href={showYear(newer)}
                            className="inline-flex items-center gap-1 rounded-md border border-ink/15 px-3 py-1.5 text-sm text-ink hover:bg-cell"
                        >
                            <ChevronLeft className="size-4" />
                            {newer}
                        </Link>
                    )}
                    {older !== null && (
                        <Link
                            href={showYear(older)}
                            className="inline-flex items-center gap-1 rounded-md border border-ink/15 px-3 py-1.5 text-sm text-ink hover:bg-cell"
                        >
                            {older}
                            <ChevronRight className="size-4" />
                        </Link>
                    )}
                    <Link
                        href={home()}
                        className="inline-flex items-center rounded-md px-3 py-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                    >
                        Timeline
                    </Link>
                </nav>
            </header>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-3 lg:grid-cols-4">
                {months.map((month) => {
                    const name = parseEntryDate(
                        `${month.month}-01`,
                    ).toLocaleDateString(undefined, { month: 'long' });
                    const tile = (
                        <>
                            <div
                                className={cn(
                                    'aspect-[4/3] overflow-hidden rounded-md',
                                    month.cover_url ? 'bg-cell' : 'bg-cell/60',
                                )}
                            >
                                {month.cover_url && (
                                    <img
                                        src={month.cover_url}
                                        alt=""
                                        loading="lazy"
                                        className="size-full object-cover transition duration-500 ease-out group-hover:brightness-105 motion-safe:group-hover:scale-105"
                                    />
                                )}
                            </div>
                            <p className="mt-2 flex items-baseline justify-between gap-2">
                                <span className="font-display text-lg text-ink">
                                    {name}
                                </span>
                                <span className="text-sm text-ink-soft">
                                    {month.days > 0
                                        ? plural(month.days, 'day', 'days')
                                        : ''}
                                </span>
                            </p>
                        </>
                    );

                    return month.days > 0 ? (
                        <Link
                            key={month.month}
                            href={dayLink(month.month)}
                            className="group rounded-md focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none"
                        >
                            {tile}
                        </Link>
                    ) : (
                        <div key={month.month} className="opacity-50">
                            {tile}
                        </div>
                    );
                })}
            </div>

            <div className="mt-16 grid gap-12 sm:mt-20 md:grid-cols-3 md:gap-10">
                {gameCount > 0 && (
                    <section>
                        <h2 className="font-display text-2xl tracking-tight text-ink">
                            Ball games
                        </h2>
                        <p className="mt-1 text-ink-soft">
                            {games.scored > 0
                                ? `${games.wins}–${games.losses}${games.ties > 0 ? `–${games.ties}` : ''} across ${plural(games.scored, 'scored game', 'scored games')}`
                                : plural(gameCount, 'game', 'games')}
                            {games.scored > 0 &&
                                gameCount > games.scored &&
                                `, plus ${plural(gameCount - games.scored, 'game', 'games')} without a score`}
                        </p>
                        <ul className="mt-3 divide-y divide-ink/10">
                            {games.list.map((game) => {
                                const scored =
                                    game.our_score !== null &&
                                    game.their_score !== null;
                                const result = !scored
                                    ? null
                                    : game.our_score! > game.their_score!
                                      ? 'W'
                                      : game.our_score! < game.their_score!
                                        ? 'L'
                                        : 'T';

                                return (
                                    <li
                                        key={`${game.date}-${game.opponent}-${game.our_score}`}
                                    >
                                        <Link
                                            href={dayLink(game.date)}
                                            className="flex items-baseline justify-between gap-4 py-2.5 text-ink hover:underline hover:underline-offset-4"
                                        >
                                            <span>
                                                {game.opponent ?? 'Game'}
                                            </span>
                                            <span className="shrink-0 text-sm text-ink-soft tabular-nums">
                                                {result &&
                                                    `${result} ${game.our_score}–${game.their_score}, `}
                                                {shortDate(game.date)}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}
                <DayList title="Birthdays" items={birthdays} />
                <DayList title="Holidays" items={holidays} />
            </div>
        </>
    );
}
