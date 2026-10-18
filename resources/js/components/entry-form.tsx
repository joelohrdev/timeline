import { Form, router } from '@inertiajs/react';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { destroy as destroyImage } from '@/routes/entries/images';
import type { Entry } from '@/types';
import type { RouteFormDefinition } from '@/wayfinder';

type Props = {
    form: RouteFormDefinition<'post'>;
    entry?: Entry;
    defaultDate: string;
    submitLabel: string;
};

export function EntryForm({ form, entry, defaultDate, submitLabel }: Props) {
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        return () => previews.forEach((url) => URL.revokeObjectURL(url));
    }, [previews]);

    const selectFiles = (files: FileList | null) => {
        setPreviews(
            Array.from(files ?? []).map((file) => URL.createObjectURL(file)),
        );
    };

    const removeImage = (imageId: number) => {
        if (!entry || !window.confirm('Remove this image?')) {
            return;
        }

        router.delete(destroyImage({ entry: entry.id, image: imageId }), {
            preserveScroll: true,
        });
    };

    return (
        <Form
            {...form}
            options={{ preserveScroll: 'errors' }}
            onSuccess={() => setPreviews([])}
            className="space-y-6"
        >
            {({ processing, progress, errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="date">Day</Label>
                        <DatePicker
                            id="date"
                            name="date"
                            defaultValue={entry?.date ?? defaultDate}
                            invalid={Boolean(errors.date)}
                        />
                        <InputError message={errors.date} />
                    </div>

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

                        {entry && entry.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {entry.images.map((image) => (
                                    <div key={image.id} className="relative">
                                        <img
                                            src={image.thumb_url}
                                            alt=""
                                            className="aspect-square w-full rounded-md object-cover"
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
                            </div>
                        )}

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

                        {previews.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {previews.map((url) => (
                                    <img
                                        key={url}
                                        src={url}
                                        alt=""
                                        className="aspect-square w-full rounded-md object-cover"
                                    />
                                ))}
                            </div>
                        )}

                        <InputError message={errors.images} />
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
