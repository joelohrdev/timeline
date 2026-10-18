export type EntryImage = {
    id: number;
    url: string;
    thumb_url: string;
    width: number;
    height: number;
    position: number;
};

export type EntryCategory = 'holiday' | 'birthday' | 'baseball_game';

export type Holiday =
    | 'new_years_day'
    | 'valentines_day'
    | 'st_patricks_day'
    | 'easter'
    | 'mothers_day'
    | 'memorial_day'
    | 'fathers_day'
    | 'independence_day'
    | 'labor_day'
    | 'halloween'
    | 'thanksgiving'
    | 'christmas'
    | 'new_years_eve';

export type EntryDetails = {
    holiday?: Holiday;
    name?: string;
    age?: number | null;
    opponent?: string;
    our_score?: number;
    their_score?: number;
};

export type SelectOption<T extends string = string> = {
    value: T;
    label: string;
};

export type Entry = {
    id: number;
    user_id: number;
    date: string;
    title: string | null;
    location_place: string | null;
    location_city: string | null;
    location_state: string | null;
    category: EntryCategory | null;
    details: EntryDetails | null;
    body: string | null;
    images: EntryImage[];
};

export type Paginated<T> = {
    data: T[];
};
