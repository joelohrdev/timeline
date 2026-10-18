import { Head, router } from '@inertiajs/react';
import EntryController from '@/actions/App/Http/Controllers/EntryController';
import { EntryForm } from '@/components/entry-form';
import { Button } from '@/components/ui/button';
import type { Entry } from '@/types';

export default function EditEntry({ entry }: { entry: Entry }) {
    const deleteEntry = () => {
        if (window.confirm('Delete this entry and all of its photos?')) {
            router.delete(EntryController.destroy(entry.id));
        }
    };

    return (
        <>
            <Head title="Edit entry" />
            <h1 className="mb-8 text-lg font-medium">Edit entry</h1>
            <EntryForm
                form={EntryController.update.form(entry.id)}
                entry={entry}
                defaultDate={entry.date}
                submitLabel="Save changes"
            />
            <div className="mt-12 border-t pt-6">
                <Button variant="destructive" size="sm" onClick={deleteEntry}>
                    Delete entry
                </Button>
            </div>
        </>
    );
}
