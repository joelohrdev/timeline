<?php

namespace App\Actions;

use App\Models\Entry;
use App\Models\EntryImage;
use App\Models\User;
use Illuminate\Http\UploadedFile;

class CreateEntry
{
    public function __construct(private StoreEntryImage $storeEntryImage) {}

    /**
     * Create an event and convert its photos, recording each photo's fingerprint and taken time.
     *
     * @param  array<string, mixed>  $attributes
     * @param  array<int, UploadedFile>  $files
     * @param  array<int, string|null>  $fingerprints
     * @param  array<int, string|null>  $takenKeys
     * @param  array<int, string|null>  $takenTimes
     * @return array{0: Entry, 1: list<EntryImage>}
     */
    public function handle(User $user, array $attributes, array $files, array $fingerprints = [], array $takenKeys = [], array $takenTimes = []): array
    {
        $entry = $user->entries()->create($attributes);

        $uploaded = $this->storeEntryImage->handleMany($entry, $files, $fingerprints, $takenKeys, $takenTimes);

        return [$entry, $uploaded];
    }
}
