'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

/**
 * Couverture de livre. Affiche l'image si disponible, sinon une icône.
 * `unoptimized` : évite la config remotePatterns et affiche l'image telle quelle.
 */
export function BookCover({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [erreur, setErreur] = useState(false);

  if (!src || erreur) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-muted ${className ?? ''}`}
      >
        <BookOpen className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded bg-muted ${className ?? ''}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="150px"
        className="object-cover"
        onError={() => setErreur(true)}
      />
    </div>
  );
}
