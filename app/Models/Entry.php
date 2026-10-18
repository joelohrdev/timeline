<?php

namespace App\Models;

use App\Actions\SanitizeEntryBody;
use App\EntryCategory;
use App\Holiday;
use Database\Factories\EntryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $user_id
 * @property Carbon $date
 * @property string|null $photo_time
 * @property string|null $title
 * @property string|null $location_place
 * @property string|null $location_city
 * @property string|null $location_state
 * @property EntryCategory|null $category
 * @property array<string, int|string|null>|null $details
 * @property string|null $body
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['date', 'photo_time', 'title', 'location_place', 'location_city', 'location_state', 'category', 'details', 'body'])]
class Entry extends Model
{
    /** @use HasFactory<EntryFactory> */
    use HasFactory;

    /**
     * Remove image files along with the entry, since the database cascade skips model events.
     */
    protected static function booted(): void
    {
        static::deleting(function (Entry $entry): void {
            $entry->images->each->delete();
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'category' => EntryCategory::class,
            'details' => 'array',
        ];
    }

    /**
     * Store only sanitized editor HTML.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function body(): Attribute
    {
        return Attribute::set(fn (?string $value): ?string => app(SanitizeEntryBody::class)->handle($value));
    }

    /**
     * Order events within a day by when their photos were taken; events without a photo time follow, in the order posted.
     *
     * @param  Builder<Entry>  $query
     */
    #[Scope]
    protected function inDayOrder(Builder $query): void
    {
        $query->orderByRaw('photo_time IS NULL')->orderBy('photo_time')->orderBy('id');
    }

    /**
     * Remember the earliest time of day a photo from this entry's day was taken, so the day's events can be ordered.
     *
     * Stamps are EXIF-style ("YYYY:MM:DD HH:MM:SS"); photos taken on other days are ignored.
     *
     * @param  list<string|null>  $stamps
     */
    public function notePhotoTimes(array $stamps): void
    {
        $day = $this->date->format('Y:m:d');
        $times = collect($stamps)
            ->filter(fn (?string $stamp): bool => is_string($stamp) && preg_match('/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/', $stamp) === 1)
            ->filter(fn (string $stamp): bool => str_starts_with($stamp, $day))
            ->map(fn (string $stamp): string => substr($stamp, 11, 8));

        if ($this->photo_time !== null) {
            $times->push($this->photo_time);
        }

        $earliest = $times->sort()->first();

        if ($earliest !== null && $earliest !== $this->photo_time) {
            $this->update(['photo_time' => $earliest]);
        }
    }

    /**
     * A short name for the event: its title, else what kind of day it was, else the start of its text, else "Untitled event".
     */
    public function label(): string
    {
        if ($this->title) {
            return $this->title;
        }

        return match ($this->category) {
            EntryCategory::Holiday => Holiday::tryFrom($this->details['holiday'] ?? '')?->label() ?? 'Holiday',
            EntryCategory::Birthday => isset($this->details['name']) ? "{$this->details['name']}'s birthday" : 'Birthday',
            EntryCategory::BaseballGame => isset($this->details['opponent']) ? "Game against the {$this->details['opponent']}" : 'Ball game',
            null => $this->body
                ? Str::limit(trim(html_entity_decode(strip_tags($this->body), ENT_QUOTES)), 40)
                : 'Untitled event',
        };
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<EntryImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(EntryImage::class)->orderBy('position');
    }
}
