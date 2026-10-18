import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Share } from 'lucide-react';
import { EventBlock } from '@/components/event-block';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { parseEntryDate } from '@/lib/dates';
import { shareDay } from '@/lib/share-day';
import { create } from '@/routes/entries';
import type { Entry } from '@/types';

type Props = {
    date: string | null;
    events: Entry[];
    userId: number | null;
    newer: string | null;
    older: string | null;
    onNavigate: (date: string | null) => void;
};

function DayContent({
    date,
    events,
    userId,
    newer,
    older,
    onNavigate,
}: Props & { date: string }) {
    const day = parseEntryDate(date);

    return (
        <>
            <div className="px-5 pt-6 pb-5 sm:px-8 sm:pt-8">
                <SheetTitle className="font-display text-3xl leading-tight font-normal tracking-tight text-ink sm:text-4xl">
                    {day.toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                    })}
                </SheetTitle>
                <SheetDescription className="mt-1 text-ink-soft">
                    {day.toLocaleDateString(undefined, { weekday: 'long' })},{' '}
                    {day.getFullYear()}
                    {events.length > 1 && `, ${events.length} events`}
                </SheetDescription>
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
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                >
                    <Share className="size-3.5" />
                    Share this day
                </button>
            </div>

            {events.map((event, index) => (
                <EventBlock
                    key={event.id}
                    event={event}
                    canEdit={userId === event.user_id}
                    isFirst={index === 0}
                />
            ))}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 px-5 pt-10 pb-6 sm:px-8">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!newer}
                        onClick={() => onNavigate(newer)}
                    >
                        <ChevronLeft />
                        Newer
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!older}
                        onClick={() => onNavigate(older)}
                    >
                        Older
                        <ChevronRight />
                    </Button>
                </div>

                {userId !== null && (
                    <Link
                        href={create({ query: { date } })}
                        className="inline-flex items-center gap-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                    >
                        <Plus className="size-3.5" />
                        Add another event
                    </Link>
                )}
            </div>
        </>
    );
}

export function DaySheet(props: Props) {
    const { date, onNavigate } = props;

    return (
        <Sheet
            open={date !== null}
            onOpenChange={(open) => !open && onNavigate(null)}
        >
            <SheetContent
                side="right"
                className="w-full gap-0 overflow-y-auto border-none bg-paper p-0 sm:max-w-xl"
            >
                {date && <DayContent key={date} {...props} date={date} />}
            </SheetContent>
        </Sheet>
    );
}
