'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { Navbar } from '@/components/navbar';
import { OfflineBanner } from '@/components/offline-banner';
import { BottomNav } from '@/components/bottom-nav';
import { ProductTour } from '@/components/product-tour';

/**
 * Layout des pages protégées : redirige vers /login si non connecté.
 * La protection est côté client (le JWT est stocké dans le navigateur).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) router.replace('/login');
  }, [hydrated, token, router]);

  if (!hydrated) {
    return (
      <div className="flex-1 grid place-items-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!token) return null;

  return (
    <>
      <OfflineBanner />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24">
        {children}
      </main>
      <BottomNav />
      <ProductTour />
    </>
  );
}
