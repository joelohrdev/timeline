import { Head } from '@inertiajs/react';
import EntryController from '@/actions/App/Http/Controllers/EntryController';
import { EntryForm } from '@/components/entry-form';

export default function CreateEntry({ today }: { today: string }) {
    return (
        <>
            <Head title="New entry" />
            <h1 className="mb-8 text-lg font-medium">New entry</h1>
            <EntryForm
                form={EntryController.store.form()}
                defaultDate={today}
                submitLabel="Post entry"
            />
        </>
    );
}
