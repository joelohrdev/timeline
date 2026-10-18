import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const showAfterPixels = 800;

export function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const update = () => setVisible(window.scrollY > showAfterPixels);

        update();
        window.addEventListener('scroll', update, { passive: true });

        return () => window.removeEventListener('scroll', update);
    }, []);

    const scrollToTop = () => {
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={scrollToTop}
            aria-label="Back to top"
            title="Back to top"
            tabIndex={visible ? 0 : -1}
            aria-hidden={!visible}
            className={cn(
                'fixed right-4 bottom-4 z-40 size-11 rounded-full bg-background/90 shadow-md backdrop-blur transition duration-300 sm:right-6 sm:bottom-6',
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-3 opacity-0',
            )}
        >
            <ArrowUp className="size-5" />
        </Button>
    );
}
