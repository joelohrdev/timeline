<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckPhotosRequest;
use App\Models\EntryImage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class PhotoCheckController extends Controller
{
    /**
     * Which of the chosen photos are already on the user's timeline.
     *
     * A photo matches an earlier upload by the fingerprint of its original file, or by the exact moment it was
     * taken (to the fraction of a second), which survives the phone re-exporting the same photo.
     */
    public function __invoke(CheckPhotosRequest $request): JsonResponse
    {
        /** @var list<array{fingerprint?: string|null, taken_key?: string|null}> $photos */
        $photos = array_values($request->validated('photos'));
        $fingerprints = array_values(array_filter(array_column($photos, 'fingerprint')));
        $takenKeys = array_values(array_filter(array_column($photos, 'taken_key')));

        if ($fingerprints === [] && $takenKeys === []) {
            return response()->json(['matches' => []]);
        }

        $uploaded = EntryImage::query()
            ->with('entry')
            ->whereHas('entry', fn (Builder $query) => $query->whereBelongsTo($request->user()))
            ->where(fn (Builder $query) => $query
                ->whereIn('original_fingerprint', $fingerprints)
                ->orWhereIn('taken_key', $takenKeys))
            ->get();

        $matches = [];

        foreach ($photos as $index => $photo) {
            $match = $uploaded->first(fn (EntryImage $image): bool => ($photo['fingerprint'] ?? null) !== null && $image->original_fingerprint === $photo['fingerprint'])
                ?? $uploaded->first(fn (EntryImage $image): bool => ($photo['taken_key'] ?? null) !== null && $image->taken_key === $photo['taken_key']);

            if ($match !== null) {
                $matches[] = [
                    'index' => $index,
                    'entry_id' => $match->entry->id,
                    'date' => $match->entry->date->toDateString(),
                    'label' => $match->entry->label(),
                ];
            }
        }

        return response()->json(['matches' => $matches]);
    }
}
