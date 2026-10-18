<?php

namespace App\Http\Controllers;

use App\Actions\StoreEntryImage;
use App\EntryCategory;
use App\Holiday;
use App\Http\Requests\StoreEntryRequest;
use App\Http\Requests\UpdateEntryRequest;
use App\Models\Entry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EntryController extends Controller
{
    /**
     * Show the form for a new day's entry.
     */
    public function create(): Response
    {
        return Inertia::render('entries/create', [
            'today' => now()->toDateString(),
            ...$this->categoryOptions(),
        ]);
    }

    /**
     * Store a new entry and convert its images to WebP.
     */
    public function store(StoreEntryRequest $request, StoreEntryImage $storeEntryImage): RedirectResponse
    {
        DB::transaction(function () use ($request, $storeEntryImage): void {
            $entry = $request->user()->entries()->create([
                ...$request->safe()->only(['date', 'body']),
                ...$request->categoryAttributes(),
            ]);

            $this->storeImages($entry, $request->file('images', []), $storeEntryImage);
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
                ...$request->safe()->only(['date', 'body']),
                ...$request->categoryAttributes(),
            ]);

            $this->storeImages($entry, $request->file('images', []), $storeEntryImage);
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
     * @param  array<int, UploadedFile>  $files
     */
    private function storeImages(Entry $entry, array $files, StoreEntryImage $storeEntryImage): void
    {
        $nextPosition = (int) $entry->images()->max('position') + ($entry->images()->exists() ? 1 : 0);

        foreach (array_values($files) as $offset => $file) {
            $storeEntryImage->handle($entry, $file, $nextPosition + $offset);
        }
    }
}
