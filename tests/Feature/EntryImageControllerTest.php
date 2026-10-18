<?php

use App\EntryCategory;
use App\Models\Entry;
use App\Models\EntryImage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
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

test('photos can be added to an existing entry without changing it otherwise', function () {
    $disk = Storage::fake(config('filesystems.media_disk'));
    $entry = Entry::factory()->baseballGame()->create(['date' => '2026-07-04', 'body' => '<p>Fireworks.</p>']);
    $existing = EntryImage::factory()->for($entry)->create(['position' => 0]);

    $this->actingAs($entry->user)
        ->post(route('entries.images.store', $entry), [
            'images' => [UploadedFile::fake()->image('late.jpg', 300, 200), UploadedFile::fake()->image('later.jpg', 200, 300)],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home', ['date' => '2026-07-04']));

    $entry->refresh();

    expect($entry->images->pluck('id')->first())->toBe($existing->id)
        ->and($entry->images->pluck('width')->slice(1)->values()->all())->toBe([300, 200])
        ->and($entry->images->pluck('position')->all())->toBe([0, 1, 2])
        ->and($entry->body)->toBe('<p>Fireworks.</p>')
        ->and($entry->category)->toBe(EntryCategory::BaseballGame);

    $disk->assertExists($entry->images->last()->path);
});

test('adding photos requires at least one photo', function () {
    $entry = Entry::factory()->create();

    $this->actingAs($entry->user)
        ->post(route('entries.images.store', $entry), [])
        ->assertSessionHasErrors(['images' => 'Choose at least one photo to add.']);
});

test('only the poster can add photos to an entry', function () {
    $entry = Entry::factory()->create();

    $this->post(route('entries.images.store', $entry), ['images' => [UploadedFile::fake()->image('a.jpg')]])
        ->assertRedirect(route('login'));

    $this->actingAs(User::factory()->create())
        ->post(route('entries.images.store', $entry), ['images' => [UploadedFile::fake()->image('a.jpg')]])
        ->assertForbidden();

    expect($entry->images()->count())->toBe(0);
});
