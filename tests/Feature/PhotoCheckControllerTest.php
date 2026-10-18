<?php

use App\Models\Entry;
use App\Models\EntryImage;
use App\Models\User;

test('chosen photos already on the timeline are matched by fingerprint or exact taken time', function () {
    $user = User::factory()->create();
    $game = Entry::factory()->for($user)->baseballGame('Tigers')->create(['date' => '2026-07-04', 'title' => null]);
    EntryImage::factory()->for($game)->create(['original_fingerprint' => 'abc-123', 'taken_key' => '2026:07:04 18:30:00.123']);
    $picnic = Entry::factory()->for($user)->create(['date' => '2026-07-05', 'title' => 'Picnic']);
    EntryImage::factory()->for($picnic)->create(['original_fingerprint' => 'def-456', 'taken_key' => '2026:07:05 12:00:00.500']);

    $this->actingAs($user)
        ->postJson(route('photos.check'), ['photos' => [
            ['fingerprint' => 'new-1', 'taken_key' => null],
            ['fingerprint' => 'abc-123', 'taken_key' => null],
            ['fingerprint' => 're-exported', 'taken_key' => '2026:07:05 12:00:00.500'],
        ]])
        ->assertOk()
        ->assertExactJson(['matches' => [
            ['index' => 1, 'entry_id' => $game->id, 'date' => '2026-07-04', 'label' => 'Game against the Tigers'],
            ['index' => 2, 'entry_id' => $picnic->id, 'date' => '2026-07-05', 'label' => 'Picnic'],
        ]]);
});

test("another user's photos are never reported as duplicates", function () {
    $someoneElse = Entry::factory()->create();
    EntryImage::factory()->for($someoneElse)->create(['original_fingerprint' => 'abc-123']);

    $this->actingAs(User::factory()->create())
        ->postJson(route('photos.check'), ['photos' => [['fingerprint' => 'abc-123']]])
        ->assertOk()
        ->assertExactJson(['matches' => []]);
});

test('checking photos requires being logged in and a list of photos', function () {
    $this->postJson(route('photos.check'), ['photos' => [['fingerprint' => 'abc']]])->assertUnauthorized();

    $this->actingAs(User::factory()->create())
        ->postJson(route('photos.check'), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('photos');
});
