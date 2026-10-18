<?php

use App\Models\Entry;
use App\Models\EntryImage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake(config('filesystems.media_disk'));
});

test('the import page lists the days already posted', function () {
    $user = User::factory()->create();
    $entry = Entry::factory()->for($user)->create(['date' => '2026-07-04', 'title' => 'Fireworks']);

    $this->actingAs($user)
        ->get(route('entries.import'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('entries/import')
            ->where('postedDays.2026-07-04', [['id' => $entry->id, 'label' => 'Fireworks']]));
});

test('guests cannot import', function () {
    $this->get(route('entries.import'))->assertRedirect(route('login'));
    $this->postJson(route('entries.import.store'), [])->assertUnauthorized();
});

test('a draft is posted as a new event with its photos, details and earliest photo time', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('entries.import.store'), [
            'date' => '2026-07-04',
            'title' => 'Lake day',
            'location_city' => 'Madison',
            'location_state' => 'WI',
            'body' => '<p>Hot and sunny.</p>',
            'images' => [UploadedFile::fake()->image('a.jpg'), UploadedFile::fake()->image('b.jpg')],
            'fingerprints' => ['fp-a', 'fp-b'],
            'taken_keys' => ['', ''],
            'taken_times' => ['2026:07:04 15:10:00', '2026:07:04 09:45:12.5'],
        ])
        ->assertCreated()
        ->assertJson(['date' => '2026-07-04']);

    $entry = $user->entries()->sole();

    expect($entry->only(['title', 'location_city', 'location_state', 'body', 'photo_time']))
        ->toBe(['title' => 'Lake day', 'location_city' => 'Madison', 'location_state' => 'WI', 'body' => '<p>Hot and sunny.</p>', 'photo_time' => '09:45:12'])
        ->and($entry->images->pluck('original_fingerprint')->all())->toBe(['fp-a', 'fp-b']);
});

test('photos taken on another day do not set the photo time', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('entries.import.store'), [
            'date' => '2026-07-04',
            'images' => [UploadedFile::fake()->image('a.jpg')],
            'taken_times' => ['2026:07:05 08:00:00'],
        ])
        ->assertCreated();

    expect($user->entries()->sole()->photo_time)->toBeNull();
});

test('a draft can add its photos to an existing event and move its photo time earlier', function () {
    $entry = Entry::factory()->create(['date' => '2026-07-04', 'photo_time' => '18:00:00', 'title' => 'Fireworks']);
    EntryImage::factory()->for($entry)->create();

    $this->actingAs($entry->user)
        ->postJson(route('entries.import.store'), [
            'entry_id' => $entry->id,
            'date' => '2026-07-04',
            'title' => 'ignored',
            'images' => [UploadedFile::fake()->image('a.jpg')],
            'taken_times' => ['2026:07:04 17:30:00'],
        ])
        ->assertOk()
        ->assertJson(['entry_id' => $entry->id]);

    $entry->refresh();

    expect($entry->images()->count())->toBe(2)
        ->and($entry->title)->toBe('Fireworks')
        ->and($entry->photo_time)->toBe('17:30:00');
});

test("a draft cannot add photos to someone else's event or past 10 photos", function () {
    $user = User::factory()->create();
    $someoneElses = Entry::factory()->create();

    $this->actingAs($user)
        ->postJson(route('entries.import.store'), ['entry_id' => $someoneElses->id, 'date' => '2026-07-04', 'images' => [UploadedFile::fake()->image('a.jpg')]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['entry_id' => 'That event no longer exists.']);

    $full = Entry::factory()->for($user)->create();
    EntryImage::factory()->count(10)->for($full)->sequence(fn ($sequence) => ['position' => $sequence->index])->create();

    $this->actingAs($user)
        ->postJson(route('entries.import.store'), ['entry_id' => $full->id, 'date' => '2026-07-04', 'images' => [UploadedFile::fake()->image('a.jpg')]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['images' => 'That event would have more than 10 photos.']);

    expect($full->images()->count())->toBe(10);
});

test('a draft needs at least one photo and a day', function () {
    $this->actingAs(User::factory()->create())
        ->postJson(route('entries.import.store'), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['images', 'date']);
});
