<?php

namespace App\Models;

use App\Actions\SanitizeEntryBody;
use App\EntryCategory;
use App\Holiday;
use Database\Factories\EntryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property Carbon $date
 * @property string|null $title
 * @property EntryCategory|null $category
 * @property array<string, int|string|null>|null $details
 * @property string|null $body
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['date', 'title', 'category', 'details', 'body'])]
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
     * A short name for the event: its title, else what kind of day it was, else "Untitled event".
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
            null => 'Untitled event',
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
