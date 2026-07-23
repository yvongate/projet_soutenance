import Image from 'next/image';
import { BookMarked } from 'lucide-react';

/** Mise en page commune aux écrans d'authentification (login, mdp oublié, reset). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <span className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BookMarked className="size-4" />
            </div>
            BiblioSmart
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/login.jpg"
          alt="Bibliothèque"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
