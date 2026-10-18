export type EntryImage = {
    id: number;
    url: string;
    thumb_url: string;
    width: number;
    height: number;
    position: number;
};

export type Entry = {
    id: number;
    user_id: number;
    date: string;
    body: string | null;
    images: EntryImage[];
};

export type Paginated<T> = {
    data: T[];
};
