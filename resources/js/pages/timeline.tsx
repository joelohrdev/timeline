import { Head, InfiniteScroll, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { BackToTop } from '@/components/back-to-top';
import { DaySheet } from '@/components/day-sheet';
import { FindDay } from '@/components/find-day';
import { MonthCalendar } from '@/components/month-calendar';
import {
    CategoryFilter,
    FilterSummary,
    noMatchesMessage,
} from '@/components/timeline-filters';
import type { TimelineFilters } from '@/components/timeline-filters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { monthKey } from '@/lib/dates';
import { home } from '@/routes';
import { create } from '@/routes/entries';
import type {
    Entry,
    EntryCategory,
    Paginated,
    SelectOption,
    User,
} from '@/types';

function CalendarSkeleton() {
    return (
        <div className="pb-16">
            <Skeleton className="mb-8 h-14 w-64 bg-cell" />
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: 28 }, (_, index) => (
                    <Skeleton
                        key={index}
                        className="aspect-square rounded-sm bg-cell sm:rounded-md"
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Group newest-first entries into months, keeping newest month first.
 *
 * @returns list of [YYYY-MM, entries]
 */
function groupByMonth(entries: Entry[]): [string, Entry[]][] {
    const months = new Map<string, Entry[]>();

    for (const entry of entries) {
        const key = monthKey(entry.date);
        months.set(key, [...(months.get(key) ?? []), entry]);
    }

    return [...months.entries()];
}

type Props = {
    entries: Paginated<Entry>;
    jumpedTo: string | null;
    category: EntryCategory | null;
    categories: SelectOption<EntryCategory>[];
    firstDate: string | null;
};

export default function Timeline({
    entries,
    jumpedTo,
    category,
    categories,
    firstDate,
}: Props) {
    const user = usePage().props.auth.user as User | null;
    const [openDate, setOpenDate] = useState<string | null>(null);
    const [handledJump, setHandledJump] = useState<string | null>(null);
    const filters: TimelineFilters = { date: jumpedTo, category };
    const isFiltered = jumpedTo !== null || category !== null;
    const jumpedEntry = jumpedTo
        ? (entries.data.find((entry) => entry.date === jumpedTo) ?? null)
        : null;

    if (jumpedTo !== handledJump) {
        setHandledJump(jumpedTo);
        setOpenDate(jumpedEntry ? jumpedTo : null);
    }

    if (entries.data.length === 0 && !isFiltered) {
        return (
            <>
                <Head title="Timeline" />
                <div className="py-24">
                    <h1 className="font-display text-5xl tracking-tight text-ink">
                        Nothing here yet
                    </h1>
                    <p className="mt-3 max-w-sm text-ink-soft">
                        Each day gets one entry: a few photos and a few words.
                    </p>
                    {user && (
                        <Button asChild className="mt-8">
                            <Link href={create()}>Post today</Link>
                        </Button>
                    )}
                </div>
            </>
        );
    }

    const toolbar = (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 sm:mb-10">
            <div>
                {isFiltered && (
                    <FilterSummary
                        filters={filters}
                        foundDay={jumpedEntry !== null}
                    />
                )}
            </div>
            <div className="flex items-center gap-2">
                <CategoryFilter filters={filters} categories={categories} />
                <FindDay firstDate={firstDate} filters={filters} />
            </div>
        </div>
    );

    if (entries.data.length === 0) {
        return (
            <>
                <Head title="Timeline" />
                {toolbar}
                <div className="py-16">
                    <h1 className="font-display text-5xl tracking-tight text-ink">
                        No matches
                    </h1>
                    <p className="mt-3 max-w-sm text-ink-soft">
                        {noMatchesMessage(filters)}
                    </p>
                    <Button asChild variant="outline" className="mt-8">
                        <Link href={home()}>Clear filters</Link>
                    </Button>
                </div>
            </>
        );
    }

    const days = [...new Set(entries.data.map((entry) => entry.date))];
    const openIndex = openDate ? days.indexOf(openDate) : -1;

    return (
        <>
            <Head title="Timeline" />
            {toolbar}

            <InfiniteScroll
                data="entries"
                buffer={800}
                preserveUrl
                loading={<CalendarSkeleton />}
            >
                {groupByMonth(entries.data).map(([month, monthEntries]) => (
                    <MonthCalendar
                        key={month}
                        month={month}
                        entries={monthEntries}
                        highlightDate={jumpedTo}
                        onOpen={setOpenDate}
                    />
                ))}
            </InfiniteScroll>

            <DaySheet
                date={openIndex === -1 ? null : openDate}
                events={entries.data.filter((entry) => entry.date === openDate)}
                userId={user?.id ?? null}
                newer={openIndex > 0 ? days[openIndex - 1] : null}
                older={openIndex === -1 ? null : (days[openIndex + 1] ?? null)}
                onNavigate={setOpenDate}
            />

            <BackToTop />
        </>
    );
}
