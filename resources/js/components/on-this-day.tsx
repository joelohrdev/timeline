import { Link } from '@inertiajs/react';
import { timelineUrl } from '@/components/timeline-filters';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
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
            <Carousel
                opts={{ align: 'start', dragFree: true }}
                className="mt-4"
                aria-label="Earlier years on this day"
            >
                <CarouselContent className="-ml-3">
                    {events.map((event) => {
                        const date = parseEntryDate(event.date);

                        return (
                            <CarouselItem
                                key={event.id}
                                className="basis-[42%] pl-3 sm:basis-1/4 lg:basis-1/5"
                            >
                                <Link
                                    href={timelineUrl({
                                        date: event.date,
                                        category: null,
                                        search: null,
                                    })}
                                    aria-label={date.toLocaleDateString(
                                        undefined,
                                        {
                                            dateStyle: 'long',
                                        },
                                    )}
                                    className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-ink">
                                        {event.cover_url ? (
                                            <img
                                                src={event.cover_url}
                                                alt=""
                                                loading="lazy"
                                                className="size-full object-cover transition duration-500 ease-out group-hover:brightness-105 motion-safe:group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="absolute inset-0 grid place-items-center font-display text-3xl text-paper/80">
                                                {date.getFullYear()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-sm text-ink-soft">
                                        {yearsAgo(event.date)}
                                    </p>
                                </Link>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                <CarouselPrevious className="left-2 hidden border-none bg-paper/90 text-ink shadow-md hover:bg-paper disabled:opacity-0 sm:inline-flex" />
                <CarouselNext className="right-2 hidden border-none bg-paper/90 text-ink shadow-md hover:bg-paper disabled:opacity-0 sm:inline-flex" />
            </Carousel>
        </section>
    );
}
