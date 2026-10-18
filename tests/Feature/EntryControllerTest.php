<?php

use App\EntryCategory;
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

test('entry text keeps editor formatting but drops scripts and unsafe links', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('entries.store'), [
            'date' => '2026-10-17',
            'body' => '<p>A <strong>good</strong> day<script>alert(1)</script> <a href="javascript:alert(1)" onclick="steal()">trap</a> <a href="https://example.com">link</a></p>',
        ])
        ->assertSessionHasNoErrors();

    expect(Entry::sole()->body)->toBe(
        '<p>A <strong>good</strong> day <a rel="noopener noreferrer nofollow" target="_blank">trap</a> '
        .'<a href="https://example.com" rel="noopener noreferrer nofollow" target="_blank">link</a></p>'
    );
});

test('an editor body with no text is stored as empty', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('entries.store'), ['date' => '2026-10-17', 'body' => '<p></p>'])
        ->assertSessionHasNoErrors();

    expect(Entry::sole()->body)->toBeNull();
});

test('a holiday entry stores which holiday it was', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('entries.store'), [
            'date' => '2026-10-31',
            'category' => 'holiday',
            'details' => ['holiday' => 'halloween'],
        ])
        ->assertSessionHasNoErrors();

    $entry = Entry::sole();

    expect($entry->category)->toBe(EntryCategory::Holiday)
        ->and($entry->details)->toBe(['holiday' => 'halloween']);
});

test('a baseball game entry stores the opponent and both scores as numbers', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('entries.store'), [
            'date' => '2026-10-17',
            'category' => 'baseball_game',
            'details' => ['opponent' => 'Tigers', 'our_score' => '8', 'their_score' => '5'],
        ])
        ->assertSessionHasNoErrors();

    expect(Entry::sole()->details)->toBe(['opponent' => 'Tigers', 'our_score' => 8, 'their_score' => 5]);
});

test('a baseball game entry requires both scores', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('entries.store'), [
            'date' => '2026-10-17',
            'category' => 'baseball_game',
            'details' => ['opponent' => 'Tigers', 'our_score' => '8'],
        ])
        ->assertSessionHasErrors(['details.their_score' => 'The their score field is required.']);

    expect(Entry::count())->toBe(0);
});

test('a birthday entry requires a name but not an age', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('entries.store'), ['date' => '2026-10-17', 'category' => 'birthday', 'details' => ['age' => '7']])
        ->assertSessionHasErrors(['details.name' => 'The name field is required.']);

    $this->actingAs($user)
        ->post(route('entries.store'), ['date' => '2026-10-17', 'category' => 'birthday', 'details' => ['name' => 'Grandpa']])
        ->assertSessionHasNoErrors();

    expect(Entry::sole()->details)->toBe(['name' => 'Grandpa', 'age' => null]);
});

test('unknown categories and holidays are rejected', function (array $input, string $field) {
    $this->actingAs(User::factory()->create())
        ->post(route('entries.store'), ['date' => '2026-10-17', ...$input])
        ->assertSessionHasErrors($field);
})->with([
    'category' => [['category' => 'wedding'], 'category'],
    'holiday' => [['category' => 'holiday', 'details' => ['holiday' => 'groundhog_day']], 'details.holiday'],
]);

test('changing an entry to another category drops the old category fields', function () {
    $entry = Entry::factory()->baseballGame()->create(['date' => '2026-10-17']);

    $this->actingAs($entry->user)
        ->put(route('entries.update', $entry), [
            'date' => '2026-10-17',
            'category' => 'birthday',
            'details' => ['name' => 'Emma', 'age' => '7', 'opponent' => 'Tigers', 'our_score' => '8', 'their_score' => '5'],
        ])
        ->assertSessionHasNoErrors();

    expect($entry->refresh()->category)->toBe(EntryCategory::Birthday)
        ->and($entry->details)->toBe(['name' => 'Emma', 'age' => 7]);
});

test('clearing the category removes its fields', function () {
    $entry = Entry::factory()->holiday()->create(['date' => '2026-10-17']);

    $this->actingAs($entry->user)
        ->put(route('entries.update', $entry), ['date' => '2026-10-17', 'category' => '', 'details' => ['holiday' => 'halloween']])
        ->assertSessionHasNoErrors();

    expect($entry->refresh()->category)->toBeNull()
        ->and($entry->details)->toBeNull();
});
