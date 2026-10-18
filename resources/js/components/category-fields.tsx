import { useState } from 'react';
import { categoryIcons, FireworksIcon } from '@/components/category-icons';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Entry, EntryCategory, Holiday, SelectOption } from '@/types';

export type CategoryOptions = {
    categories: SelectOption<EntryCategory>[];
    holidays: SelectOption<Holiday>[];
};

type Props = CategoryOptions & {
    entry?: Entry;
    errors: Record<string, string>;
};

const noCategory = 'none';

/**
 * The illustration for a category or holiday choice in the pickers.
 */
function OptionIcon({ name }: { name: string }) {
    const Icon =
        name === 'holiday' ? FireworksIcon : (categoryIcons[name] ?? null);

    return Icon ? <Icon className="size-5" /> : null;
}

export function CategoryFields({ categories, holidays, entry, errors }: Props) {
    const [category, setCategory] = useState<EntryCategory | ''>(
        entry?.category ?? '',
    );
    const [holiday, setHoliday] = useState<Holiday | ''>(
        entry?.details?.holiday ?? '',
    );
    const details = entry?.details ?? {};

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                    value={category || noCategory}
                    onValueChange={(value) =>
                        setCategory(
                            value === noCategory
                                ? ''
                                : (value as EntryCategory),
                        )
                    }
                >
                    <SelectTrigger
                        id="category"
                        className="w-60"
                        aria-invalid={Boolean(errors.category)}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={noCategory}>None</SelectItem>
                        {categories.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                <OptionIcon name={option.value} />
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <input type="hidden" name="category" value={category} />
                <InputError message={errors.category} />
            </div>

            {category === 'holiday' && (
                <div className="grid gap-2">
                    <Label htmlFor="holiday">Holiday</Label>
                    <Select
                        value={holiday}
                        onValueChange={(value) => setHoliday(value as Holiday)}
                    >
                        <SelectTrigger
                            id="holiday"
                            className="w-60"
                            aria-invalid={Boolean(errors['details.holiday'])}
                        >
                            <SelectValue placeholder="Choose a holiday" />
                        </SelectTrigger>
                        <SelectContent>
                            {holidays.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <OptionIcon name={option.value} />
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <input
                        type="hidden"
                        name="details[holiday]"
                        value={holiday}
                    />
                    <InputError message={errors['details.holiday']} />
                </div>
            )}

            {category === 'birthday' && (
                <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="birthday-name">Whose birthday</Label>
                        <Input
                            id="birthday-name"
                            name="details[name]"
                            defaultValue={details.name ?? ''}
                            placeholder="Emma"
                            aria-invalid={Boolean(errors['details.name'])}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="birthday-age">Turning</Label>
                        <Input
                            id="birthday-age"
                            name="details[age]"
                            type="number"
                            min={0}
                            max={130}
                            defaultValue={details.age ?? ''}
                            placeholder="7"
                            aria-invalid={Boolean(errors['details.age'])}
                        />
                    </div>
                    <InputError
                        className="col-span-2"
                        message={
                            errors['details.name'] ?? errors['details.age']
                        }
                    />
                </div>
            )}

            {category === 'baseball_game' && (
                <div className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="game-opponent">Opponent</Label>
                        <Input
                            id="game-opponent"
                            name="details[opponent]"
                            defaultValue={details.opponent ?? ''}
                            placeholder="Tigers"
                            aria-invalid={Boolean(errors['details.opponent'])}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="game-our-score">Us</Label>
                        <Input
                            id="game-our-score"
                            name="details[our_score]"
                            type="number"
                            min={0}
                            max={99}
                            defaultValue={details.our_score ?? ''}
                            aria-invalid={Boolean(errors['details.our_score'])}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="game-their-score">Them</Label>
                        <Input
                            id="game-their-score"
                            name="details[their_score]"
                            type="number"
                            min={0}
                            max={99}
                            defaultValue={details.their_score ?? ''}
                            aria-invalid={Boolean(
                                errors['details.their_score'],
                            )}
                        />
                    </div>
                    <InputError
                        className="col-span-3"
                        message={
                            errors['details.opponent'] ??
                            errors['details.our_score'] ??
                            errors['details.their_score']
                        }
                    />
                </div>
            )}
        </div>
    );
}
