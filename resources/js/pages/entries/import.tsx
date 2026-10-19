import { Head, Link } from '@inertiajs/react';
import { Check, ImagePlus, Loader2, MapPin, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DatePicker } from '@/components/date-picker';
import type { PostedEvent } from '@/components/entry-form';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePhotoDrop } from '@/hooks/use-photo-drop';
import { parseEntryDate, todayKey } from '@/lib/dates';
import type { PhotoLocation } from '@/lib/photo-date';
import { postForm, postJson } from '@/lib/post-json';
import { readPhotoBatch } from '@/lib/read-photo';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { store as postDraft } from '@/routes/entries/import';
import { check as checkPhotos } from '@/routes/photos';
import { lookup as lookUpPlace } from '@/routes/places';

const PhotosPerEvent = 10;

type ImportPhoto = {
    url: string;
    file: File;
    fingerprint: string;
    takenDate: string | null;
    takenKey: string | null;
    takenStamp: string | null;
    gps: PhotoLocation | null;
};

type Status = 'ready' | 'posting' | 'posted' | 'failed';

type Draft = {
    id: string;
    date: string;
    undated: boolean;
    photos: ImportPhoto[];
    title: string;
    place: string;
    city: string;
    state: string;
    words: string;
    /** "new", or the id of an event already on that day to add the photos to. */
    target: string;
    status: Status;
    error: string | null;
};

/**
 * Plain text from the textarea as safe paragraphs for the post body.
 */
function wordsToHtml(words: string): string {
    const escape = (text: string) =>
        text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return words
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map(
            (paragraph) => `<p>${escape(paragraph).replace(/\n/g, '<br>')}</p>`,
        )
        .join('');
}

/**
 * One draft per day taken (undated photos together), newest day first, at most 10 photos each.
 */
function groupIntoDrafts(photos: ImportPhoto[]): Draft[] {
    const byDay = new Map<string, ImportPhoto[]>();

    for (const photo of photos) {
        const key = photo.takenDate ?? 'undated';
        byDay.set(key, [...(byDay.get(key) ?? []), photo]);
    }

    const days = [...byDay.keys()].sort((a, b) =>
        a === 'undated' ? 1 : b === 'undated' ? -1 : b.localeCompare(a),
    );

    return days.flatMap((day) => {
        const dayPhotos = (byDay.get(day) ?? []).sort((a, b) =>
            (a.takenStamp ?? '').localeCompare(b.takenStamp ?? ''),
        );
        const parts = Math.ceil(dayPhotos.length / PhotosPerEvent);

        return Array.from({ length: parts }, (_, part) => ({
            id: `${day}-${part}`,
            date: day === 'undated' ? todayKey() : day,
            undated: day === 'undated',
            photos: dayPhotos.slice(
                part * PhotosPerEvent,
                (part + 1) * PhotosPerEvent,
            ),
            title: parts > 1 ? `Part ${part + 1}` : '',
            place: '',
            city: '',
            state: '',
            words: '',
            target: 'new',
            status: 'ready' as Status,
            error: null,
        }));
    });
}

export default function ImportPhotos({
    postedDays,
}: {
    postedDays: Record<string, PostedEvent[]>;
}) {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [reading, setReading] = useState<{
        stage: 'reading' | 'checking';
        done: number;
        total: number;
    } | null>(null);
    // Between tapping "Choose photos" and the photos arriving: iCloud photos download to the phone first.
    const [waitingForPicker, setWaitingForPicker] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const [skipped, setSkipped] = useState({ duplicates: 0, unreadable: 0 });
    const [posting, setPosting] = useState(false);
    const urls = useRef<string[]>([]);
    const photoDrop = usePhotoDrop((photos) => void readPhotos(photos));

    useEffect(() => {
        return () => urls.current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    useEffect(() => {
        const input = fileInput.current;
        const stopWaiting = () => setWaitingForPicker(false);
        input?.addEventListener('cancel', stopWaiting);

        return () => input?.removeEventListener('cancel', stopWaiting);
    }, [drafts.length, reading]);

    const update = (id: string, changes: Partial<Draft>) =>
        setDrafts((current) =>
            current.map((draft) =>
                draft.id === id ? { ...draft, ...changes } : draft,
            ),
        );

    const readPhotos = async (files: FileList | File[] | null) => {
        const chosen = Array.from(files ?? []);

        if (chosen.length === 0) {
            return;
        }

        setWaitingForPicker(false);
        setReading({ stage: 'reading', done: 0, total: chosen.length });

        const results = await readPhotoBatch(chosen, (done) =>
            setReading({ stage: 'reading', done, total: chosen.length }),
        );
        const read: ImportPhoto[] = [];
        let unreadable = 0;

        for (const result of results) {
            if (!result) {
                unreadable++;
                continue;
            }

            const url = URL.createObjectURL(result.upload);
            urls.current.push(url);
            read.push({
                url,
                file: result.upload,
                fingerprint: result.fingerprint,
                takenDate: result.taken?.date ?? null,
                takenKey: result.taken?.key.includes('.')
                    ? result.taken.key
                    : null,
                takenStamp: result.taken?.key ?? null,
                gps: result.gps,
            });
        }

        setReading({ stage: 'checking', done: 0, total: read.length });

        const alreadyPosted = new Set<string>();

        for (let start = 0; start < read.length; start += 50) {
            const batch = read.slice(start, start + 50);
            const result = await postJson<{ matches: { index: number }[] }>(
                checkPhotos.url(),
                {
                    photos: batch.map((photo) => ({
                        fingerprint: photo.fingerprint,
                        taken_key: photo.takenKey,
                    })),
                },
            );

            for (const match of result?.matches ?? []) {
                alreadyPosted.add(batch[match.index].url);
            }
        }

        const fresh = read.filter((photo) => !alreadyPosted.has(photo.url));
        const next = groupIntoDrafts(fresh);

        setSkipped({ duplicates: alreadyPosted.size, unreadable });
        setDrafts(next);
        setReading(null);

        for (const draft of next) {
            const gps = draft.photos.find((photo) => photo.gps)?.gps;

            if (!gps) {
                continue;
            }

            const found = await postJson<{
                place: string | null;
                city: string | null;
                state: string | null;
            }>(lookUpPlace.url(), gps);

            if (found) {
                setDrafts((current) =>
                    current.map((item) =>
                        item.id === draft.id
                            ? {
                                  ...item,
                                  place: item.place || found.place || '',
                                  city: item.city || found.city || '',
                                  state: item.state || found.state || '',
                              }
                            : item,
                    ),
                );
            }
        }
    };

    const postAll = async () => {
        setPosting(true);

        for (const draft of drafts) {
            if (draft.status === 'posted' || draft.photos.length === 0) {
                continue;
            }

            if (draft.undated) {
                update(draft.id, {
                    status: 'failed',
                    error: 'Choose the day these photos are from first.',
                });
                continue;
            }

            update(draft.id, { status: 'posting', error: null });

            const data = new FormData();
            data.append('date', draft.date);

            if (draft.target !== 'new') {
                data.append('entry_id', draft.target);
            } else {
                data.append('title', draft.title);
                data.append('location_place', draft.place);
                data.append('location_city', draft.city);
                data.append('location_state', draft.state);
                data.append('body', wordsToHtml(draft.words));
            }

            for (const photo of draft.photos) {
                data.append('images[]', photo.file);
                data.append('fingerprints[]', photo.fingerprint);
                data.append('taken_keys[]', photo.takenKey ?? '');
                data.append('taken_times[]', photo.takenStamp ?? '');
            }

            const result = await postForm(postDraft.url(), data);

            update(draft.id, {
                status: result.ok ? 'posted' : 'failed',
                error: result.message,
            });
        }

        setPosting(false);
    };

    const remaining = drafts.filter(
        (draft) => draft.status !== 'posted' && draft.photos.length > 0,
    );
    const postedCount = drafts.filter(
        (draft) => draft.status === 'posted',
    ).length;
    const photoTotal = remaining.reduce(
        (total, draft) => total + draft.photos.length,
        0,
    );

    return (
        <div className="max-w-3xl">
            <Head title="Import photos" />
            <h1 className="font-display text-4xl tracking-tight">
                Import photos
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
                Choose a batch of photos. They're sorted into one event per day
                they were taken, photos already on your timeline are left out,
                and you can add a title or a few words before posting them all.
            </p>

            {drafts.length === 0 && !reading && (
                <label
                    htmlFor="import-photos"
                    {...photoDrop.dropProps}
                    className={cn(
                        'mt-8 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input px-4 py-12 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground',
                        photoDrop.isDragging &&
                            'border-ring bg-muted text-foreground',
                    )}
                >
                    <ImagePlus className="size-6" />
                    <span>
                        {photoDrop.isDragging
                            ? 'Drop photos to import them'
                            : 'Choose or drop photos'}
                    </span>
                    <span className="text-xs">
                        JPG, PNG, WebP, HEIC or ProRAW
                    </span>
                    <input
                        ref={fileInput}
                        id="import-photos"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/x-adobe-dng,image/dng,.heic,.heif,.dng"
                        onClick={() => setWaitingForPicker(true)}
                        onChange={(event) =>
                            void readPhotos(event.target.files)
                        }
                        className="sr-only"
                    />
                </label>
            )}

            {photoDrop.ignored > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                    {photoDrop.ignored === 1
                        ? 'Skipped 1 file that isn’t a photo.'
                        : `Skipped ${photoDrop.ignored} files that aren’t photos.`}
                </p>
            )}

            {waitingForPicker && !reading && (
                <div className="mt-4 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Waiting for your photos…
                    </p>
                    <p className="mt-1">
                        Photos stored in iCloud download to your phone first,
                        which can take a few minutes for a big batch.
                    </p>
                </div>
            )}

            {reading && (
                <p className="mt-8 flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {reading.stage === 'reading'
                        ? `Reading ${reading.done} of ${reading.total} photos…`
                        : 'Checking which photos are already on your timeline…'}
                </p>
            )}

            {(skipped.duplicates > 0 || skipped.unreadable > 0) && (
                <p className="mt-6 rounded-md bg-muted px-3 py-2 text-sm">
                    {skipped.duplicates > 0 &&
                        `${skipped.duplicates === 1 ? '1 photo is' : `${skipped.duplicates} photos are`} already on your timeline and ${skipped.duplicates === 1 ? 'was' : 'were'} left out. `}
                    {skipped.unreadable > 0 &&
                        `${skipped.unreadable === 1 ? '1 photo' : `${skipped.unreadable} photos`} couldn't be read; export ${skipped.unreadable === 1 ? 'it' : 'them'} as JPEG or HEIC.`}
                </p>
            )}

            {drafts.length > 0 && remaining.length === 0 && postedCount > 0 && (
                <div className="mt-8 rounded-md border px-4 py-5">
                    <p className="font-medium">
                        {postedCount === 1
                            ? '1 event posted.'
                            : `${postedCount} events posted.`}
                    </p>
                    <Button asChild className="mt-4">
                        <Link href={home()}>See the timeline</Link>
                    </Button>
                </div>
            )}

            <div className="mt-8 space-y-6">
                {drafts.map((draft) => (
                    <DraftCard
                        key={draft.id}
                        draft={draft}
                        existing={postedDays[draft.date] ?? []}
                        disabled={posting || draft.status === 'posted'}
                        onChange={(changes) => update(draft.id, changes)}
                        onRemove={() =>
                            setDrafts((current) =>
                                current.filter((item) => item.id !== draft.id),
                            )
                        }
                    />
                ))}
            </div>

            {remaining.length > 0 && (
                <div className="sticky bottom-0 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t bg-paper/95 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
                    <p className="text-sm text-muted-foreground">
                        {remaining.length === 1
                            ? `1 event, ${photoTotal} ${photoTotal === 1 ? 'photo' : 'photos'}`
                            : `${remaining.length} events, ${photoTotal} photos`}
                    </p>
                    <Button onClick={() => void postAll()} disabled={posting}>
                        {posting && <Loader2 className="animate-spin" />}
                        {posting
                            ? 'Posting…'
                            : remaining.some(
                                    (draft) => draft.status === 'failed',
                                )
                              ? 'Retry'
                              : remaining.length === 1
                                ? 'Post it'
                                : `Post all ${remaining.length}`}
                    </Button>
                </div>
            )}
        </div>
    );
}

function DraftCard({
    draft,
    existing,
    disabled,
    onChange,
    onRemove,
}: {
    draft: Draft;
    existing: PostedEvent[];
    disabled: boolean;
    onChange: (changes: Partial<Draft>) => void;
    onRemove: () => void;
}) {
    const addsToExisting = draft.target !== 'new';
    const location = [draft.place, draft.city, draft.state]
        .filter(Boolean)
        .join(', ');

    return (
        <section
            aria-label={parseEntryDate(draft.date).toLocaleDateString(
                undefined,
                {
                    dateStyle: 'long',
                },
            )}
            className={cn(
                'rounded-lg border p-4 sm:p-5',
                draft.status === 'posted' && 'opacity-60',
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <DatePicker
                    id={`date-${draft.id}`}
                    name="date"
                    value={draft.date}
                    onChange={(date) =>
                        onChange({ date, undated: false, target: 'new' })
                    }
                />
                <div className="flex items-center gap-3 text-sm">
                    {draft.status === 'posted' && (
                        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                            <Check className="size-4" /> Posted
                        </span>
                    )}
                    {draft.status === 'posting' && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" /> Posting
                        </span>
                    )}
                    {draft.status !== 'posted' && (
                        <button
                            type="button"
                            onClick={onRemove}
                            disabled={disabled}
                            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            Skip this day
                        </button>
                    )}
                </div>
            </div>

            {draft.undated && (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                    These photos have no date. Choose the day before posting.
                </p>
            )}

            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {draft.photos.map((photo) => (
                    <div key={photo.url} className="relative">
                        <img
                            src={photo.url}
                            alt=""
                            className="aspect-square w-full rounded-md object-cover"
                        />
                        {!disabled && draft.photos.length > 1 && (
                            <button
                                type="button"
                                aria-label="Leave this photo out"
                                onClick={() =>
                                    onChange({
                                        photos: draft.photos.filter(
                                            (item) => item.url !== photo.url,
                                        ),
                                    })
                                }
                                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-background/90 shadow-sm hover:bg-background"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {existing.length > 0 && (
                <div className="mt-4 grid gap-2">
                    <Label htmlFor={`target-${draft.id}`}>
                        This day already has{' '}
                        {existing.length === 1 ? 'an event' : 'events'}
                    </Label>
                    <select
                        id={`target-${draft.id}`}
                        value={draft.target}
                        disabled={disabled}
                        onChange={(event) =>
                            onChange({ target: event.target.value })
                        }
                        className="h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                    >
                        <option value="new">Post as a new event</option>
                        {existing.map((event) => (
                            <option key={event.id} value={String(event.id)}>
                                Add photos to {event.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {!addsToExisting && (
                <div className="mt-4 grid gap-3">
                    <Input
                        aria-label="Title"
                        placeholder="Title (optional)"
                        value={draft.title}
                        maxLength={120}
                        disabled={disabled}
                        onChange={(event) =>
                            onChange({ title: event.target.value })
                        }
                    />
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem] gap-2">
                        <Input
                            aria-label="Place"
                            placeholder="Place"
                            value={draft.place}
                            maxLength={120}
                            disabled={disabled}
                            onChange={(event) =>
                                onChange({ place: event.target.value })
                            }
                        />
                        <Input
                            aria-label="City"
                            placeholder="City"
                            value={draft.city}
                            maxLength={120}
                            disabled={disabled}
                            onChange={(event) =>
                                onChange({ city: event.target.value })
                            }
                        />
                        <Input
                            aria-label="State"
                            placeholder="State"
                            value={draft.state}
                            maxLength={60}
                            disabled={disabled}
                            onChange={(event) =>
                                onChange({ state: event.target.value })
                            }
                        />
                    </div>
                    {location && (
                        <p className="-mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3.5" /> {location}
                        </p>
                    )}
                    <textarea
                        aria-label="A few words"
                        placeholder="A few words (optional)"
                        rows={2}
                        value={draft.words}
                        disabled={disabled}
                        onChange={(event) =>
                            onChange({ words: event.target.value })
                        }
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                    />
                </div>
            )}

            <InputError message={draft.error ?? undefined} className="mt-3" />
        </section>
    );
}
