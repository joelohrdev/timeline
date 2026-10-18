import { Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { home, login } from '@/routes';
import { create } from '@/routes/entries';
import type { User } from '@/types';

export default function TimelineLayout({ children }: { children: ReactNode }) {
    const { props, component } = usePage();
    const { name, auth } = props;
    const user = auth.user as User | null;
    const onEntryForm = component.startsWith('entries/');
    const getInitials = useInitials();

    return (
        <div className="min-h-screen bg-paper text-ink">
            <header className="pt-[env(safe-area-inset-top)]">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:h-20">
                    <Link
                        href={home()}
                        aria-label={name}
                        title={name}
                        className="rounded-sm focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-paper focus-visible:outline-none"
                    >
                        <AppLogoIcon className="size-10 text-ink" />
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <Button
                                asChild
                                size="sm"
                                className="hidden sm:inline-flex"
                            >
                                <Link href={create()}>
                                    <Plus />
                                    New entry
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="size-9 rounded-full p-1"
                                    >
                                        <Avatar className="size-7">
                                            <AvatarImage
                                                src={user.avatar}
                                                alt={user.name}
                                            />
                                            <AvatarFallback className="bg-neutral-200 text-xs text-black dark:bg-neutral-700 dark:text-white">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-56"
                                    align="end"
                                >
                                    <UserMenuContent user={user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Link
                            href={login()}
                            className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 pt-6 pb-24 sm:pt-10 sm:pb-10">
                {children}
            </main>

            {user && !onEntryForm && (
                <Link
                    href={create()}
                    aria-label="New entry"
                    className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full bg-ink text-paper shadow-lg transition focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none active:scale-95 sm:hidden"
                >
                    <Plus className="size-6" />
                </Link>
            )}
        </div>
    );
}
