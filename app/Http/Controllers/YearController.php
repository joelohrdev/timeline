<?php

namespace App\Http\Controllers;

use App\EntryCategory;
use App\Models\Entry;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class YearController extends Controller
{
    /**
     * A year at a glance: a cover for each month, plus that year's ball games, birthdays and holidays.
     */
    public function __invoke(int $year): Response
    {
        /** @var Collection<int, Entry> $entries */
        $entries = Entry::query()
            ->with('images')
            ->whereYear('date', $year)
            ->oldest('date')
            ->oldest('id')
            ->get();

        $games = $entries->where('category', EntryCategory::BaseballGame)->values();

        return Inertia::render('year', [
            'year' => $year,
            'years' => Entry::query()
                ->pluck('date')
                ->map(fn ($date): int => $date->year)
                ->unique()
                ->sortDesc()
                ->values(),
            'stats' => [
                'days' => $entries->unique(fn (Entry $entry): string => $entry->date->toDateString())->count(),
                'events' => $entries->count(),
                'photos' => $entries->sum(fn (Entry $entry): int => $entry->images->count()),
            ],
            'months' => collect(range(1, 12))->map(function (int $month) use ($entries, $year): array {
                $inMonth = $entries->filter(fn (Entry $entry): bool => $entry->date->month === $month);

                return [
                    'month' => sprintf('%04d-%02d', $year, $month),
                    'days' => $inMonth->unique(fn (Entry $entry): string => $entry->date->toDateString())->count(),
                    'cover_url' => $inMonth->first(fn (Entry $entry): bool => $entry->images->isNotEmpty())?->images->first()?->thumb_url,
                ];
            }),
            'games' => [
                'wins' => $games->filter(fn (Entry $game): bool => $this->score($game, 'our_score') > $this->score($game, 'their_score'))->count(),
                'losses' => $games->filter(fn (Entry $game): bool => $this->score($game, 'our_score') < $this->score($game, 'their_score'))->count(),
                'ties' => $games->filter(fn (Entry $game): bool => $this->score($game, 'our_score') === $this->score($game, 'their_score'))->count(),
                'list' => $games->map(fn (Entry $game): array => [
                    'date' => $game->date->toDateString(),
                    'opponent' => $game->details['opponent'] ?? null,
                    'our_score' => $this->score($game, 'our_score'),
                    'their_score' => $this->score($game, 'their_score'),
                ])->values(),
            ],
            'birthdays' => $this->listed($entries, EntryCategory::Birthday),
            'holidays' => $this->listed($entries, EntryCategory::Holiday),
        ]);
    }

    private function score(Entry $game, string $key): int
    {
        return (int) ($game->details[$key] ?? 0);
    }

    /**
     * @param  Collection<int, Entry>  $entries
     * @return Collection<int, array{date: string, label: string}>
     */
    private function listed(Collection $entries, EntryCategory $category): Collection
    {
        return $entries
            ->where('category', $category)
            ->map(fn (Entry $entry): array => [
                'date' => $entry->date->toDateString(),
                'label' => $entry->label(),
            ])
            ->values();
    }
}
