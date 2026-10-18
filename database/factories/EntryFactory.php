<?php

namespace Database\Factories;

use App\EntryCategory;
use App\Holiday;
use App\Models\Entry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Entry>
 */
class EntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'date' => fake()->unique()->date(),
            'body' => '<p>'.fake()->paragraph().'</p>',
        ];
    }

    /**
     * An entry for a holiday.
     */
    public function holiday(Holiday $holiday = Holiday::Halloween): static
    {
        return $this->state([
            'category' => EntryCategory::Holiday,
            'details' => ['holiday' => $holiday->value],
        ]);
    }

    /**
     * An entry for someone's birthday.
     */
    public function birthday(string $name = 'Emma', ?int $age = 7): static
    {
        return $this->state([
            'category' => EntryCategory::Birthday,
            'details' => ['name' => $name, 'age' => $age],
        ]);
    }

    /**
     * An entry for a kids' baseball game.
     */
    public function baseballGame(string $opponent = 'Tigers', int $ourScore = 8, int $theirScore = 5): static
    {
        return $this->state([
            'category' => EntryCategory::BaseballGame,
            'details' => ['opponent' => $opponent, 'our_score' => $ourScore, 'their_score' => $theirScore],
        ]);
    }
}
