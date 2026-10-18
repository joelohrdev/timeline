import { Head } from '@inertiajs/react';
import EntryController from '@/actions/App/Http/Controllers/EntryController';
import type { CategoryOptions } from '@/components/category-fields';
import { EntryForm } from '@/components/entry-form';

export default function CreateEntry({
    today,
    categories,
    holidays,
}: CategoryOptions & { today: string }) {
    return (
        <>
            <Head title="New entry" />
            <h1 className="mb-8 text-lg font-medium">New entry</h1>
            <EntryForm
                form={EntryController.store.form()}
                defaultDate={today}
                categories={categories}
                holidays={holidays}
                submitLabel="Post entry"
            />
        </>
    );
}
