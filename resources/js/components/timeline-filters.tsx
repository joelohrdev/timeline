import { Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { parseEntryDate } from '@/lib/dates';
import { home } from '@/routes';
import type { EntryCategory, SelectOption } from '@/types';

export type TimelineFilters = {
    /** A day ("YYYY-MM-DD") or a whole month ("YYYY-MM"). */
    date: string | null;
    category: EntryCategory | null;
    search: string | null;
};

const categoryNouns: Record<EntryCategory, { one: string; many: string }> = {
    holiday: { one: 'holiday', many: 'holidays' },
    birthday: { one: 'birthday', many: 'birthdays' },
    baseball_game: { one: 'ball game', many: 'ball games' },
};

const allCategories = 'all';

/**
 * Whether the date filter points at one day rather than a whole month.
 */
export function isDayFilter(date: string | null): date is string {
    return date !== null && date.length === 10;
}

function filterMonth(date: string): Date {
    return parseEntryDate(date.length === 10 ? date : `${date}-01`);
}

/**
 * The timeline URL for a set of filters, leaving out any that are empty.
 */
export function timelineUrl(filters: TimelineFilters) {
    return home({
        query: {
            ...(filters.date ? { date: filters.date } : {}),
            ...(filters.category ? { category: filters.category } : {}),
            ...(filters.search ? { q: filters.search } : {}),
        },
    });
}

export function CategoryFilter({
    filters,
    categories,
}: {
    filters: TimelineFilters;
    categories: SelectOption<EntryCategory>[];
}) {
    return (
        <Select
            value={filters.category ?? allCategories}
            onValueChange={(value) =>
                router.get(
                    timelineUrl({
                        ...filters,
                        category:
                            value === allCategories
                                ? null
                                : (value as EntryCategory),
                    }),
                )
            }
        >
            <SelectTrigger
                size="sm"
                className="w-40"
                aria-label="Filter by category"
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
                <SelectItem value={allCategories}>All days</SelectItem>
                {categories.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function SearchBox({ filters }: { filters: TimelineFilters }) {
    return (
        <form
            role="search"
            onSubmit={(event) => {
                event.preventDefault();
                const entered = new FormData(event.currentTarget).get('q');
                const value = typeof entered === 'string' ? entered.trim() : '';
                router.get(timelineUrl({ ...filters, search: value || null }));
            }}
            className="relative"
        >
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-soft"
            />
            <Input
                key={filters.search ?? ''}
                type="search"
                name="q"
                defaultValue={filters.search ?? ''}
                placeholder="Search"
                aria-label="Search posts"
                enterKeyHint="search"
                className="h-8 w-44 bg-paper pl-8"
            />
        </form>
    );
}

/**
 * One sentence describing what the filtered timeline is showing.
 */
function describe(filters: TimelineFilters, foundDay: boolean): string {
    const nouns = filters.category ? categoryNouns[filters.category] : null;
    const matching = filters.search ? ` matching “${filters.search}”` : '';

    if (!filters.date) {
        return `Showing ${nouns?.many ?? 'posts'}${matching}.`;
    }

    const month = filterMonth(filters.date).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });
    const showing =
        nouns || matching
            ? `Showing ${nouns?.many ?? 'posts'}${matching} from ${month} and earlier.`
            : `Showing ${month} and earlier.`;

    if (!isDayFilter(filters.date) || foundDay) {
        return showing;
    }

    const day = parseEntryDate(filters.date).toLocaleDateString(undefined, {
        dateStyle: 'long',
    });

    return nouns || matching
        ? `No ${nouns?.one ?? 'post'}${matching} on ${day}. ${showing}`
        : `Nothing was posted on ${day}. ${showing}`;
}

export function FilterSummary({
    filters,
    foundDay,
}: {
    filters: TimelineFilters;
    foundDay: boolean;
}) {
    return (
        <p className="text-sm text-ink-soft">
            {describe(filters, foundDay)}{' '}
            <Link
                href={home()}
                className="text-ink underline underline-offset-4 hover:no-underline"
            >
                Clear
            </Link>
        </p>
    );
}

/**
 * What to say when the filters match nothing at all.
 */
export function noMatchesMessage(filters: TimelineFilters): string {
    const nouns = filters.category ? categoryNouns[filters.category] : null;
    const matching = filters.search ? ` matching “${filters.search}”` : '';
    const before = filters.date
        ? isDayFilter(filters.date)
            ? ` on or before ${parseEntryDate(filters.date).toLocaleDateString(undefined, { dateStyle: 'long' })}`
            : ` in or before ${filterMonth(filters.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
        : '';

    return nouns || matching
        ? `No ${nouns?.many ?? 'posts'}${matching}${before}.`
        : `Nothing was posted${before}.`;
}
