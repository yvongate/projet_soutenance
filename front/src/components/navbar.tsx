'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookMarked, Compass, LogOut } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { ROLE_LABEL } from '@/lib/types';
import { lancerTour } from '@/lib/tour';
import { NotificationsBell } from '@/components/notifications-bell';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const initiales = `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase();

  function onLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/20 bg-background/55 backdrop-blur-2xl backdrop-saturate-150 [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.35)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/accueil" className="flex items-center gap-2 font-semibold">
          <BookMarked className="h-5 w-5 text-primary" />
          BiblioSmart
        </Link>

        <div className="flex items-center gap-1">
          <span data-tour="notifications" className="inline-flex">
            <NotificationsBell />
          </span>
          <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initiales}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">
              {user.prenom} {user.nom}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <div className="text-sm font-medium">
                {user.prenom} {user.nom}
              </div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {user.roles.map((r) => ROLE_LABEL[r]).join(', ')}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => lancerTour(user)}>
              <Compass className="mr-2 h-4 w-4" />
              Revoir le tutoriel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
