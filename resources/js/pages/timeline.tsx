import { Head, InfiniteScroll, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { BackToTop } from '@/components/back-to-top';
import { DaySheet } from '@/components/day-sheet';
import { FindDay } from '@/components/find-day';
import { MonthCalendar } from '@/components/month-calendar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { monthKey, parseEntryDate } from '@/lib/dates';
import { home } from '@/routes';
import { create } from '@/routes/entries';
import type { Entry, Paginated, User } from '@/types';

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
    firstDate: string | null;
};

function SearchSummary({
    jumpedTo,
    found,
}: {
    jumpedTo: string;
    found: boolean;
}) {
    const date = parseEntryDate(jumpedTo);
    const month = date.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });

    return (
        <p className="text-sm text-ink-soft">
            {found
                ? `Showing ${month} and earlier.`
                : `Nothing was posted on ${date.toLocaleDateString(undefined, { dateStyle: 'long' })}. Showing ${month} and earlier.`}{' '}
            <Link
                href={home()}
                className="text-ink underline underline-offset-4 hover:no-underline"
            >
                Back to latest
            </Link>
        </p>
    );
}

export default function Timeline({ entries, jumpedTo, firstDate }: Props) {
    const user = usePage().props.auth.user as User | null;
    const [openId, setOpenId] = useState<number | null>(null);
    const [handledJump, setHandledJump] = useState<string | null>(null);
    const jumpedEntry = jumpedTo
        ? (entries.data.find((entry) => entry.date === jumpedTo) ?? null)
        : null;

    if (jumpedTo !== handledJump) {
        setHandledJump(jumpedTo);
        setOpenId(jumpedEntry?.id ?? null);
    }

    if (entries.data.length === 0 && jumpedTo) {
        return (
            <>
                <Head title="Timeline" />
                <div className="py-24">
                    <h1 className="font-display text-5xl tracking-tight text-ink">
                        Before the first post
                    </h1>
                    <p className="mt-3 max-w-sm text-ink-soft">
                        Nothing was posted on or before{' '}
                        {parseEntryDate(jumpedTo).toLocaleDateString(
                            undefined,
                            {
                                dateStyle: 'long',
                            },
                        )}
                        .
                    </p>
                    <Button asChild variant="outline" className="mt-8">
                        <Link href={home()}>Back to latest</Link>
                    </Button>
                </div>
            </>
        );
    }

    if (entries.data.length === 0) {
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

    const openIndex = entries.data.findIndex((entry) => entry.id === openId);
    const openEntry = openIndex === -1 ? null : entries.data[openIndex];

    return (
        <>
            <Head title="Timeline" />
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 sm:mb-10">
                <div>
                    {jumpedTo && (
                        <SearchSummary
                            jumpedTo={jumpedTo}
                            found={jumpedEntry !== null}
                        />
                    )}
                </div>
                <FindDay firstDate={firstDate} selected={jumpedTo} />
            </div>

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
                        onOpen={(entry) => setOpenId(entry.id)}
                    />
                ))}
            </InfiniteScroll>

            <DaySheet
                entry={openEntry}
                canEdit={openEntry !== null && user?.id === openEntry.user_id}
                newer={openIndex > 0 ? entries.data[openIndex - 1] : null}
                older={entries.data[openIndex + 1] ?? null}
                onNavigate={(entry) => setOpenId(entry?.id ?? null)}
            />

            <BackToTop />
        </>
    );
}
