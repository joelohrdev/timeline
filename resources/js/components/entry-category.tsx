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
import type { Entry, EntryDetails, Holiday } from '@/types';

type Theme = {
    label: string;
    icon: ComponentType<{ className?: string }>;
    dot: string;
    card: string;
    badge: string;
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
        dot: 'bg-amber-400',
        card: 'bg-amber-50 ring-amber-200/70 dark:bg-amber-950/30 dark:ring-amber-900/50',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    },
    valentines_day: {
        label: "Valentine's Day",
        icon: Heart,
        dot: 'bg-rose-500',
        card: 'bg-rose-50 ring-rose-200/70 dark:bg-rose-950/30 dark:ring-rose-900/50',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
    },
    st_patricks_day: {
        label: "St. Patrick's Day",
        icon: Clover,
        dot: 'bg-emerald-500',
        card: 'bg-emerald-50 ring-emerald-200/70 dark:bg-emerald-950/30 dark:ring-emerald-900/50',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
    },
    easter: {
        label: 'Easter',
        icon: Egg,
        dot: 'bg-violet-400',
        card: 'bg-violet-50 ring-violet-200/70 dark:bg-violet-950/30 dark:ring-violet-900/50',
        badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
    },
    mothers_day: {
        label: "Mother's Day",
        icon: Flower2,
        dot: 'bg-pink-400',
        card: 'bg-pink-50 ring-pink-200/70 dark:bg-pink-950/30 dark:ring-pink-900/50',
        badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
    },
    memorial_day: {
        label: 'Memorial Day',
        icon: Flag,
        dot: 'bg-slate-500',
        card: 'bg-slate-50 ring-slate-200/70 dark:bg-slate-900/40 dark:ring-slate-800/60',
        badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200',
    },
    fathers_day: {
        label: "Father's Day",
        icon: Glasses,
        dot: 'bg-sky-500',
        card: 'bg-sky-50 ring-sky-200/70 dark:bg-sky-950/30 dark:ring-sky-900/50',
        badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
    },
    independence_day: {
        label: '4th of July',
        icon: Sparkles,
        dot: 'bg-blue-600',
        card: 'bg-blue-50 ring-red-200/80 dark:bg-blue-950/30 dark:ring-red-900/50',
        badge: 'bg-red-100 text-blue-900 dark:bg-blue-900/50 dark:text-red-200',
    },
    labor_day: {
        label: 'Labor Day',
        icon: HardHat,
        dot: 'bg-yellow-500',
        card: 'bg-yellow-50 ring-yellow-200/70 dark:bg-yellow-950/30 dark:ring-yellow-900/50',
        badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
    },
    halloween: {
        label: 'Halloween',
        icon: Ghost,
        dot: 'bg-orange-500',
        card: 'bg-orange-50 ring-orange-300/70 dark:bg-orange-950/40 dark:ring-orange-800/60',
        badge: 'bg-neutral-900 text-orange-400 dark:bg-orange-500 dark:text-neutral-950',
    },
    thanksgiving: {
        label: 'Thanksgiving',
        icon: Wheat,
        dot: 'bg-amber-700',
        card: 'bg-amber-50 ring-amber-300/60 dark:bg-amber-950/40 dark:ring-amber-800/50',
        badge: 'bg-amber-200/70 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200',
    },
    christmas: {
        label: 'Christmas',
        icon: TreePine,
        dot: 'bg-red-600',
        card: 'bg-red-50 ring-green-300/70 dark:bg-red-950/30 dark:ring-green-900/60',
        badge: 'bg-green-700 text-white dark:bg-green-800 dark:text-green-50',
    },
    new_years_eve: {
        label: "New Year's Eve",
        icon: PartyPopper,
        dot: 'bg-indigo-500',
        card: 'bg-indigo-50 ring-indigo-200/70 dark:bg-indigo-950/30 dark:ring-indigo-900/50',
        badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
    },
};

const birthdayTheme: Theme = {
    label: 'Birthday',
    icon: Cake,
    dot: 'bg-fuchsia-500',
    card: 'bg-fuchsia-50 ring-fuchsia-200/70 dark:bg-fuchsia-950/30 dark:ring-fuchsia-900/50',
    badge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-200',
};

const baseballTheme: Theme = {
    label: 'Baseball',
    icon: BaseballIcon,
    dot: 'bg-green-600',
    card: 'bg-green-50 ring-green-200/70 dark:bg-green-950/30 dark:ring-green-900/50',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
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

function GameResult({ details }: { details: EntryDetails }) {
    const ours = details.our_score ?? 0;
    const theirs = details.their_score ?? 0;
    const result = ours > theirs ? 'W' : ours < theirs ? 'L' : 'T';

    return (
        <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-background/70 px-4 py-3 dark:bg-background/40">
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">vs</p>
                <p className="truncate font-medium">{details.opponent}</p>
            </div>
            <div className="flex items-center gap-3">
                <p className="text-2xl font-medium tabular-nums">
                    {ours}
                    <span className="mx-1.5 text-muted-foreground">–</span>
                    {theirs}
                </p>
                <span
                    className={cn(
                        'grid size-7 place-items-center rounded-full text-xs font-semibold',
                        result === 'W' &&
                            'bg-green-600 text-white dark:bg-green-500 dark:text-green-950',
                        result === 'L' &&
                            'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
                        result === 'T' &&
                            'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100',
                    )}
                    aria-label={
                        result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Tie'
                    }
                >
                    {result}
                </span>
            </div>
        </div>
    );
}

export function EntryCategoryHeader({
    entry,
    theme,
}: {
    entry: Pick<Entry, 'category' | 'details'>;
    theme: Theme;
}) {
    const Icon = theme.icon;
    const details = entry.details ?? {};

    return (
        <div className="mb-3">
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    theme.badge,
                )}
            >
                <Icon className="size-3.5" />
                {theme.label}
            </span>

            {entry.category === 'birthday' && details.name && (
                <p className="mt-2 text-lg font-medium">
                    {details.age !== null && details.age !== undefined
                        ? `${details.name} turns ${details.age}`
                        : `${details.name}'s birthday`}
                </p>
            )}

            {entry.category === 'baseball_game' && (
                <GameResult details={details} />
            )}
        </div>
    );
}
