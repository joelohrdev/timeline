<?php

use App\Holiday;
use App\Models\Entry;
use App\Models\EntryImage;
use Inertia\Testing\AssertableInertia as Assert;

test('a year shows its stats, month covers and categorized days', function () {
    $win = Entry::factory()->baseballGame('Tigers', 8, 5)->create(['date' => '2026-04-11']);
    Entry::factory()->baseballGame('Cardinals', 2, 6)->create(['date' => '2026-04-18']);
    Entry::factory()->baseballGame('Rockets', 4, 4)->create(['date' => '2026-05-02']);
    Entry::factory()->birthday('Emma', 7)->create(['date' => '2026-03-03']);
    Entry::factory()->holiday(Holiday::Halloween)->create(['date' => '2026-10-31', 'title' => null]);
    Entry::factory()->create(['date' => '2026-10-31', 'title' => 'Trick or treat']);
    Entry::factory()->create(['date' => '2025-12-25']);
    $cover = EntryImage::factory()->for($win)->create();
    EntryImage::factory()->for($win)->create(['position' => 1]);

    $this->get(route('years.show', 2026))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('year')
            ->where('year', 2026)
            ->where('years', [2026, 2025])
            ->where('stats', ['days' => 5, 'events' => 6, 'photos' => 2])
            ->has('months', 12)
            ->where('months.3', ['month' => '2026-04', 'days' => 2, 'cover_url' => $cover->thumb_url])
            ->where('months.0', ['month' => '2026-01', 'days' => 0, 'cover_url' => null])
            ->where('games.wins', 1)
            ->where('games.losses', 1)
            ->where('games.ties', 1)
            ->where('games.list.0', ['date' => '2026-04-11', 'opponent' => 'Tigers', 'our_score' => 8, 'their_score' => 5])
            ->where('birthdays', [['date' => '2026-03-03', 'label' => "Emma's birthday"]])
            ->where('holidays', [['date' => '2026-10-31', 'label' => 'Halloween']]));
});

test('a year with nothing posted still renders', function () {
    $this->get(route('years.show', 1999))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('stats.events', 0));
});

test('a year must be a number', function () {
    $this->get('/years/last')->assertNotFound();
});
