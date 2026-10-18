import {
    Cake,
    Clover,
    Egg,
    Flag,
    Flower2,
    Ghost,
    Glasses,
    HardHat,
    Heart,
    PartyPopper,
    Sparkles,
    Sunrise,
    TreePine,
    Wheat,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import type { Entry, Holiday } from '@/types';

export type Theme = {
    label: string;
    icon: ComponentType<{ className?: string }>;
    accent: string;
};

function BaseballIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={className}
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M6.5 4.4a10 10 0 0 1 0 15.2" />
            <path d="M17.5 4.4a10 10 0 0 0 0 15.2" />
        </svg>
    );
}

const holidayThemes: Record<Holiday, Theme> = {
    new_years_day: {
        label: "New Year's Day",
        icon: Sunrise,
        accent: 'text-amber-500 dark:text-amber-400',
    },
    valentines_day: {
        label: "Valentine's Day",
        icon: Heart,
        accent: 'text-rose-600 dark:text-rose-400',
    },
    st_patricks_day: {
        label: "St. Patrick's Day",
        icon: Clover,
        accent: 'text-emerald-600 dark:text-emerald-400',
    },
    easter: {
        label: 'Easter',
        icon: Egg,
        accent: 'text-violet-500 dark:text-violet-400',
    },
    mothers_day: {
        label: "Mother's Day",
        icon: Flower2,
        accent: 'text-pink-500 dark:text-pink-400',
    },
    memorial_day: {
        label: 'Memorial Day',
        icon: Flag,
        accent: 'text-slate-500 dark:text-slate-400',
    },
    fathers_day: {
        label: "Father's Day",
        icon: Glasses,
        accent: 'text-sky-600 dark:text-sky-400',
    },
    independence_day: {
        label: '4th of July',
        icon: Sparkles,
        accent: 'text-blue-700 dark:text-blue-400',
    },
    labor_day: {
        label: 'Labor Day',
        icon: HardHat,
        accent: 'text-yellow-600 dark:text-yellow-400',
    },
    halloween: {
        label: 'Halloween',
        icon: Ghost,
        accent: 'text-orange-500 dark:text-orange-400',
    },
    thanksgiving: {
        label: 'Thanksgiving',
        icon: Wheat,
        accent: 'text-amber-700 dark:text-amber-500',
    },
    christmas: {
        label: 'Christmas',
        icon: TreePine,
        accent: 'text-red-600 dark:text-red-400',
    },
    new_years_eve: {
        label: "New Year's Eve",
        icon: PartyPopper,
        accent: 'text-indigo-500 dark:text-indigo-400',
    },
};

const birthdayTheme: Theme = {
    label: 'Birthday',
    icon: Cake,
    accent: 'text-fuchsia-600 dark:text-fuchsia-400',
};

const baseballTheme: Theme = {
    label: 'Ball game',
    icon: BaseballIcon,
    accent: 'text-green-600 dark:text-green-400',
};

export function entryTheme(
    entry: Pick<Entry, 'category' | 'details'>,
): Theme | null {
    switch (entry.category) {
        case 'holiday':
            return entry.details?.holiday
                ? holidayThemes[entry.details.holiday]
                : null;
        case 'birthday':
            return birthdayTheme;
        case 'baseball_game':
            return baseballTheme;
        default:
            return null;
    }
}

/**
 * The words that describe what the day was: "Halloween", "Emma turns 7", "Won 8–5 against the Tigers".
 */
function categoryHeadline(
    entry: Pick<Entry, 'category' | 'details'>,
    theme: Theme,
) {
    const details = entry.details ?? {};

    if (entry.category === 'birthday' && details.name) {
        return details.age !== null && details.age !== undefined
            ? `${details.name} turns ${details.age}`
            : `${details.name}'s birthday`;
    }

    if (entry.category === 'baseball_game') {
        const ours = details.our_score ?? 0;
        const theirs = details.their_score ?? 0;
        const result = ours > theirs ? 'Won' : ours < theirs ? 'Lost' : 'Tied';

        return `${result} ${ours}–${theirs} against the ${details.opponent}`;
    }

    return theme.label;
}

export function EntryCategoryLine({
    entry,
    theme,
    className,
}: {
    entry: Pick<Entry, 'category' | 'details'>;
    theme: Theme;
    className?: string;
}) {
    const Icon = theme.icon;

    return (
        <p
            className={cn(
                'flex items-center gap-1.5 text-sm font-medium',
                theme.accent,
                className,
            )}
        >
            <Icon className="size-4 shrink-0" />
            <span className="text-ink">{categoryHeadline(entry, theme)}</span>
        </p>
    );
}
