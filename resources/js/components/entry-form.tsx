import { Form, router } from '@inertiajs/react';
import type { FormComponentRef } from '@inertiajs/core';
import { ImagePlus, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePhotoDrop } from '@/hooks/use-photo-drop';
import { CategoryFields } from '@/components/category-fields';
import type { CategoryOptions } from '@/components/category-fields';
import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import { RichTextEditor } from '@/components/rich-text-editor';
import EntryImageController from '@/actions/App/Http/Controllers/EntryImageController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseEntryDate } from '@/lib/dates';
import { photoLocation, photoTakenAt } from '@/lib/photo-date';
import type { PhotoLocation } from '@/lib/photo-date';
import { photoFingerprint } from '@/lib/photo-fingerprint';
import { postJson } from '@/lib/post-json';
import { isRawPhoto, rawPhotoToJpeg } from '@/lib/raw-photo';
import { cn } from '@/lib/utils';
import { destroy as destroyImage } from '@/routes/entries/images';
import { check as checkPhotos } from '@/routes/photos';
import { lookup as lookUpPlace } from '@/routes/places';
import type { Entry } from '@/types';
import type { RouteFormDefinition } from '@/wayfinder';

export type PostedEvent = {
    id: number;
    label: string;
};

type DuplicateOf = {
    entry_id: number;
    date: string;
    label: string;
};

/** The most photos one event can hold, matching the server's validation. */
const MaxPhotos = 10;

type ChosenPhoto = {
    file: File;
    url: string;
    fingerprint: string;
    takenDate: string | null;
    /** The exact moment taken, only when it includes fractions of a second (so it identifies the photo). */
    takenKey: string | null;
    /** When it was taken ("YYYY:MM:DD HH:MM:SS"), used to order a day's events. */
    takenStamp: string | null;
    duplicateOf: DuplicateOf | null;
};

function shortDay(date: string, reference: string): string {
    const day = parseEntryDate(date);

    return day.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        ...(date.slice(0, 4) !== reference.slice(0, 4)
            ? { year: 'numeric' }
            : {}),
    });
}

type Props = CategoryOptions & {
    form: RouteFormDefinition<'post'>;
    entry?: Entry;
    defaultDate: string;
    submitLabel: string;
    postedDays?: Record<string, PostedEvent[]>;
};

export function EntryForm({
    form,
    entry,
    defaultDate,
    submitLabel,
    categories,
    holidays,
    postedDays = {},
}: Props) {
    const [chosen, setChosen] = useState<ChosenPhoto[]>([]);
    const chosenRef = useRef<ChosenPhoto[]>([]);
    const fileInput = useRef<HTMLInputElement>(null);
    const [cover, setCover] = useState<string | null>(null);
    const [date, setDate] = useState(entry?.date ?? defaultDate);
    const [dateFromPhoto, setDateFromPhoto] = useState<string | null>(null);
    const [location, setLocation] = useState({
        place: entry?.location_place ?? '',
        city: entry?.location_city ?? '',
        state: entry?.location_state ?? '',
    });
    const [locationFromPhoto, setLocationFromPhoto] = useState(false);
    const latestSelection = useRef(0);
    const [preparingRaw, setPreparingRaw] = useState(false);
    const [rawError, setRawError] = useState<string | null>(null);
    const [askAboutDay, setAskAboutDay] = useState<string | null>(null);
    const formRef = useRef<FormComponentRef>(null);
    // Set when the poster chose "Post as a new event", so the resubmit isn't paused again.
    const postAsNewEvent = useRef(false);
    const [addingToExisting, setAddingToExisting] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const eventsThatDay = entry ? [] : (postedDays[date] ?? []);
    const existingImages = entry?.images ?? [];
    const effectiveCover =
        cover ??
        (existingImages[0]
            ? `image:${existingImages[0].id}`
            : chosen.length > 0
              ? 'upload:0'
              : null);
    const photoCount = existingImages.length + chosen.length;
    const duplicateCount = chosen.filter((photo) => photo.duplicateOf).length;
    const photosOverLimit = Math.max(0, photoCount - MaxPhotos);
    const photoDrop = usePhotoDrop((photos) => void addFiles(photos));

    useEffect(() => {
        return () =>
            chosenRef.current.forEach((photo) =>
                URL.revokeObjectURL(photo.url),
            );
    }, []);

    /**
     * Keep the chosen photos in state and mirror them into the file input the form submits.
     */
    const updateChosen = (next: ChosenPhoto[]) => {
        const transfer = new DataTransfer();
        next.forEach((photo) => transfer.items.add(photo.file));

        if (fileInput.current) {
            fileInput.current.files = transfer.files;
        }

        chosenRef.current = next;
        setChosen(next);
    };

    const addFiles = async (files: FileList | File[] | null) => {
        const added = Array.from(files ?? []);
        const isFirstPick = chosenRef.current.length === 0;
        const selection = ++latestSelection.current;

        if (fileInput.current) {
            fileInput.current.value = '';
        }

        setRawError(null);

        if (added.some(isRawPhoto)) {
            setPreparingRaw(true);
        }

        const prepared: ChosenPhoto[] = [];
        const unreadable: string[] = [];

        for (const file of added) {
            // Fingerprint and taken time come from the original file, before any RAW conversion.
            const [taken, fingerprint] = await Promise.all([
                photoTakenAt(file),
                photoFingerprint(file),
            ]);
            const upload = isRawPhoto(file) ? await rawPhotoToJpeg(file) : file;

            if (!upload) {
                unreadable.push(file.name);
                continue;
            }

            prepared.push({
                file: upload,
                url: URL.createObjectURL(upload),
                fingerprint,
                takenDate: taken?.date ?? null,
                takenKey: taken?.key.includes('.') ? taken.key : null,
                takenStamp: taken?.key ?? null,
                duplicateOf: null,
            });
        }

        setPreparingRaw(false);

        if (unreadable.length > 0) {
            setRawError(
                `Couldn't read ${unreadable.join(', ')}. Export ${unreadable.length === 1 ? 'it' : 'them'} as JPEG or HEIC and try again.`,
            );
        }

        updateChosen([...chosenRef.current, ...prepared]);

        const firstDated = prepared.find((photo) => photo.takenDate)?.takenDate;

        if (
            !entry &&
            isFirstPick &&
            firstDated &&
            selection === latestSelection.current
        ) {
            setDate(firstDated);
            setDateFromPhoto(firstDated);
        }

        void markAlreadyUploaded(prepared);
        void fillLocationFrom(added);
    };

    /**
     * Ask the server which of these photos are already on the timeline, and mark them.
     */
    const markAlreadyUploaded = async (photos: ChosenPhoto[]) => {
        if (photos.length === 0) {
            return;
        }

        const result = await postJson<{
            matches: (DuplicateOf & { index: number })[];
        }>(checkPhotos.url(), {
            photos: photos.map((photo) => ({
                fingerprint: photo.fingerprint,
                taken_key: photo.takenKey,
            })),
        });
        const byUrl = new Map(
            (result?.matches ?? []).map((match) => [
                photos[match.index]?.url,
                match,
            ]),
        );

        if (byUrl.size > 0) {
            updateChosen(
                chosenRef.current.map((photo) => {
                    const match = byUrl.get(photo.url);

                    return match
                        ? {
                              ...photo,
                              duplicateOf: {
                                  entry_id: match.entry_id,
                                  date: match.date,
                                  label: match.label,
                              },
                          }
                        : photo;
                }),
            );
        }
    };

    /**
     * Fill any empty location fields from the first chosen photo that has GPS coordinates.
     */
    const fillLocationFrom = async (files: File[]) => {
        if (location.place && location.city && location.state) {
            return;
        }

        let coordinates: PhotoLocation | null = null;

        for (const file of files) {
            coordinates = await photoLocation(file);

            if (coordinates) {
                break;
            }
        }

        if (!coordinates) {
            return;
        }

        const found = await postJson<{
            place: string | null;
            city: string | null;
            state: string | null;
        }>(lookUpPlace.url(), coordinates);

        if (!found || (!found.place && !found.city && !found.state)) {
            return;
        }

        setLocation((current) => ({
            place: current.place || found.place || '',
            city: current.city || found.city || '',
            state: current.state || found.state || '',
        }));
        setLocationFromPhoto(true);
    };

    const removeAlreadyUploaded = () => {
        chosenRef.current
            .filter((photo) => photo.duplicateOf)
            .forEach((photo) => URL.revokeObjectURL(photo.url));
        updateChosen(chosenRef.current.filter((photo) => !photo.duplicateOf));
        setCover(null);
    };

    const removeChosen = (index: number) => {
        URL.revokeObjectURL(chosen[index].url);
        updateChosen(chosen.filter((_, position) => position !== index));

        if (cover === `upload:${index}`) {
            setCover(null);
        } else if (cover?.startsWith('upload:')) {
            const coverIndex = Number(cover.slice('upload:'.length));

            if (coverIndex > index) {
                setCover(`upload:${coverIndex - 1}`);
            }
        }
    };

    /**
     * Send the chosen photos to the post already on this day instead of creating a new one.
     */
    const addToExistingPost = (entryId: number) => {
        setAddError(null);
        router.post(
            EntryImageController.store.url(entryId),
            {
                images: chosenRef.current.map((photo) => photo.file),
                fingerprints: chosenRef.current.map(
                    (photo) => photo.fingerprint,
                ),
                taken_keys: chosenRef.current.map(
                    (photo) => photo.takenKey ?? '',
                ),
                taken_times: chosenRef.current.map(
                    (photo) => photo.takenStamp ?? '',
                ),
            },
            {
                forceFormData: true,
                onStart: () => setAddingToExisting(true),
                onFinish: () => setAddingToExisting(false),
                onError: (errors) =>
                    setAddError(Object.values(errors)[0] ?? null),
                onSuccess: () => setAskAboutDay(null),
            },
        );
    };

    const removeImage = (imageId: number) => {
        if (!entry || !window.confirm('Remove this photo from the entry?')) {
            return;
        }

        if (cover === `image:${imageId}`) {
            setCover(null);
        }

        router.delete(destroyImage({ entry: entry.id, image: imageId }), {
            preserveScroll: true,
        });
    };

    return (
        <Form
            {...form}
            ref={formRef}
            options={{ preserveScroll: 'errors' }}
            onBefore={() => {
                if (photosOverLimit > 0) {
                    return false;
                }

                if (
                    eventsThatDay.length > 0 &&
                    chosenRef.current.length > 0 &&
                    !postAsNewEvent.current
                ) {
                    setAskAboutDay(date);

                    return false;
                }

                postAsNewEvent.current = false;
            }}
            onSuccess={() => {
                chosenRef.current.forEach((photo) =>
                    URL.revokeObjectURL(photo.url),
                );
                updateChosen([]);
                setCover(null);
            }}
            className="space-y-6"
        >
            {({ processing, progress, errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="date">Day</Label>
                        <DatePicker
                            id="date"
                            name="date"
                            value={date}
                            onChange={setDate}
                            invalid={Boolean(errors.date)}
                        />
                        {dateFromPhoto === date && (
                            <p className="text-sm text-muted-foreground">
                                Set from when your photo was taken.
                            </p>
                        )}
                        <InputError message={addError ?? undefined} />
                        <InputError message={errors.date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="title">
                            Title{' '}
                            <span className="font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            defaultValue={entry?.title ?? ''}
                            placeholder="Dinner at Grandma's"
                            maxLength={120}
                            aria-invalid={Boolean(errors.title)}
                        />
                        <InputError message={errors.title} />
                    </div>

                    <fieldset className="grid gap-2">
                        <legend className="mb-2 text-sm leading-none font-medium">
                            Location{' '}
                            <span className="font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </legend>
                        <Input
                            name="location_place"
                            aria-label="Place"
                            placeholder="Place, like Wrigley Field"
                            maxLength={120}
                            value={location.place}
                            onChange={(event) =>
                                setLocation({
                                    ...location,
                                    place: event.target.value,
                                })
                            }
                            aria-invalid={Boolean(errors.location_place)}
                        />
                        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                            <Input
                                name="location_city"
                                aria-label="City"
                                placeholder="City"
                                maxLength={120}
                                value={location.city}
                                onChange={(event) =>
                                    setLocation({
                                        ...location,
                                        city: event.target.value,
                                    })
                                }
                                aria-invalid={Boolean(errors.location_city)}
                            />
                            <Input
                                name="location_state"
                                aria-label="State"
                                placeholder="State"
                                maxLength={60}
                                value={location.state}
                                onChange={(event) =>
                                    setLocation({
                                        ...location,
                                        state: event.target.value,
                                    })
                                }
                                aria-invalid={Boolean(errors.location_state)}
                            />
                        </div>
                        {locationFromPhoto && (
                            <p className="text-sm text-muted-foreground">
                                Filled in from your photo's location.
                            </p>
                        )}
                        <InputError
                            message={
                                errors.location_place ??
                                errors.location_city ??
                                errors.location_state
                            }
                        />
                    </fieldset>

                    <CategoryFields
                        categories={categories}
                        holidays={holidays}
                        entry={entry}
                        errors={errors}
                    />

                    <div className="grid gap-2">
                        <Label htmlFor="body">What happened</Label>
                        <RichTextEditor
                            id="body"
                            name="body"
                            defaultValue={entry?.body ?? ''}
                            invalid={Boolean(errors.body)}
                        />
                        <InputError message={errors.body} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="images">Photos</Label>

                        {duplicateCount > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                                <span>
                                    {duplicateCount === chosen.length
                                        ? duplicateCount === 1
                                            ? 'This photo is already on your timeline.'
                                            : `All ${duplicateCount} photos are already on your timeline.`
                                        : `${duplicateCount} of ${chosen.length} photos are already on your timeline.`}
                                </span>
                                <button
                                    type="button"
                                    onClick={removeAlreadyUploaded}
                                    className="font-medium underline underline-offset-4 hover:no-underline"
                                >
                                    {duplicateCount === 1
                                        ? 'Remove it'
                                        : `Remove those ${duplicateCount}`}
                                </button>
                            </div>
                        )}

                        {photoCount > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {existingImages.map((image) => (
                                    <div key={image.id} className="relative">
                                        <CoverTile
                                            src={image.thumb_url}
                                            isCover={
                                                effectiveCover ===
                                                `image:${image.id}`
                                            }
                                            onSelect={() =>
                                                setCover(`image:${image.id}`)
                                            }
                                        />
                                        <RemovePhotoButton
                                            onRemove={() =>
                                                removeImage(image.id)
                                            }
                                        />
                                    </div>
                                ))}
                                {chosen.map((photo, index) => (
                                    <div key={photo.url} className="relative">
                                        <CoverTile
                                            src={photo.url}
                                            isCover={
                                                effectiveCover ===
                                                `upload:${index}`
                                            }
                                            onSelect={() =>
                                                setCover(`upload:${index}`)
                                            }
                                            dimmed={photo.duplicateOf !== null}
                                        />
                                        <PhotoChip photo={photo} day={date} />
                                        <RemovePhotoButton
                                            onRemove={() => removeChosen(index)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {photoCount > 1 && (
                            <p className="text-sm text-muted-foreground">
                                Tap a photo to make it the cover.
                            </p>
                        )}
                        <input type="hidden" name="cover" value={cover ?? ''} />

                        <label
                            htmlFor="images"
                            {...photoDrop.dropProps}
                            className={cn(
                                'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground',
                                photoDrop.isDragging &&
                                    'border-ring bg-muted text-foreground',
                            )}
                        >
                            <ImagePlus className="size-5" />
                            <span>
                                {photoDrop.isDragging
                                    ? 'Drop photos to add them'
                                    : photoCount > 0
                                      ? 'Add more photos'
                                      : 'Choose or drop photos'}
                            </span>
                            <span className="text-xs">
                                Up to {MaxPhotos} · JPG, PNG, WebP, HEIC or
                                ProRAW, saved as WebP
                            </span>
                        </label>
                        {photoDrop.ignored > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {photoDrop.ignored === 1
                                    ? 'Skipped 1 file that isn’t a photo.'
                                    : `Skipped ${photoDrop.ignored} files that aren’t photos.`}
                            </p>
                        )}
                        <input
                            ref={fileInput}
                            id="images"
                            type="file"
                            name="images[]"
                            multiple
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/x-adobe-dng,image/dng,.heic,.heif,.dng"
                            onChange={(event) =>
                                void addFiles(event.target.files)
                            }
                            className="sr-only"
                        />
                        {chosen.map((photo) => (
                            <span key={photo.url} hidden>
                                <input
                                    type="hidden"
                                    name="fingerprints[]"
                                    value={photo.fingerprint}
                                />
                                <input
                                    type="hidden"
                                    name="taken_keys[]"
                                    value={photo.takenKey ?? ''}
                                />
                                <input
                                    type="hidden"
                                    name="taken_times[]"
                                    value={photo.takenStamp ?? ''}
                                />
                            </span>
                        ))}

                        {preparingRaw && (
                            <p className="text-sm text-muted-foreground">
                                Preparing RAW photos…
                            </p>
                        )}
                        <InputError message={rawError ?? undefined} />
                        <InputError
                            message={
                                photosOverLimit > 0
                                    ? `An event can hold up to ${MaxPhotos} photos. Remove ${photosOverLimit === 1 ? '1 photo' : `${photosOverLimit} photos`} to save.`
                                    : undefined
                            }
                        />
                        <InputError message={errors.images} />
                        <InputError message={errors.cover} />
                        {Object.entries(errors)
                            .filter(([key]) => key.startsWith('images.'))
                            .slice(0, 1)
                            .map(([key, message]) => (
                                <InputError key={key} message={message} />
                            ))}
                    </div>

                    {progress && (
                        <progress
                            value={progress.percentage}
                            max="100"
                            className="h-1 w-full overflow-hidden rounded-full"
                        />
                    )}

                    <Button
                        type="submit"
                        disabled={processing || photosOverLimit > 0}
                    >
                        {processing ? 'Saving…' : submitLabel}
                    </Button>

                    <Dialog
                        open={askAboutDay !== null}
                        onOpenChange={(open) => !open && setAskAboutDay(null)}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {(askAboutDay
                                        ? postedDays[askAboutDay]?.length
                                        : 0) === 1
                                        ? 'You already have an event on '
                                        : 'You already have events on '}
                                    {askAboutDay &&
                                        parseEntryDate(
                                            askAboutDay,
                                        ).toLocaleDateString(undefined, {
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                </DialogTitle>
                                <DialogDescription>
                                    Add these photos to an event that's already
                                    there, or post this as a new event on the
                                    same day. Adding keeps that event's text,
                                    category and cover; anything else on this
                                    form won't be saved.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-2">
                                {(askAboutDay
                                    ? (postedDays[askAboutDay] ?? [])
                                    : []
                                ).map((event) => (
                                    <Button
                                        key={event.id}
                                        type="button"
                                        variant="outline"
                                        disabled={addingToExisting}
                                        onClick={() =>
                                            addToExistingPost(event.id)
                                        }
                                        className="justify-start"
                                    >
                                        Add to {event.label}
                                    </Button>
                                ))}
                            </div>
                            <InputError message={addError ?? undefined} />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setAskAboutDay(null);
                                        postAsNewEvent.current = true;
                                        formRef.current?.submit();
                                    }}
                                >
                                    Post as a new event
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </Form>
    );
}

/**
 * When the photo was taken, or that it's already on the timeline. Amber when it's from a different day than the entry.
 */
function PhotoChip({ photo, day }: { photo: ChosenPhoto; day: string }) {
    const chip =
        'pointer-events-none absolute top-1 left-1 rounded-full px-1.5 py-0.5 text-[11px] leading-none font-medium';

    if (photo.duplicateOf) {
        return (
            <span className={cn(chip, 'bg-foreground text-background')}>
                Already on {shortDay(photo.duplicateOf.date, day)}
            </span>
        );
    }

    if (!photo.takenDate) {
        return (
            <span className={cn(chip, 'bg-black/60 text-white')}>No date</span>
        );
    }

    return (
        <span
            className={cn(
                chip,
                photo.takenDate === day
                    ? 'bg-black/60 text-white'
                    : 'bg-amber-400 text-amber-950',
            )}
            title={
                photo.takenDate === day
                    ? undefined
                    : 'Taken on a different day than this entry'
            }
        >
            {shortDay(photo.takenDate, day)}
        </span>
    );
}

function CoverTile({
    src,
    isCover,
    onSelect,
    dimmed = false,
}: {
    src: string;
    isCover: boolean;
    onSelect: () => void;
    dimmed?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={isCover}
            aria-label={isCover ? 'Cover photo' : 'Make this the cover photo'}
            className={cn(
                'relative block w-full cursor-pointer overflow-hidden rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                isCover &&
                    'ring-2 ring-foreground ring-offset-2 ring-offset-background',
            )}
        >
            <img
                src={src}
                alt=""
                className={cn(
                    'aspect-square w-full object-cover',
                    dimmed && 'opacity-45 grayscale',
                )}
            />
            {isCover && (
                <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
                    <Star className="size-3 fill-current" />
                    Cover
                </span>
            )}
        </button>
    );
}

function RemovePhotoButton({ onRemove }: { onRemove: () => void }) {
    return (
        <button
            type="button"
            onClick={onRemove}
            aria-label="Remove photo"
            className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            <X className="size-4" />
        </button>
    );
}
