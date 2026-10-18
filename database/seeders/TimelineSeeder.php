<?php

namespace Database\Seeders;

use App\Actions\StoreEntryImage;
use App\Models\Entry;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;

class TimelineSeeder extends Seeder
{
    /**
     * Sample journal lines for seeded entries.
     *
     * @var list<string|null>
     */
    private const array Bodies = [
        'Walked the river trail before work. First frost on the bridge rails and the light came in sideways through the trees.',
        'Quiet day. Finished the bookshelf.',
        "Farmers market in the morning, then soup for the week.\nThe squash guy remembered us.",
        'Long drive out to the lake. Nobody else there.',
        'Rain all afternoon. Read on the porch until it got too cold.',
        null,
        'Tried the new coffee place on 5th. Good espresso, terrible chairs.',
        'Sunset from the parking garage roof, of all places.',
        "Kids' soccer. We lost 4–1 but everyone got orange slices.",
        'Fixed the gate latch, finally.',
        null,
        'Hiked to the overlook. Fog sat in the valley the whole time and never burned off.',
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
            ]);

            $imageCount = fake()->randomElement([0, 1, 1, 1, 2, 3, 4]);

            for ($position = 0; $position < $imageCount; $position++) {
                $file = $this->landscape();
                $storeEntryImage->handle($entry, $file, $position);
                unlink($file->getRealPath());
            }
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
            $color = imagecolorallocate(
                $image,
                (int) ($skyTop[0] + ($skyBottom[0] - $skyTop[0]) * $ratio),
                (int) ($skyTop[1] + ($skyBottom[1] - $skyTop[1]) * $ratio),
                (int) ($skyTop[2] + ($skyBottom[2] - $skyTop[2]) * $ratio),
            );
            imageline($image, 0, $y, $width, $y, $color);
        }

        $sun = imagecolorallocatealpha($image, 255, 245, 225, 30);
        $sunSize = (int) ($width * fake()->randomFloat(2, 0.08, 0.16));
        imagefilledellipse($image, fake()->numberBetween($sunSize, $width - $sunSize), (int) ($height * 0.45), $sunSize, $sunSize, $sun);

        foreach ([0.62, 0.72, 0.84] as $layer => $horizon) {
            $shade = 1 - (2 - $layer) * 0.18;
            $color = imagecolorallocate($image, (int) ($ground[0] * $shade), (int) ($ground[1] * $shade), (int) ($ground[2] * $shade));
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
}
