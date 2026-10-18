import { Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
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
    const { name, auth } = usePage().props;
    const user = auth.user as User | null;
    const getInitials = useInitials();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border/60">
                <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
                    <Link
                        href={home()}
                        className="text-[15px] font-medium tracking-tight"
                    >
                        {name}
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm">
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
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-10">{children}</main>
        </div>
    );
}
