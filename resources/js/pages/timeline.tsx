import { Head, InfiniteScroll, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { BackToTop } from '@/components/back-to-top';
import { DaySheet } from '@/components/day-sheet';
import { FindDay } from '@/components/find-day';
import { MonthCalendar } from '@/components/month-calendar';
import { dayElementId, timelineSections } from '@/components/timeline-list';
import { useTimelineView, ViewToggle } from '@/components/view-toggle';
import type { TimelineView } from '@/components/view-toggle';
import { OnThisDay } from '@/components/on-this-day';
import type { OnThisDayEvent } from '@/components/on-this-day';
import {
    CategoryFilter,
    FilterSummary,
    isDayFilter,
    noMatchesMessage,
    SearchBox,
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

function ListSkeleton() {
    return (
        <div className="mx-auto max-w-2xl pb-16">
            <Skeleton className="mb-4 h-6 w-56 bg-cell" />
            <Skeleton className="aspect-[3/2] w-full rounded-md bg-cell" />
            <Skeleton className="mt-6 h-4 w-4/5 bg-cell" />
        </div>
    );
}

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
    search: string | null;
    categories: SelectOption<EntryCategory>[];
    firstDate: string | null;
    onThisDay: OnThisDayEvent[];
};

export default function Timeline({
    entries,
    jumpedTo,
    category,
    search,
    categories,
    firstDate,
    onThisDay,
}: Props) {
    const user = usePage().props.auth.user as User | null;
    const [openDate, setOpenDate] = useState<string | null>(null);
    const [handledJump, setHandledJump] = useState<string | null>(null);
    const [view, setView] = useTimelineView();
    const filters: TimelineFilters = { date: jumpedTo, category, search };
    const isFiltered =
        jumpedTo !== null || category !== null || search !== null;
    const jumpedDay = isDayFilter(jumpedTo) ? jumpedTo : null;
    const jumpedEntry = jumpedDay
        ? (entries.data.find((entry) => entry.date === jumpedDay) ?? null)
        : null;

    if (jumpedTo !== handledJump) {
        setHandledJump(jumpedTo);
        setOpenDate(jumpedEntry && view === 'calendar' ? jumpedDay : null);
    }

    useEffect(() => {
        if (view !== 'timeline' || !jumpedDay) {
            return;
        }

        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        document.getElementById(dayElementId(jumpedDay))?.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'start',
        });
    }, [view, jumpedDay]);

    const changeView = (next: TimelineView) => {
        setOpenDate(null);
        setView(next);
    };

    if (entries.data.length === 0 && !isFiltered) {
        return (
            <>
                <Head title="Timeline" />
                <div className="py-24">
                    <h1 className="font-display text-5xl tracking-tight text-ink">
                        Nothing here yet
                    </h1>
                    <p className="mt-3 max-w-sm text-ink-soft">
                        Post a few photos and a few words for anything worth
                        remembering.
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
            <div className="flex flex-wrap items-center gap-2">
                <ViewToggle view={view} onChange={changeView} />
                <SearchBox filters={filters} />
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
            {!isFiltered && <OnThisDay events={onThisDay} />}
            {toolbar}

            <InfiniteScroll
                data="entries"
                buffer={800}
                preserveUrl
                loading={
                    view === 'calendar' ? (
                        <CalendarSkeleton />
                    ) : (
                        <ListSkeleton />
                    )
                }
            >
                {view === 'calendar'
                    ? groupByMonth(entries.data).map(
                          ([month, monthEntries]) => (
                              <MonthCalendar
                                  key={month}
                                  month={month}
                                  entries={monthEntries}
                                  highlightDate={jumpedDay}
                                  onOpen={setOpenDate}
                              />
                          ),
                      )
                    : timelineSections({
                          entries: entries.data,
                          userId: user?.id ?? null,
                          highlightDate: jumpedDay,
                      })}
            </InfiniteScroll>

            {view === 'calendar' && (
                <DaySheet
                    date={openIndex === -1 ? null : openDate}
                    events={entries.data.filter(
                        (entry) => entry.date === openDate,
                    )}
                    userId={user?.id ?? null}
                    newer={openIndex > 0 ? days[openIndex - 1] : null}
                    older={
                        openIndex === -1 ? null : (days[openIndex + 1] ?? null)
                    }
                    onNavigate={setOpenDate}
                />
            )}

            <BackToTop />
        </>
    );
}
