import { router } from '@inertiajs/react';
import { format, parseISO, startOfDay } from 'date-fns';
import { CalendarSearch } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { home } from '@/routes';

type Props = {
    firstDate: string | null;
    selected: string | null;
};

export function FindDay({ firstDate, selected }: Props) {
    const [open, setOpen] = useState(false);
    const today = startOfDay(new Date());
    const first = firstDate ? parseISO(firstDate) : today;
    const current = selected ? parseISO(selected) : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                    <CalendarSearch />
                    Find a day
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    mode="single"
                    selected={current}
                    defaultMonth={current ?? today}
                    startMonth={first}
                    endMonth={today}
                    disabled={[{ before: first }, { after: today }]}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                        if (!date) {
                            return;
                        }

                        setOpen(false);
                        router.get(
                            home({
                                query: { date: format(date, 'yyyy-MM-dd') },
                            }),
                        );
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
