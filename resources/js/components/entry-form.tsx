import { Form, router } from '@inertiajs/react';
import { ImagePlus, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CategoryFields } from '@/components/category-fields';
import type { CategoryOptions } from '@/components/category-fields';
import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { photoTakenDate } from '@/lib/photo-date';
import { cn } from '@/lib/utils';
import { destroy as destroyImage } from '@/routes/entries/images';
import type { Entry } from '@/types';
import type { RouteFormDefinition } from '@/wayfinder';

type ChosenPhoto = {
    file: File;
    url: string;
};

type Props = CategoryOptions & {
    form: RouteFormDefinition<'post'>;
    entry?: Entry;
    defaultDate: string;
    submitLabel: string;
};

export function EntryForm({
    form,
    entry,
    defaultDate,
    submitLabel,
    categories,
    holidays,
}: Props) {
    const [chosen, setChosen] = useState<ChosenPhoto[]>([]);
    const chosenRef = useRef<ChosenPhoto[]>([]);
    const fileInput = useRef<HTMLInputElement>(null);
    const [cover, setCover] = useState<string | null>(null);
    const [date, setDate] = useState(entry?.date ?? defaultDate);
    const [dateFromPhoto, setDateFromPhoto] = useState<string | null>(null);
    const latestSelection = useRef(0);
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

    const addFiles = (files: FileList | null) => {
        const added = Array.from(files ?? []);

        updateChosen([
            ...chosenRef.current,
            ...added.map((file) => ({ file, url: URL.createObjectURL(file) })),
        ]);

        if (!entry && chosenRef.current.length === added.length) {
            void setDateFromFirstPhoto(added);
        }
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
            options={{ preserveScroll: 'errors' }}
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
                        <InputError message={errors.date} />
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
                                JPG, PNG or WebP · saved as WebP
                            </span>
                        </label>
                        <input
                            ref={fileInput}
                            id="images"
                            type="file"
                            name="images[]"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => addFiles(event.target.files)}
                            className="sr-only"
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

                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving…' : submitLabel}
                    </Button>
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
