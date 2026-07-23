'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';

/** Affiche un QR Code généré à partir d'une chaîne de caractères. */
export function QrDisplay({ value, size = 220 }: { value: string; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, { width: size, margin: 2 })
      .then(setUrl)
      .catch(() => setUrl(null));
  }, [value, size]);

  if (!url) {
    return (
      <div
        className="animate-pulse rounded bg-muted"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Image
      src={url}
      alt="QR Code"
      width={size}
      height={size}
      unoptimized
      className="rounded bg-white"
    />
  );
}
