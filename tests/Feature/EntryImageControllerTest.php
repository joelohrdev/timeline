<?php

use App\Models\Entry;
use App\Models\EntryImage;
use Illuminate\Support\Facades\Storage;

test('removing an image deletes its row and files', function () {
    $disk = Storage::fake(config('filesystems.media_disk'));
    $image = EntryImage::factory()->create();
    $disk->put($image->path, 'display');
    $disk->put($image->thumb_path, 'thumb');

    $this->actingAs($image->entry->user)
        ->delete(route('entries.images.destroy', [$image->entry, $image]))
        ->assertRedirect();

    expect($image->fresh())->toBeNull();
    $disk->assertMissing([$image->path, $image->thumb_path]);
});

test('an image cannot be removed through another entry', function () {
    $image = EntryImage::factory()->create();
    $otherEntry = Entry::factory()->for($image->entry->user)->create();

    $this->actingAs($image->entry->user)
        ->delete(route('entries.images.destroy', [$otherEntry, $image]))
        ->assertNotFound();

    expect($image->fresh())->not->toBeNull();
});
