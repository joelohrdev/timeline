<?php

use App\Models\Entry;
use Inertia\Testing\AssertableInertia as Assert;

test('guests see entries newest day first', function () {
    Entry::factory()->create(['date' => '2026-10-01']);
    Entry::factory()->create(['date' => '2026-10-15']);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('timeline')
            ->where('entries.data.0.date', '2026-10-15')
            ->where('entries.data.1.date', '2026-10-01'));
});

test('older days are served on the next page for infinite scroll', function () {
    Entry::factory()->count(42)->create();

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('entries.data', 40));

    $this->get(route('home', ['page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('entries.data', 2));
});

test('searching for a date starts the timeline at that month and goes back from there', function () {
    Entry::factory()->create(['date' => '2026-10-17']);
    Entry::factory()->create(['date' => '2026-09-30']);
    Entry::factory()->create(['date' => '2026-09-03']);
    Entry::factory()->create(['date' => '2026-08-12']);

    $this->get(route('home', ['date' => '2026-09-03']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('jumpedTo', '2026-09-03')
            ->where('entries.data', fn ($entries) => collect($entries)->pluck('date')->all() === ['2026-09-30', '2026-09-03', '2026-08-12']));
});

test('an invalid search date is ignored', function () {
    Entry::factory()->create(['date' => '2026-10-17']);

    $this->get(route('home', ['date' => 'not-a-date']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('jumpedTo', null)
            ->has('entries.data', 1));
});

test('the timeline reports the first day posted for the date picker', function () {
    Entry::factory()->create(['date' => '2025-03-02']);
    Entry::factory()->create(['date' => '2026-10-17']);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where('firstDate', '2025-03-02'));
});

test('filtering by category shows only entries in that category', function () {
    Entry::factory()->baseballGame()->create(['date' => '2026-10-17']);
    Entry::factory()->birthday()->create(['date' => '2026-10-10']);
    Entry::factory()->baseballGame()->create(['date' => '2026-09-05']);
    Entry::factory()->create(['date' => '2026-09-01']);

    $this->get(route('home', ['category' => 'baseball_game']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('category', 'baseball_game')
            ->where('entries.data', fn ($entries) => collect($entries)->pluck('date')->all() === ['2026-10-17', '2026-09-05']));
});

test('a category filter combines with a date search', function () {
    Entry::factory()->baseballGame()->create(['date' => '2026-10-17']);
    Entry::factory()->baseballGame()->create(['date' => '2026-09-05']);
    Entry::factory()->holiday()->create(['date' => '2026-09-02']);

    $this->get(route('home', ['category' => 'baseball_game', 'date' => '2026-09-20']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('entries.data', fn ($entries) => collect($entries)->pluck('date')->all() === ['2026-09-05']));
});

test('an unknown category is ignored', function () {
    Entry::factory()->count(2)->create();

    $this->get(route('home', ['category' => 'wedding']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('category', null)
            ->has('entries.data', 2));
});
