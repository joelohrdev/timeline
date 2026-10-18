<?php

namespace App\Http\Controllers;

use App\Actions\CreateEntry;
use App\Actions\StoreEntryImage;
use App\Http\Requests\ImportDraftRequest;
use App\Models\Entry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ImportController extends Controller
{
    /**
     * The bulk import page: choose many photos, review one draft per day, post them all.
     */
    public function create(Request $request, EntryController $entries): Response
    {
        return Inertia::render('entries/import', [
            'postedDays' => $entries->postedDaysFor($request->user()),
        ]);
    }

    /**
     * Post one draft: a new event, or photos added to an existing event (entry_id).
     */
    public function store(ImportDraftRequest $request, CreateEntry $createEntry, StoreEntryImage $storeEntryImage): JsonResponse
    {
        $photos = [
            $request->file('images', []),
            $request->input('fingerprints', []),
            $request->input('taken_keys', []),
            $request->input('taken_times', []),
        ];

        $entry = DB::transaction(function () use ($request, $createEntry, $storeEntryImage, $photos): Entry {
            if ($request->filled('entry_id')) {
                $entry = Entry::query()->findOrFail($request->integer('entry_id'));

                if ($entry->images()->count() + count($photos[0]) > 10) {
                    throw ValidationException::withMessages(['images' => 'That event would have more than 10 photos.']);
                }

                $storeEntryImage->handleMany($entry, ...$photos);

                return $entry;
            }

            [$entry] = $createEntry->handle(
                $request->user(),
                $request->safe()->only(['date', 'title', 'location_place', 'location_city', 'location_state', 'body']),
                ...$photos,
            );

            return $entry;
        });

        return response()->json([
            'entry_id' => $entry->id,
            'date' => $entry->date->toDateString(),
        ], $request->filled('entry_id') ? 200 : 201);
    }
}
