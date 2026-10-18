import { toast } from 'sonner';
import { home } from '@/routes';

/**
 * Share a link to this day: the system share sheet where there is one (iPhone), otherwise copy it.
 */
export async function shareDay(date: string, title: string): Promise<void> {
    const url = new URL(
        home({ query: { date } }).url,
        window.location.origin,
    ).toString();

    if (navigator.share) {
        try {
            await navigator.share({ title, url });
        } catch {
            // Closing the share sheet without choosing anything is not an error.
        }

        return;
    }

    try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
    } catch {
        toast.error("Couldn't copy the link");
    }
}
