<?php

use App\Models\Entry;
use App\Models\EntryImage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->disk = Storage::fake(config('filesystems.media_disk'));
});

test('guests are redirected to login instead of posting', function () {
    $this->post(route('entries.store'), ['date' => '2026-10-17'])
        ->assertRedirect(route('login'));

    expect(Entry::count())->toBe(0);
});

test('posting an entry converts each upload to a display and thumbnail webp', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('entries.store'), [
            'date' => '2026-10-17',
            'body' => 'First frost.',
            'images' => [
                UploadedFile::fake()->image('river.jpg', 3000, 2000),
                UploadedFile::fake()->image('bridge.png', 800, 1200),
            ],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $entry = $user->entries()->sole();
    [$river, $bridge] = $entry->images->all();

    expect($entry->date->toDateString())->toBe('2026-10-17')
        ->and($entry->body)->toBe('First frost.')
        ->and([$river->width, $river->height, $river->position])->toBe([1600, 1067, 0])
        ->and([$bridge->width, $bridge->height, $bridge->position])->toBe([800, 1200, 1]);

    foreach ([$river->path, $river->thumb_path, $bridge->path, $bridge->thumb_path] as $path) {
        expect($path)->toEndWith('.webp');
        expect($this->disk->mimeType($path))->toBe('image/webp');
    }

    expect(getimagesizefromstring($this->disk->get($river->thumb_path))[0])->toBe(600);
});

test('a second entry for the same day is rejected', function () {
    $user = User::factory()->create();
    Entry::factory()->for($user)->create(['date' => '2026-10-17']);

    $this->actingAs($user)
        ->post(route('entries.store'), ['date' => '2026-10-17'])
        ->assertSessionHasErrors(['date' => 'There is already an entry for this day.']);
});

test('non-image uploads are rejected', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('entries.store'), [
            'date' => '2026-10-17',
            'images' => [UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')],
        ])
        ->assertSessionHasErrors('images.0');

    expect(Entry::count())->toBe(0);
});

test('updating an entry keeps its day and appends new images after existing ones', function () {
    $entry = Entry::factory()->create(['date' => '2026-10-17']);
    EntryImage::factory()->for($entry)->create(['position' => 0]);

    $this->actingAs($entry->user)
        ->put(route('entries.update', $entry), [
            'date' => '2026-10-17',
            'body' => 'Edited.',
            'images' => [UploadedFile::fake()->image('late.jpg')],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    expect($entry->refresh()->body)->toBe('Edited.')
        ->and($entry->images->pluck('position')->all())->toBe([0, 1]);
});

test('users cannot edit or delete entries they did not post', function () {
    $entry = Entry::factory()->create();
    $otherUser = User::factory()->create();

    $this->actingAs($otherUser)->get(route('entries.edit', $entry))->assertForbidden();
    $this->actingAs($otherUser)->put(route('entries.update', $entry), ['date' => '2026-10-17'])->assertForbidden();
    $this->actingAs($otherUser)->delete(route('entries.destroy', $entry))->assertForbidden();

    expect($entry->fresh())->not->toBeNull();
});

test('deleting an entry removes its image files', function () {
    $entry = Entry::factory()->create();
    $image = EntryImage::factory()->for($entry)->create();
    $this->disk->put($image->path, 'display');
    $this->disk->put($image->thumb_path, 'thumb');

    $this->actingAs($entry->user)
        ->delete(route('entries.destroy', $entry))
        ->assertRedirect(route('home'));

    expect($entry->fresh())->toBeNull();
    $this->disk->assertMissing([$image->path, $image->thumb_path]);
});
