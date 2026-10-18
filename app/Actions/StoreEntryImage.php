<?php

namespace App\Actions;

use App\Models\Entry;
use App\Models\EntryImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

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
        $disk->put("{$basePath}.webp", (string) $image->toWebp(quality: 80), 'public');

        $image->scaleDown(self::ThumbSize, self::ThumbSize);
        $disk->put("{$basePath}-thumb.webp", (string) $image->toWebp(quality: 75), 'public');

        return $entry->images()->create([
            'path' => "{$basePath}.webp",
            'thumb_path' => "{$basePath}-thumb.webp",
            'width' => $width,
            'height' => $height,
            'position' => $position,
        ]);
    }
}
