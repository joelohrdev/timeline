<?php

namespace App\Models;

use Database\Factories\EntryImageFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $entry_id
 * @property string $path
 * @property string $thumb_path
 * @property int $width
 * @property int $height
 * @property int $position
 * @property-read string $url
 * @property-read string $thumb_url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['path', 'thumb_path', 'width', 'height', 'position'])]
#[Hidden(['path', 'thumb_path', 'created_at', 'updated_at'])]
#[Appends(['url', 'thumb_url'])]
class EntryImage extends Model
{
    /** @use HasFactory<EntryImageFactory> */
    use HasFactory;

    /**
     * Remove the stored files when the image row is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (EntryImage $image): void {
            Storage::disk(config('filesystems.media_disk'))->delete([$image->path, $image->thumb_path]);
        });
    }

    /**
     * @return BelongsTo<Entry, $this>
     */
    public function entry(): BelongsTo
    {
        return $this->belongsTo(Entry::class);
    }

    /**
     * @return Attribute<string, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(fn (): string => Storage::disk(config('filesystems.media_disk'))->url($this->path));
    }

    /**
     * @return Attribute<string, never>
     */
    protected function thumbUrl(): Attribute
    {
        return Attribute::get(fn (): string => Storage::disk(config('filesystems.media_disk'))->url($this->thumb_path));
    }
}
