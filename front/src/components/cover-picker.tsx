'use client';

import { useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookCover } from '@/components/book-cover';

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Recadre l'image selon la zone (pixels) et renvoie un data URL JPEG compressé. */
async function recadrer(src: string, zone: Area): Promise<string> {
  const image = await createImage(src);
  const canvas = document.createElement('canvas');
  const largeur = 360; // largeur cible
  const echelle = largeur / zone.width;
  canvas.width = largeur;
  canvas.height = Math.round(zone.height * echelle);
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.drawImage(
    image,
    zone.x,
    zone.y,
    zone.width,
    zone.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas.toDataURL('image/jpeg', 0.82);
}

/** Sélecteur de couverture : upload depuis l'appareil + recadrage 2:3. */
export function CoverPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [zone, setZone] = useState<Area | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-choisir le même fichier
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  async function valider() {
    if (!src || !zone) return;
    onChange(await recadrer(src, zone));
    setSrc(null);
  }

  return (
    <div className="flex items-center gap-3">
      <BookCover src={value || null} alt="Couverture" className="h-24 w-16" />
      <div className="space-y-1">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          <ImagePlus className="h-4 w-4" />
          Choisir une image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="block text-xs text-muted-foreground hover:text-foreground"
          >
            Retirer
          </button>
        )}
      </div>

      <Dialog open={!!src} onOpenChange={(o) => !o && setSrc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recadrer la couverture</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 w-full overflow-hidden rounded bg-black">
            {src && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={2 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setZone(pixels)}
              />
            )}
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSrc(null)}>
              Annuler
            </Button>
            <Button type="button" onClick={valider}>
              Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
