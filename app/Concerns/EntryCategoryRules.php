<?php

namespace App\Concerns;

use App\EntryCategory;
use App\Holiday;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait EntryCategoryRules
{
    /**
     * Rules for the category and the extra fields each category adds.
     *
     * Detail fields for any category other than the selected one are excluded, so switching category drops stale values.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function categoryRules(): array
    {
        $onlyFor = fn (EntryCategory $category): string => 'exclude_unless:category,'.$category->value;

        return [
            'category' => ['nullable', Rule::enum(EntryCategory::class)],
            'details.holiday' => [$onlyFor(EntryCategory::Holiday), 'required', Rule::enum(Holiday::class)],
            'details.name' => [$onlyFor(EntryCategory::Birthday), 'required', 'string', 'max:60'],
            'details.age' => [$onlyFor(EntryCategory::Birthday), 'nullable', 'integer', 'min:0', 'max:130'],
            'details.opponent' => [$onlyFor(EntryCategory::BaseballGame), 'nullable', 'string', 'max:80'],
            'details.our_score' => [$onlyFor(EntryCategory::BaseballGame), 'nullable', 'integer', 'min:0', 'max:99'],
            'details.their_score' => [$onlyFor(EntryCategory::BaseballGame), 'nullable', 'integer', 'min:0', 'max:99'],
        ];
    }

    /**
     * Friendly field names for category validation messages.
     *
     * @return array<string, string>
     */
    protected function categoryAttributeNames(): array
    {
        return [
            'details.holiday' => 'holiday',
            'details.name' => 'name',
            'details.age' => 'age',
            'details.opponent' => 'opponent',
            'details.our_score' => 'our score',
            'details.their_score' => 'their score',
        ];
    }

    /**
     * The category and its details, ready to store on the entry.
     *
     * @return array{category: EntryCategory|null, details: array<string, int|string|null>|null}
     */
    public function categoryAttributes(): array
    {
        $category = $this->enum('category', EntryCategory::class);
        $details = $this->safe()->array('details') ?: null;

        return [
            'category' => $category,
            'details' => match ($category) {
                EntryCategory::Birthday => [
                    'name' => $details['name'],
                    'age' => isset($details['age']) ? (int) $details['age'] : null,
                ],
                EntryCategory::BaseballGame => [
                    'opponent' => filled($details['opponent'] ?? null) ? $details['opponent'] : null,
                    'our_score' => isset($details['our_score']) ? (int) $details['our_score'] : null,
                    'their_score' => isset($details['their_score']) ? (int) $details['their_score'] : null,
                ],
                default => $details,
            },
        ];
    }
}
