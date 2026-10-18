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
    Entry::factory()->count(12)->create();

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('entries.data', 10));

    $this->get(route('home', ['page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('entries.data', 2));
});
