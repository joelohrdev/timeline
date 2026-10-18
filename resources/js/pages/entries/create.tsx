import { Head } from '@inertiajs/react';
import EntryController from '@/actions/App/Http/Controllers/EntryController';
import type { CategoryOptions } from '@/components/category-fields';
import { EntryForm } from '@/components/entry-form';

export default function CreateEntry({
    today,
    postedDays,
    categories,
    holidays,
}: CategoryOptions & { today: string; postedDays: Record<string, number> }) {
    return (
        <div className="max-w-xl">
            <Head title="New entry" />
            <h1 className="mb-8 font-display text-4xl tracking-tight">
                New entry
            </h1>
            <EntryForm
                form={EntryController.store.form()}
                defaultDate={today}
                postedDays={postedDays}
                categories={categories}
                holidays={holidays}
                submitLabel="Post entry"
            />
        </div>
    );
}
