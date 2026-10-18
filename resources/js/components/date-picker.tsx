import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

type Props = {
    id: string;
    name: string;
    defaultValue: string;
    invalid?: boolean;
};

export function DatePicker({ id, name, defaultValue, invalid }: Props) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Date>(parseISO(defaultValue));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    aria-invalid={invalid}
                    className="w-60 justify-start font-normal"
                >
                    <CalendarIcon className="text-muted-foreground" />
                    {format(selected, 'EEEE, MMMM d, yyyy')}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    required
                    selected={selected}
                    defaultMonth={selected}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                        setSelected(date);
                        setOpen(false);
                    }}
                />
            </PopoverContent>
            <input
                type="hidden"
                name={name}
                value={format(selected, 'yyyy-MM-dd')}
            />
        </Popover>
    );
}
