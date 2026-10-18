import { Link, router } from '@inertiajs/react';
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
    date: string | null;
    category: EntryCategory | null;
};

const categoryNouns: Record<EntryCategory, { one: string; many: string }> = {
    holiday: { one: 'holiday', many: 'holidays' },
    birthday: { one: 'birthday', many: 'birthdays' },
    baseball_game: { one: 'ball game', many: 'ball games' },
};

const allCategories = 'all';

/**
 * The timeline URL for a set of filters, leaving out any that are empty.
 */
export function timelineUrl(filters: TimelineFilters) {
    return home({
        query: {
            ...(filters.date ? { date: filters.date } : {}),
            ...(filters.category ? { category: filters.category } : {}),
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

/**
 * One sentence describing what the filtered timeline is showing.
 */
function describe(filters: TimelineFilters, foundDay: boolean): string {
    const nouns = filters.category ? categoryNouns[filters.category] : null;

    if (!filters.date) {
        return `Showing ${nouns?.many ?? 'every day'}.`;
    }

    const date = parseEntryDate(filters.date);
    const day = date.toLocaleDateString(undefined, { dateStyle: 'long' });
    const month = date.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });
    const showing = nouns
        ? `Showing ${nouns.many} from ${month} and earlier.`
        : `Showing ${month} and earlier.`;

    if (foundDay) {
        return showing;
    }

    return nouns
        ? `No ${nouns.one} on ${day}. ${showing}`
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
    const before = filters.date
        ? ` on or before ${parseEntryDate(filters.date).toLocaleDateString(undefined, { dateStyle: 'long' })}`
        : '';

    return nouns
        ? `No ${nouns.many} posted${before}.`
        : `Nothing was posted${before}.`;
}
