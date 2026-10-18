import { Head, Link } from '@inertiajs/react';
import EntryController from '@/actions/App/Http/Controllers/EntryController';
import type { CategoryOptions } from '@/components/category-fields';
import { EntryForm } from '@/components/entry-form';
import { importMethod } from '@/routes/entries';
import type { PostedEvent } from '@/components/entry-form';

export default function CreateEntry({
    today,
    postedDays,
    categories,
    holidays,
}: CategoryOptions & {
    today: string;
    postedDays: Record<string, PostedEvent[]>;
}) {
    return (
        <div className="max-w-xl">
            <Head title="New entry" />
            <h1 className="font-display text-4xl tracking-tight">New entry</h1>
            <p className="mt-2 mb-8 text-sm text-muted-foreground">
                Catching up on older photos?{' '}
                <Link
                    href={importMethod()}
                    className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                    Import a batch by day
                </Link>
            </p>
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
