import { CalendarDays, Rows3 } from 'lucide-react';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type TimelineView = 'calendar' | 'timeline';

const storageKey = 'lohrline:view';

function storedView(): TimelineView {
    try {
        return window.localStorage.getItem(storageKey) === 'timeline'
            ? 'timeline'
            : 'calendar';
    } catch {
        return 'calendar';
    }
}

/**
 * The visitor's preferred view, remembered in this browser only.
 */
export function useTimelineView(): [
    TimelineView,
    (view: TimelineView) => void,
] {
    const [view, setView] = useState<TimelineView>(storedView);

    const choose = (next: TimelineView) => {
        setView(next);

        try {
            window.localStorage.setItem(storageKey, next);
        } catch {
            // Private browsing or blocked storage: the choice just won't be remembered.
        }
    };

    return [view, choose];
}

export function ViewToggle({
    view,
    onChange,
}: {
    view: TimelineView;
    onChange: (view: TimelineView) => void;
}) {
    return (
        <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={view}
            onValueChange={(value) => value && onChange(value as TimelineView)}
            aria-label="View"
        >
            <ToggleGroupItem
                value="calendar"
                aria-label="Calendar view"
                className="gap-1.5 px-2.5"
            >
                <CalendarDays />
                <span className="hidden sm:inline">Calendar</span>
            </ToggleGroupItem>
            <ToggleGroupItem
                value="timeline"
                aria-label="Timeline view"
                className="gap-1.5 px-2.5"
            >
                <Rows3 />
                <span className="hidden sm:inline">Timeline</span>
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
