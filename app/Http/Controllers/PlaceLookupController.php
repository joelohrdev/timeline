<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

class PlaceLookupController extends Controller
{
    /**
     * Turn a photo's GPS coordinates into a place, city and state using OpenStreetMap (Nominatim).
     *
     * Only the coordinates leave the server, results are cached, and the coordinates aren't stored. Street addresses
     * are never returned: a house or building gives just the city and state.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $latitude = round((float) $validated['latitude'], 4);
        $longitude = round((float) $validated['longitude'], 4);

        $place = Cache::rememberForever(
            "place-lookup:{$latitude},{$longitude}",
            fn (): ?array => $this->lookUp($latitude, $longitude),
        );

        return response()->json($place ?? ['place' => null, 'city' => null, 'state' => null]);
    }

    /**
     * @return array{place: string|null, city: string|null, state: string|null}|null
     */
    private function lookUp(float $latitude, float $longitude): ?array
    {
        try {
            $response = Http::withUserAgent('LohrLine/1.0 ('.config('app.url').')')
                ->timeout(5)
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'format' => 'jsonv2',
                    'lat' => $latitude,
                    'lon' => $longitude,
                    'zoom' => 18,
                    'addressdetails' => 1,
                ]);
        } catch (Throwable) {
            return null;
        }

        if (! $response->successful() || $response->json('error')) {
            return null;
        }

        /** @var array<string, string> $address */
        $address = $response->json('address', []);

        return [
            'place' => $this->placeName($response->json(), $address),
            'city' => $address['city'] ?? $address['town'] ?? $address['village'] ?? $address['hamlet'] ?? null,
            'state' => $this->stateName($address),
        ];
    }

    /**
     * The named spot (park, field, restaurant); else the neighbourhood. Never anything for a house or building.
     *
     * @param  array<string, mixed>  $result
     * @param  array<string, string>  $address
     */
    private function placeName(array $result, array $address): ?string
    {
        $isPrivate = in_array($result['category'] ?? null, ['building', 'place'], true)
            || in_array($result['addresstype'] ?? null, ['building', 'house', 'residential'], true);

        if ($isPrivate) {
            return null;
        }

        $name = trim((string) ($result['name'] ?? ''));

        return $name !== '' ? $name : ($address['neighbourhood'] ?? $address['suburb'] ?? null);
    }

    /**
     * US states as their two-letter code ("IL"); elsewhere the state's name.
     *
     * @param  array<string, string>  $address
     */
    private function stateName(array $address): ?string
    {
        $code = $address['ISO3166-2-lvl4'] ?? '';

        if (($address['country_code'] ?? null) === 'us' && str_starts_with($code, 'US-')) {
            return substr($code, 3);
        }

        return $address['state'] ?? null;
    }
}
