<?php

use App\Holiday;
use App\Models\Entry;
use Carbon\CarbonImmutable;
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

test('events on the same day are listed in the order they were posted', function () {
    $first = Entry::factory()->create(['date' => '2026-10-17']);
    $second = Entry::factory()->create(['date' => '2026-10-17']);
    $older = Entry::factory()->create(['date' => '2026-10-16']);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('entries.data', fn ($entries) => collect($entries)->pluck('id')->all() === [$first->id, $second->id, $older->id]));
});

test('jumping to a month starts the timeline there without picking a day', function () {
    Entry::factory()->create(['date' => '2026-10-02']);
    Entry::factory()->create(['date' => '2026-09-28']);

    $this->get(route('home', ['date' => '2026-09']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('jumpedTo', '2026-09')
            ->where('entries.data', fn ($entries) => collect($entries)->pluck('date')->all() === ['2026-09-28']));

    $this->get(route('home', ['date' => '2026-13']))
        ->assertInertia(fn (Assert $page) => $page->where('jumpedTo', null)->has('entries.data', 2));
});

test('searching finds words in titles, text and category details, ignoring case', function () {
    $titled = Entry::factory()->create(['title' => 'Dinner at Grandma\'s', 'body' => null]);
    $text = Entry::factory()->create(['title' => null, 'body' => '<p>Long drive to <strong>Grandma</strong>.</p>']);
    $game = Entry::factory()->baseballGame('Tigers')->create(['title' => null, 'body' => null]);
    Entry::factory()->create(['title' => 'Bookshelf', 'body' => '<p>Quiet day.</p>']);

    $ids = fn (string $q) => collect($this->get(route('home', ['q' => $q]))->inertiaProps('entries.data'))->pluck('id')->sort()->values()->all();

    expect($ids('GRANDMA'))->toBe(collect([$titled->id, $text->id])->sort()->values()->all())
        ->and($ids("grandma's"))->toBe([$titled->id])
        ->and($ids('tigers'))->toBe([$game->id]);
});

test('search treats wildcard characters literally and ignores very short terms', function () {
    Entry::factory()->create(['title' => '100% fun']);
    Entry::factory()->create(['title' => 'Quiet day']);

    $this->get(route('home', ['q' => '0%']))
        ->assertInertia(fn (Assert $page) => $page->where('search', '0%')->has('entries.data', 1));

    $this->get(route('home', ['q' => 'a']))
        ->assertInertia(fn (Assert $page) => $page->where('search', null)->has('entries.data', 2));
});

test('on this day lists the same date from earlier years, newest first', function () {
    $this->travelTo(CarbonImmutable::parse('2026-10-18 09:00', 'America/Chicago'));

    $lastYear = Entry::factory()->create(['date' => '2025-10-18', 'title' => 'Pumpkin patch']);
    $twoYearsAgo = Entry::factory()->holiday(Holiday::Halloween)->create(['date' => '2024-10-18', 'title' => null]);
    Entry::factory()->create(['date' => '2026-10-18']);
    Entry::factory()->create(['date' => '2025-10-17']);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('onThisDay', 2)
            ->where('onThisDay.0.id', $lastYear->id)
            ->where('onThisDay.0.label', 'Pumpkin patch')
            ->where('onThisDay.1.id', $twoYearsAgo->id)
            ->where('onThisDay.1.label', 'Halloween'));
});

test('search also finds entries by their location', function () {
    $atTheGame = Entry::factory()->create(['title' => 'Ball game', 'location_place' => 'Wrigley Field', 'location_city' => 'Chicago', 'location_state' => 'IL']);
    Entry::factory()->create(['title' => 'Beach', 'location_city' => 'Milwaukee', 'location_state' => 'WI', 'body' => null]);

    $this->get(route('home', ['q' => 'chicago']))
        ->assertInertia(fn (Assert $page) => $page->where('entries.data', fn ($entries) => collect($entries)->pluck('id')->all() === [$atTheGame->id]));
});

test("a day's events are ordered by when their photos were taken, untimed ones last", function () {
    $untimed = Entry::factory()->create(['date' => '2026-10-17', 'photo_time' => null]);
    $evening = Entry::factory()->create(['date' => '2026-10-17', 'photo_time' => '19:30:00']);
    $morning = Entry::factory()->create(['date' => '2026-10-17', 'photo_time' => '08:15:00']);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where('entries.data', fn ($entries) => collect($entries)->pluck('id')->all() === [$morning->id, $evening->id, $untimed->id]));
});
