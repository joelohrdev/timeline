<?php

namespace App\Http\Controllers;

use App\EntryCategory;
use App\Models\Entry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TimelineController extends Controller
{
    /**
     * Show the public timeline, newest day first (events within a day in the order they were posted), loaded page by page as the visitor scrolls.
     *
     * Optional filters, all combinable; unknown or invalid values are ignored:
     * - ?date=YYYY-MM-DD starts at that day's month (and points at the day); ?date=YYYY-MM starts at that month.
     * - ?category=… shows only entries in that category.
     * - ?q=… shows entries whose title, location, text, opponent or birthday name contains the words.
     */
    public function __invoke(Request $request): Response
    {
        [$jumpedTo, $jumpedMonthEnd] = $this->requestedDate($request);
        $category = $request->enum('category', EntryCategory::class);
        $search = $this->searchTerm($request);

        return Inertia::render('timeline', [
            'entries' => Inertia::scroll(fn () => Entry::query()
                ->with('images')
                ->when($jumpedMonthEnd, fn (Builder $query) => $query->whereDate('date', '<=', $jumpedMonthEnd))
                ->when($category, fn (Builder $query) => $query->where('category', $category))
                ->when($search, fn (Builder $query) => $this->matching($query, (string) $search))
                ->latest('date')
                ->inDayOrder()
                ->paginate(40)),
            'jumpedTo' => $jumpedTo,
            'category' => $category?->value,
            'search' => $search,
            'categories' => EntryCategory::options(),
            'firstDate' => fn (): ?string => Entry::query()->min('date'),
            'onThisDay' => fn (): array => $this->onThisDay(),
        ]);
    }

    /**
     * The requested day ("YYYY-MM-DD") or month ("YYYY-MM"), and the last day of its month.
     *
     * @return array{0: string|null, 1: Carbon|null}
     */
    private function requestedDate(Request $request): array
    {
        $value = $request->string('date')->trim()->value();

        foreach (['!Y-m-d' => 'Y-m-d', '!Y-m' => 'Y-m'] as $format => $output) {
            $date = rescue(fn () => Carbon::createFromFormat($format, $value), null, report: false);

            if ($date instanceof Carbon && $date->format($output) === $value) {
                return [$value, $date->copy()->endOfMonth()];
            }
        }

        return [null, null];
    }

    /**
     * The words to search for, or null when the search is missing, too short or too long.
     */
    private function searchTerm(Request $request): ?string
    {
        $term = Str::squish($request->string('q')->value());

        return mb_strlen($term) >= 2 && mb_strlen($term) <= 100 ? $term : null;
    }

    /**
     * Entries whose title, location, text or category details (opponent, birthday name) contain the term, ignoring case.
     *
     * @param  Builder<Entry>  $query
     * @return Builder<Entry>
     */
    private function matching(Builder $query, string $term): Builder
    {
        $like = fn (string $value): string => '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($value)).'%';

        return $query->where(fn (Builder $query) => $query
            ->whereRaw("LOWER(title) LIKE ? ESCAPE '!'", [$like($term)])
            ->orWhereRaw("LOWER(location_place) LIKE ? ESCAPE '!'", [$like($term)])
            ->orWhereRaw("LOWER(location_city) LIKE ? ESCAPE '!'", [$like($term)])
            ->orWhereRaw("LOWER(location_state) LIKE ? ESCAPE '!'", [$like($term)])
            ->orWhereRaw("LOWER(body) LIKE ? ESCAPE '!'", [$like($term)])
            ->orWhereRaw("LOWER(body) LIKE ? ESCAPE '!'", [$like(e($term))])
            ->orWhereRaw("LOWER(CAST(details AS CHAR)) LIKE ? ESCAPE '!'", [$like($term)]));
    }

    /**
     * Events from today's date in earlier years, newest year first.
     *
     * @return list<array{id: int, date: string, label: string, cover_url: string|null}>
     */
    private function onThisDay(): array
    {
        $today = now();

        return array_values(Entry::query()
            ->with('images')
            ->whereMonth('date', $today->month)
            ->whereDay('date', $today->day)
            ->whereYear('date', '<', $today->year)
            ->latest('date')
            ->inDayOrder()
            ->limit(12)
            ->get()
            ->map(fn (Entry $entry): array => [
                'id' => $entry->id,
                'date' => $entry->date->toDateString(),
                'label' => $entry->label(),
                'cover_url' => $entry->images->first()?->thumb_url,
            ])
            ->all());
    }
}
