import { Head, router } from '@inertiajs/react';
import EntryController from '@/actions/App/Http/Controllers/EntryController';
import type { CategoryOptions } from '@/components/category-fields';
import { EntryForm } from '@/components/entry-form';
import { Button } from '@/components/ui/button';
import type { Entry } from '@/types';

export default function EditEntry({
    entry,
    categories,
    holidays,
}: CategoryOptions & { entry: Entry }) {
    const deleteEntry = () => {
        if (window.confirm('Delete this entry and all of its photos?')) {
            router.delete(EntryController.destroy(entry.id));
        }
    };

    return (
        <div className="max-w-xl">
            <Head title="Edit entry" />
            <h1 className="mb-8 font-display text-4xl tracking-tight">
                Edit entry
            </h1>
            <EntryForm
                form={EntryController.update.form(entry.id)}
                entry={entry}
                defaultDate={entry.date}
                categories={categories}
                holidays={holidays}
                submitLabel="Save changes"
            />
            <div className="mt-12 border-t pt-6">
                <Button variant="destructive" size="sm" onClick={deleteEntry}>
                    Delete entry
                </Button>
            </div>
        </div>
    );
}
