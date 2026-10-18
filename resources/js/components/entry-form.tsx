import { Form, router } from '@inertiajs/react';
import type { FormComponentRef } from '@inertiajs/core';
import { ImagePlus, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { photoTakenDate } from '@/lib/photo-date';
import { isRawPhoto, rawPhotoToJpeg } from '@/lib/raw-photo';
import { cn } from '@/lib/utils';
import { destroy as destroyImage } from '@/routes/entries/images';
import type { Entry } from '@/types';
import type { RouteFormDefinition } from '@/wayfinder';

export type PostedEvent = {
    id: number;
    label: string;
};

type ChosenPhoto = {
    file: File;
    url: string;
};

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

    const addFiles = async (files: FileList | null) => {
        const added = Array.from(files ?? []);
        const isFirstPick = chosenRef.current.length === 0;

        if (fileInput.current) {
            fileInput.current.value = '';
        }

        setRawError(null);

        if (!entry && isFirstPick) {
            void setDateFromFirstPhoto(added);
        }

        const raw = added.filter(isRawPhoto);

        if (raw.length > 0) {
            setPreparingRaw(true);
        }

        const prepared: File[] = [];
        const unreadable: string[] = [];

        for (const file of added) {
            if (!isRawPhoto(file)) {
                prepared.push(file);
                continue;
            }

            const jpeg = await rawPhotoToJpeg(file);

            if (jpeg) {
                prepared.push(jpeg);
            } else {
                unreadable.push(file.name);
            }
        }

        setPreparingRaw(false);

        if (unreadable.length > 0) {
            setRawError(
                `Couldn't read ${unreadable.join(', ')}. Export ${unreadable.length === 1 ? 'it' : 'them'} as JPEG or HEIC and try again.`,
            );
        }

        updateChosen([
            ...chosenRef.current,
            ...prepared.map((file) => ({
                file,
                url: URL.createObjectURL(file),
            })),
        ]);
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
     * On a new entry, use the day the first dated photo was taken.
     */
    const setDateFromFirstPhoto = async (selected: File[]) => {
        const selection = ++latestSelection.current;

        for (const file of selected) {
            const taken = await photoTakenDate(file);

            if (selection !== latestSelection.current) {
                return;
            }

            if (taken) {
                setDate(taken);
                setDateFromPhoto(taken);

                return;
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
            { images: chosenRef.current.map((photo) => photo.file) },
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
                                        />
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
                            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input px-4 py-8 text-sm text-muted-foreground hover:border-ring hover:text-foreground"
                        >
                            <ImagePlus className="size-5" />
                            <span>
                                {photoCount > 0
                                    ? 'Add more photos'
                                    : 'Choose photos'}
                            </span>
                            <span className="text-xs">
                                JPG, PNG, WebP, HEIC or ProRAW, saved as WebP
                            </span>
                        </label>
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

                        {preparingRaw && (
                            <p className="text-sm text-muted-foreground">
                                Preparing RAW photos…
                            </p>
                        )}
                        <InputError message={rawError ?? undefined} />
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

                    <Button type="submit" disabled={processing}>
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

function CoverTile({
    src,
    isCover,
    onSelect,
}: {
    src: string;
    isCover: boolean;
    onSelect: () => void;
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
                className="aspect-square w-full object-cover"
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
