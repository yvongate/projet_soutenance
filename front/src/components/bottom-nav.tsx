'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Bookmark,
  Home,
  Library,
  MessageSquare,
  ScanLine,
  Users,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { aRole, estStaff } from '@/lib/types';

interface Item {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Préfixes supplémentaires qui activent l'onglet (ex. fiche livre → Catalogue). */
  prefixes?: string[];
}

export function BottomNav() {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);

  if (!user) return null;

  const admin = aRole(user, 'ADMINISTRATEUR');
  const staff = estStaff(user);

  const catalogue: Item = {
    href: '/catalogue',
    label: 'Catalogue',
    icon: Library,
    prefixes: ['/livres'],
  };
  const accueil: Item = { href: '/', label: 'Accueil', icon: Home };
  const messages: Item = {
    href: '/tickets',
    label: 'Messages',
    icon: MessageSquare,
  };

  const items: Item[] = admin
    ? [
        accueil,
        catalogue,
        { href: '/admin/comptes', label: 'Comptes', icon: Users },
        { href: '/stats', label: 'Stats', icon: BarChart3 },
        messages,
      ]
    : staff
      ? [
          accueil,
          catalogue,
          { href: '/guichet', label: 'Guichet', icon: ScanLine },
          { href: '/stats', label: 'Stats', icon: BarChart3 },
          messages,
        ]
      : [
          accueil,
          catalogue,
          { href: '/emprunts', label: 'Emprunts', icon: BookOpen },
          { href: '/reservations', label: 'Réservations', icon: Bookmark },
          messages,
        ];

  function estActif(it: Item): boolean {
    if (it.href === '/') return pathname === '/';
    if (pathname === it.href || pathname.startsWith(`${it.href}/`)) return true;
    return (it.prefixes ?? []).some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 z-50 h-16 w-full border-t border-white/20 bg-background/55 backdrop-blur-2xl backdrop-saturate-150 [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.35),0_-8px_24px_-12px_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex h-full max-w-lg">
        {items.map((it) => {
          const actif = estActif(it);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              data-tour={it.href}
              className={`inline-flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                actif
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
