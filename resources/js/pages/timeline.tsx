import { Head, InfiniteScroll, Link, usePage } from '@inertiajs/react';
import { BackToTop } from '@/components/back-to-top';
import { TimelineEntry, TimelineRow } from '@/components/timeline-entry';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { create } from '@/routes/entries';
import type { Entry, Paginated, User } from '@/types';

function EntrySkeleton() {
    return (
        <TimelineRow
            marker={
                <div className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-6 w-7" />
                    <Skeleton className="h-3 w-11" />
                </div>
            }
        >
            <Skeleton className="aspect-[3/2] w-full rounded-xl" />
            <Skeleton className="mt-4 h-3 w-4/5" />
        </TimelineRow>
    );
}

export default function Timeline({ entries }: { entries: Paginated<Entry> }) {
    const user = usePage().props.auth.user as User | null;

    if (entries.data.length === 0) {
        return (
            <>
                <Head title="Timeline" />
                <div className="py-24 text-center">
                    <h1 className="text-lg font-medium">Start the timeline</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Each day gets one entry: a few photos and a few words.
                    </p>
                    {user && (
                        <Button asChild className="mt-6">
                            <Link href={create()}>Post today</Link>
                        </Button>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Timeline" />
            <div className="relative">
                <span
                    aria-hidden="true"
                    className="absolute top-2 bottom-0 left-[4.125rem] w-px bg-border sm:left-[5.375rem]"
                />
                <InfiniteScroll
                    data="entries"
                    buffer={600}
                    loading={<EntrySkeleton />}
                >
                    {entries.data.map((entry) => (
                        <TimelineEntry
                            key={entry.id}
                            entry={entry}
                            canEdit={user?.id === entry.user_id}
                        />
                    ))}
                </InfiniteScroll>
            </div>
            <BackToTop />
        </>
    );
}
