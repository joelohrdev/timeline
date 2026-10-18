<?php

namespace Database\Factories;

use App\Models\Entry;
use App\Models\EntryImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EntryImage>
 */
class EntryImageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->uuid();

        return [
            'entry_id' => Entry::factory(),
            'path' => "entries/{$name}.webp",
            'thumb_path' => "entries/{$name}-thumb.webp",
            'width' => 1600,
            'height' => 1067,
            'position' => 0,
        ];
    }
}
