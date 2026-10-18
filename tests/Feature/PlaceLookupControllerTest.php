<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

/**
 * @param  array<string, mixed>  $result
 */
function fakeNominatim(array $result): void
{
    Http::fake(['nominatim.openstreetmap.org/*' => Http::response($result)]);
}

$chicago = [
    'city' => 'Chicago',
    'state' => 'Illinois',
    'ISO3166-2-lvl4' => 'US-IL',
    'country_code' => 'us',
];

test('a named spot gives its name, city and two-letter state', function () use ($chicago) {
    fakeNominatim(['category' => 'leisure', 'addresstype' => 'leisure', 'name' => 'Wrigley Field', 'address' => $chicago]);

    $this->actingAs(User::factory()->create())
        ->postJson(route('places.lookup'), ['latitude' => 41.9484, 'longitude' => -87.6553])
        ->assertOk()
        ->assertExactJson(['place' => 'Wrigley Field', 'city' => 'Chicago', 'state' => 'IL']);

    Http::assertSent(fn ($request) => str_contains($request->url(), 'lat=41.9484') && $request->hasHeader('User-Agent'));
});

test('an unnamed spot falls back to the neighbourhood', function () use ($chicago) {
    fakeNominatim(['category' => 'leisure', 'addresstype' => 'leisure', 'name' => '', 'address' => [...$chicago, 'neighbourhood' => 'Wrigleyville']]);

    $this->actingAs(User::factory()->create())
        ->postJson(route('places.lookup'), ['latitude' => 41.9484, 'longitude' => -87.6553])
        ->assertExactJson(['place' => 'Wrigleyville', 'city' => 'Chicago', 'state' => 'IL']);
});

test('a house never gives a place, only the city and state', function () use ($chicago) {
    fakeNominatim(['category' => 'building', 'addresstype' => 'building', 'name' => '', 'address' => [...$chicago, 'house_number' => '2134', 'road' => 'North Fremont Street', 'neighbourhood' => 'Ranch Triangle']]);

    $this->actingAs(User::factory()->create())
        ->postJson(route('places.lookup'), ['latitude' => 41.921, 'longitude' => -87.6515])
        ->assertExactJson(['place' => null, 'city' => 'Chicago', 'state' => 'IL']);
});

test('outside the US the full state name is used, and towns count as cities', function () {
    fakeNominatim(['category' => 'amenity', 'addresstype' => 'amenity', 'name' => 'Café Rouge', 'address' => ['town' => 'Banff', 'state' => 'Alberta', 'ISO3166-2-lvl4' => 'CA-AB', 'country_code' => 'ca']]);

    $this->actingAs(User::factory()->create())
        ->postJson(route('places.lookup'), ['latitude' => 51.1784, 'longitude' => -115.5708])
        ->assertExactJson(['place' => 'Café Rouge', 'city' => 'Banff', 'state' => 'Alberta']);
});

test('nearby lookups share a cached result', function () use ($chicago) {
    fakeNominatim(['category' => 'leisure', 'addresstype' => 'leisure', 'name' => 'Wrigley Field', 'address' => $chicago]);
    $user = User::factory()->create();

    $this->actingAs($user)->postJson(route('places.lookup'), ['latitude' => 41.94841, 'longitude' => -87.65532]);
    $this->actingAs($user)->postJson(route('places.lookup'), ['latitude' => 41.94839, 'longitude' => -87.65528])
        ->assertExactJson(['place' => 'Wrigley Field', 'city' => 'Chicago', 'state' => 'IL']);

    Http::assertSentCount(1);
});

test('a failed lookup returns nothing instead of an error', function () {
    Http::fake(['nominatim.openstreetmap.org/*' => Http::response('', 500)]);

    $this->actingAs(User::factory()->create())
        ->postJson(route('places.lookup'), ['latitude' => 10, 'longitude' => 10])
        ->assertOk()
        ->assertExactJson(['place' => null, 'city' => null, 'state' => null]);
});

test('looking up a place requires being logged in and valid coordinates', function () {
    $this->postJson(route('places.lookup'), ['latitude' => 41.9, 'longitude' => -87.6])->assertUnauthorized();

    $this->actingAs(User::factory()->create())
        ->postJson(route('places.lookup'), ['latitude' => 120, 'longitude' => 'east'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['latitude', 'longitude']);
});
