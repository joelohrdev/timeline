<?php

namespace App\Http\Controllers;

use App\Actions\CreateEntry;
use App\Actions\StoreEntryImage;
use App\EntryCategory;
use App\Holiday;
use App\Http\Requests\StoreEntryRequest;
use App\Http\Requests\UpdateEntryRequest;
use App\Models\Entry;
use App\Models\EntryImage;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EntryController extends Controller
{
    /**
     * Show the form for a new day's entry.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('entries/create', [
            'today' => $this->requestedDay($request) ?? now()->toDateString(),
            'postedDays' => $this->postedDaysFor($request->user()),
            ...$this->categoryOptions(),
        ]);
    }

    /**
     * Store a new entry and convert its images to WebP.
     */
    public function store(StoreEntryRequest $request, CreateEntry $createEntry): RedirectResponse
    {
        DB::transaction(function () use ($request, $createEntry): void {
            [$entry, $uploaded] = $createEntry->handle(
                $request->user(),
                [
                    ...$request->safe()->only(['date', 'title', 'location_place', 'location_city', 'location_state', 'body']),
                    ...$request->categoryAttributes(),
                ],
                $request->file('images', []),
                $request->input('fingerprints', []),
                $request->input('taken_keys', []),
                $request->input('taken_times', []),
            );

            $this->applyCover($entry, $request->validated('cover'), $uploaded);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Entry posted.')]);

        return to_route('home');
    }

    /**
     * Show the form for editing an entry.
     */
    public function edit(Entry $entry): Response
    {
        Gate::authorize('update', $entry);

        return Inertia::render('entries/edit', [
            'entry' => $entry->load('images'),
            ...$this->categoryOptions(),
        ]);
    }

    /**
     * Update an entry and append any newly uploaded images.
     */
    public function update(UpdateEntryRequest $request, Entry $entry, StoreEntryImage $storeEntryImage): RedirectResponse
    {
        DB::transaction(function () use ($request, $entry, $storeEntryImage): void {
            $entry->update([
                ...$request->safe()->only(['date', 'title', 'location_place', 'location_city', 'location_state', 'body']),
                ...$request->categoryAttributes(),
            ]);

            $uploaded = $storeEntryImage->handleMany(
                $entry,
                $request->file('images', []),
                $request->input('fingerprints', []),
                $request->input('taken_keys', []),
                $request->input('taken_times', []),
            );

            $this->applyCover($entry, $request->validated('cover'), $uploaded);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Entry updated.')]);

        return to_route('home');
    }

    /**
     * Delete an entry along with its image files.
     */
    public function destroy(Entry $entry): RedirectResponse
    {
        Gate::authorize('delete', $entry);

        $entry->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Entry deleted.')]);

        return to_route('home');
    }

    /**
     * The user's events grouped by day, for the "you already have an event" prompts.
     *
     * @return Collection<string, list<array{id: int, label: string}>>
     */
    public function postedDaysFor(User $user): Collection
    {
        return $user->entries()
            ->inDayOrder()
            ->get()
            ->groupBy(fn (Entry $entry): string => $entry->date->toDateString())
            ->map(fn ($entries) => $this->distinctLabels($entries));
    }

    /**
     * Each event's label, numbering repeats ("Untitled event (2)") so events on one day can be told apart.
     *
     * @param  Collection<int, Entry>  $entries
     * @return list<array{id: int, label: string}>
     */
    private function distinctLabels(Collection $entries): array
    {
        $seen = [];

        return array_values($entries->map(function (Entry $entry) use (&$seen): array {
            $label = $entry->label();
            $seen[$label] = ($seen[$label] ?? 0) + 1;

            return [
                'id' => $entry->id,
                'label' => $seen[$label] > 1 ? "{$label} ({$seen[$label]})" : $label,
            ];
        })->all());
    }

    /**
     * A valid ?date=YYYY-MM-DD to start a new event on, e.g. from "Add another event" on a day.
     */
    private function requestedDay(Request $request): ?string
    {
        $date = $request->query('date');

        return is_string($date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) && strtotime($date) !== false
            ? $date
            : null;
    }

    /**
     * Choices for the category and holiday pickers.
     *
     * @return array{categories: list<array{value: string, label: string}>, holidays: list<array{value: string, label: string}>}
     */
    private function categoryOptions(): array
    {
        return [
            'categories' => EntryCategory::options(),
            'holidays' => Holiday::options(),
        ];
    }

    /**
     * Move the chosen cover photo to the front, keeping the others in order.
     *
     * The choice is "image:{id}" for a photo already on the entry or "upload:{index}" for one uploaded in this request.
     *
     * @param  list<EntryImage>  $uploaded
     */
    private function applyCover(Entry $entry, ?string $cover, array $uploaded): void
    {
        [$source, $key] = explode(':', $cover ?? ':') + [null, null];

        $coverImage = match ($source) {
            'upload' => $uploaded[(int) $key] ?? null,
            'image' => $entry->images()->find((int) $key),
            default => null,
        };

        if ($coverImage === null) {
            return;
        }

        $entry->images()->get()
            ->sortBy(fn (EntryImage $image): int => $image->is($coverImage) ? -1 : $image->position)
            ->values()
            ->each(fn (EntryImage $image, int $position) => $image->update(['position' => $position]));
    }
}
