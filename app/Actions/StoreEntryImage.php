<?php

namespace App\Actions;

use App\Models\Entry;
use App\Models\EntryImage;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use RuntimeException;

class StoreEntryImage
{
    public const int DisplaySize = 1600;

    public const int ThumbSize = 600;

    /**
     * Convert an upload to WebP (display + thumbnail) and attach it to the entry.
     *
     * Re-encoding through GD auto-orients the image and drops EXIF metadata such as GPS location.
     */
    public function handle(Entry $entry, UploadedFile $file, int $position): EntryImage
    {
        $image = ImageManager::gd()->read($file->getRealPath());

        $basePath = 'entries/'.$entry->date->format('Y-m-d').'/'.Str::uuid();
        $disk = Storage::disk(config('filesystems.media_disk'));

        $image->scaleDown(self::DisplaySize, self::DisplaySize);
        $width = $image->width();
        $height = $image->height();
        $this->write($disk, "{$basePath}.webp", (string) $image->toWebp(quality: 80));

        $image->scaleDown(self::ThumbSize, self::ThumbSize);
        $this->write($disk, "{$basePath}-thumb.webp", (string) $image->toWebp(quality: 75));

        return $entry->images()->create([
            'path' => "{$basePath}.webp",
            'thumb_path' => "{$basePath}-thumb.webp",
            'width' => $width,
            'height' => $height,
            'position' => $position,
        ]);
    }

    /**
     * Write a file to the media disk, failing loudly so an entry is never saved pointing at a missing image.
     *
     * No visibility is passed: R2 serves files publicly through its custom domain and does not need (or reliably accept) per-object ACLs.
     */
    private function write(Filesystem $disk, string $path, string $contents): void
    {
        if (! $disk->put($path, $contents)) {
            throw new RuntimeException("Could not write [{$path}] to the media disk.");
        }
    }
}
