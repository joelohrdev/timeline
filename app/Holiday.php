<?php

namespace App;

enum Holiday: string
{
    case NewYearsDay = 'new_years_day';
    case ValentinesDay = 'valentines_day';
    case StPatricksDay = 'st_patricks_day';
    case Easter = 'easter';
    case MothersDay = 'mothers_day';
    case MemorialDay = 'memorial_day';
    case FathersDay = 'fathers_day';
    case IndependenceDay = 'independence_day';
    case LaborDay = 'labor_day';
    case Halloween = 'halloween';
    case Thanksgiving = 'thanksgiving';
    case Christmas = 'christmas';
    case NewYearsEve = 'new_years_eve';

    /**
     * Human-readable name for the holiday picker and timeline badge.
     */
    public function label(): string
    {
        return match ($this) {
            self::NewYearsDay => "New Year's Day",
            self::ValentinesDay => "Valentine's Day",
            self::StPatricksDay => "St. Patrick's Day",
            self::Easter => 'Easter',
            self::MothersDay => "Mother's Day",
            self::MemorialDay => 'Memorial Day',
            self::FathersDay => "Father's Day",
            self::IndependenceDay => '4th of July',
            self::LaborDay => 'Labor Day',
            self::Halloween => 'Halloween',
            self::Thanksgiving => 'Thanksgiving',
            self::Christmas => 'Christmas',
            self::NewYearsEve => "New Year's Eve",
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $holiday): array => ['value' => $holiday->value, 'label' => $holiday->label()],
            self::cases(),
        );
    }
}
