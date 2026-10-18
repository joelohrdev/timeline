<?php

namespace Database\Seeders;

use App\Actions\StoreEntryImage;
use App\EntryCategory;
use App\Models\Entry;
use App\Models\User;
use GdImage;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;
use RuntimeException;

class TimelineSeeder extends Seeder
{
    /**
     * Sample journal lines for seeded entries.
     *
     * @var list<string|null>
     */
    private const array Bodies = [
        '<p>Walked the river trail before work. <strong>First frost</strong> on the bridge rails and the light came in sideways through the trees.</p>',
        '<p>Quiet day. Finished the bookshelf.</p>',
        '<p>Farmers market in the morning, then soup for the week:</p><ul><li><p>butternut squash</p></li><li><p>leeks</p></li><li><p>too much bread</p></li></ul><p>The squash guy remembered us.</p>',
        '<p>Long drive out to the lake. Nobody else there.</p>',
        '<p>Rain all afternoon. Read on the porch until it got too cold.</p><blockquote><p>The best time to plant a tree was twenty years ago.</p></blockquote>',
        null,
        '<p>Tried the new coffee place on 5th. <em>Good espresso, terrible chairs.</em></p>',
        '<p>Sunset from the parking garage roof, of all places.</p>',
        '<p>Kids\' soccer. We lost 4–1 but everyone got orange slices.</p>',
        '<p>Fixed the gate latch, finally.</p>',
        null,
        '<p>Hiked to the <a href="https://www.nps.gov">overlook</a>. Fog sat in the valley the whole time and never burned off.</p><ol><li><p>Trailhead at 7</p></li><li><p>Summit by 9</p></li><li><p>Pancakes by 11</p></li></ol>',
    ];

    /**
     * Categories for a handful of seeded entries, keyed by position on the timeline, so each style shows up.
     *
     * @var array<int, array{category: EntryCategory, details: array<string, int|string|null>}>
     */
    private const array Categories = [
        1 => ['category' => EntryCategory::BaseballGame, 'details' => ['opponent' => 'Tigers', 'our_score' => 8, 'their_score' => 5]],
        3 => ['category' => EntryCategory::Holiday, 'details' => ['holiday' => 'halloween']],
        5 => ['category' => EntryCategory::Birthday, 'details' => ['name' => 'Emma', 'age' => 7]],
        7 => ['category' => EntryCategory::BaseballGame, 'details' => ['opponent' => 'Cardinals', 'our_score' => 2, 'their_score' => 6]],
        9 => ['category' => EntryCategory::Holiday, 'details' => ['holiday' => 'thanksgiving']],
        11 => ['category' => EntryCategory::Holiday, 'details' => ['holiday' => 'christmas']],
        13 => ['category' => EntryCategory::BaseballGame, 'details' => ['opponent' => 'Rockets', 'our_score' => 4, 'their_score' => 4]],
        15 => ['category' => EntryCategory::Birthday, 'details' => ['name' => 'Grandpa', 'age' => null]],
        17 => ['category' => EntryCategory::Holiday, 'details' => ['holiday' => 'independence_day']],
        20 => ['category' => EntryCategory::Holiday, 'details' => ['holiday' => 'st_patricks_day']],
    ];

    /**
     * Extra events on the same day as an earlier one, keyed by position on the timeline.
     *
     * @var array<int, array{title: string, body: string}>
     */
    private const array SecondEvents = [
        1 => ['title' => 'Pizza after the game', 'body' => '<p>Everyone ordered pepperoni. Nobody finished.</p>'],
        5 => ['title' => 'Cake and presents', 'body' => '<p>Seven candles, one breath.</p>'],
        11 => ['title' => 'Lights downtown', 'body' => '<p>Walked the square after dinner.</p>'],
    ];

    /**
     * Sky / ground colour pairs used to draw placeholder landscapes.
     *
     * @var list<array{array{int, int, int}, array{int, int, int}, array{int, int, int}}>
     */
    private const array Palettes = [
        [[250, 205, 150], [235, 120, 90], [70, 55, 70]],
        [[170, 210, 235], [225, 235, 240], [60, 95, 80]],
        [[40, 50, 90], [230, 140, 110], [30, 30, 45]],
        [[215, 225, 215], [180, 200, 190], [110, 130, 110]],
        [[255, 230, 190], [250, 170, 120], [140, 90, 70]],
        [[120, 160, 200], [200, 220, 235], [45, 70, 95]],
    ];

    /**
     * Seed a month of timeline entries with WebP images.
     */
    public function run(StoreEntryImage $storeEntryImage): void
    {
        $user = User::query()->first() ?? User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $date = now()->startOfDay();

        foreach (range(0, 23) as $index) {
            $date = $date->copy()->subDays(fake()->randomElement([1, 1, 1, 2, 3]));

            if (Entry::query()->whereDate('date', $date)->exists()) {
                continue;
            }

            $entry = $user->entries()->create([
                'date' => $date->toDateString(),
                'body' => self::Bodies[$index % count(self::Bodies)],
                ...self::Categories[$index] ?? [],
            ]);

            $this->addPhotos($entry, fake()->randomElement([0, 1, 1, 1, 2, 3, 4]), $storeEntryImage);

            if (isset(self::SecondEvents[$index])) {
                $second = $user->entries()->create([
                    'date' => $date->toDateString(),
                    ...self::SecondEvents[$index],
                ]);

                $this->addPhotos($second, fake()->numberBetween(1, 2), $storeEntryImage);
            }
        }
    }

    private function addPhotos(Entry $entry, int $count, StoreEntryImage $storeEntryImage): void
    {
        for ($position = 0; $position < $count; $position++) {
            $file = $this->landscape();
            $storeEntryImage->handle($entry, $file, $position);
            unlink($file->getRealPath());
        }
    }

    /**
     * Draw a simple sky, sun, and hills scene so seeded entries look like photos.
     */
    private function landscape(): UploadedFile
    {
        [$skyTop, $skyBottom, $ground] = fake()->randomElement(self::Palettes);
        [$width, $height] = fake()->randomElement([[2400, 1600], [2400, 1600], [1600, 2000]]);

        $image = imagecreatetruecolor($width, $height);

        for ($y = 0; $y < $height; $y++) {
            $ratio = $y / $height;
            $color = $this->color($image, [
                $skyTop[0] + ($skyBottom[0] - $skyTop[0]) * $ratio,
                $skyTop[1] + ($skyBottom[1] - $skyTop[1]) * $ratio,
                $skyTop[2] + ($skyBottom[2] - $skyTop[2]) * $ratio,
            ]);
            imageline($image, 0, $y, $width, $y, $color);
        }

        $sun = $this->color($image, [255, 245, 225], alpha: 30);
        $sunSize = (int) ($width * fake()->randomFloat(2, 0.08, 0.16));
        imagefilledellipse($image, fake()->numberBetween($sunSize, $width - $sunSize), (int) ($height * 0.45), $sunSize, $sunSize, $sun);

        foreach ([0.62, 0.72, 0.84] as $layer => $horizon) {
            $shade = 1 - (2 - $layer) * 0.18;
            $color = $this->color($image, [$ground[0] * $shade, $ground[1] * $shade, $ground[2] * $shade]);
            $points = [0, $height];

            for ($x = 0; $x <= $width; $x += (int) ($width / 8)) {
                $points[] = $x;
                $points[] = (int) ($height * $horizon + fake()->numberBetween(-60, 60) * ($layer + 1));
            }

            array_push($points, $width, $height);
            imagefilledpolygon($image, $points, $color);
        }

        $path = tempnam(sys_get_temp_dir(), 'seed').'.jpg';
        imagejpeg($image, $path, 90);

        return new UploadedFile($path, basename($path), 'image/jpeg', null, true);
    }

    /**
     * Allocate a colour, clamping each channel to the 0–255 range GD accepts.
     *
     * @param  array{int|float, int|float, int|float}  $rgb
     * @param  int<0, 127>  $alpha
     */
    private function color(GdImage $image, array $rgb, int $alpha = 0): int
    {
        $color = imagecolorallocatealpha($image, $this->channel($rgb[0]), $this->channel($rgb[1]), $this->channel($rgb[2]), $alpha);

        if ($color === false) {
            throw new RuntimeException('Could not allocate a colour for the seed image.');
        }

        return $color;
    }

    /**
     * @return int<0, 255>
     */
    private function channel(int|float $value): int
    {
        return max(0, min(255, (int) round($value)));
    }
}
