<?php

namespace App;

enum EntryCategory: string
{
    case Holiday = 'holiday';
    case Birthday = 'birthday';
    case BaseballGame = 'baseball_game';

    /**
     * Human-readable name for the category picker.
     */
    public function label(): string
    {
        return match ($this) {
            self::Holiday => 'Holiday',
            self::Birthday => 'Birthday',
            self::BaseballGame => 'Baseball game',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $category): array => ['value' => $category->value, 'label' => $category->label()],
            self::cases(),
        );
    }
}
