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
    const [previews, setPreviews] = useState<string[]>([]);
    const [cover, setCover] = useState<string | null>(null);
    const [date, setDate] = useState(entry?.date ?? defaultDate);
    const [dateFromPhoto, setDateFromPhoto] = useState<string | null>(null);
    const latestSelection = useRef(0);
    const existingImages = entry?.images ?? [];
    const effectiveCover =
        cover ??
        (existingImages[0]
            ? `image:${existingImages[0].id}`
            : previews.length > 0
              ? 'upload:0'
              : null);
    const photoCount = existingImages.length + previews.length;

    useEffect(() => {
        return () => previews.forEach((url) => URL.revokeObjectURL(url));
    }, [previews]);

    const selectFiles = (files: FileList | null) => {
        if (cover?.startsWith('upload:')) {
            setCover(null);
        }

        const selected = Array.from(files ?? []);

        setPreviews(selected.map((file) => URL.createObjectURL(file)));

        if (!entry) {
            void setDateFromFirstPhoto(selected);
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
        if (!entry || !window.confirm('Remove this image?')) {
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
                setPreviews([]);
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
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeImage(image.id)
                                            }
                                            aria-label="Remove image"
                                            className="absolute top-1 right-1 rounded-full bg-background/90 p-1 text-foreground shadow-sm hover:bg-background"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {previews.map((url, index) => (
                                    <CoverTile
                                        key={url}
                                        src={url}
                                        isCover={
                                            effectiveCover === `upload:${index}`
                                        }
                                        onSelect={() =>
                                            setCover(`upload:${index}`)
                                        }
                                    />
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
                            <span>Choose photos</span>
                            <span className="text-xs">
                                JPG, PNG or WebP · saved as WebP
                            </span>
                        </label>
                        <input
                            id="images"
                            type="file"
                            name="images[]"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                                selectFiles(event.target.files)
                            }
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
