<?php

namespace App\Actions;

use App\Models\Entry;
use App\Models\EntryImage;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Exceptions\DriverException;
use Intervention\Image\Format;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\ImageInterface;
use RuntimeException;

class StoreEntryImage
{
    public const int DisplaySize = 1600;

    public const int ThumbSize = 600;

    /**
     * iPhone photo formats (HEVC-encoded) that GD cannot read.
     */
    public const array HeifMimeTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

    /**
     * Convert an upload to WebP (display + thumbnail) and attach it to the entry.
     *
     * Re-encoding through GD auto-orients the image and drops EXIF metadata such as GPS location.
     */
    public function handle(Entry $entry, UploadedFile $file, int $position, ?string $fingerprint = null, ?string $takenKey = null): EntryImage
    {
        $image = $this->read($file);

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
            'original_fingerprint' => $fingerprint,
            'taken_key' => $takenKey,
        ]);
    }

    /**
     * Convert several uploads and add them after the entry's existing photos, in the order given.
     *
     * Fingerprints and taken keys (sent by the browser, in the same order as the files) let a later upload
     * tell whether a photo is already on the timeline.
     *
     * @param  array<int, UploadedFile>  $files
     * @param  array<int, string|null>  $fingerprints
     * @param  array<int, string|null>  $takenKeys
     * @return list<EntryImage>
     */
    public function handleMany(Entry $entry, array $files, array $fingerprints = [], array $takenKeys = []): array
    {
        $nextPosition = (int) $entry->images()->max('position') + ($entry->images()->exists() ? 1 : 0);
        $stored = [];

        foreach (array_values($files) as $offset => $file) {
            $stored[] = $this->handle(
                $entry,
                $file,
                $nextPosition + $offset,
                $fingerprints[$offset] ?? null,
                $takenKeys[$offset] ?? null,
            );
        }

        return $stored;
    }

    /**
     * Whether this server's Imagick can decode HEIC/HEIF photos.
     */
    public function canReadHeif(): bool
    {
        try {
            return ImageManager::imagick()->driver()->supports(Format::HEIC);
        } catch (DriverException) {
            return false;
        }
    }

    public function isHeif(UploadedFile $file): bool
    {
        return in_array($file->getMimeType(), self::HeifMimeTypes, true);
    }

    /**
     * Load an upload with GD. HEIC/HEIF is decoded by Imagick first, so resizing and WebP encoding stay on one path.
     *
     * HEIF stores rotation in the container ("irot"), which libheif applies while decoding. iPhones also write an
     * EXIF orientation that describes the same rotation, so auto-orienting from EXIF as well would turn portraits sideways.
     */
    private function read(UploadedFile $file): ImageInterface
    {
        if (! $this->isHeif($file)) {
            return ImageManager::gd()->read($file->getRealPath());
        }

        $decoded = ImageManager::imagick(autoOrientation: false)
            ->read($file->getRealPath())
            ->scaleDown(self::DisplaySize, self::DisplaySize)
            ->toPng();

        return ImageManager::gd()->read((string) $decoded);
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
