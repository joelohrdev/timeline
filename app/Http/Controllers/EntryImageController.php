<?php

namespace App\Http\Controllers;

use App\Actions\StoreEntryImage;
use App\Http\Requests\StoreEntryImagesRequest;
use App\Models\Entry;
use App\Models\EntryImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class EntryImageController extends Controller
{
    /**
     * Add photos to an existing entry, after the ones it already has. Its text, category and cover are left as they are.
     */
    public function store(StoreEntryImagesRequest $request, Entry $entry, StoreEntryImage $storeEntryImage): RedirectResponse
    {
        DB::transaction(fn () => $storeEntryImage->handleMany($entry, $request->file('images', [])));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Photos added to :day.', [
            'day' => $entry->date->format('F j'),
        ])]);

        return to_route('home', ['date' => $entry->date->toDateString()]);
    }

    /**
     * Remove a single image from an entry.
     */
    public function destroy(Entry $entry, EntryImage $image): RedirectResponse
    {
        Gate::authorize('update', $entry);

        $image->delete();

        return back();
    }
}
