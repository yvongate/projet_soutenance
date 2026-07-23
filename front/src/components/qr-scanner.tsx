'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, Keyboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Scanner de QR Code via la caméra (jsQR), avec repli sur une saisie manuelle
 * (utile pour tester sans caméra ou sans second appareil).
 * `onScan` est appelé une seule fois avec le contenu du QR.
 */
export function QrScanner({
  onScan,
  placeholder = 'Code (ex: BS-XXXX)',
}: {
  onScan: (texte: string) => void;
  placeholder?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanneRef = useRef(false);
  const onScanRef = useRef(onScan);

  const [erreurCamera, setErreurCamera] = useState(false);
  const [manuel, setManuel] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let actif = true;

    function boucle() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!actif || scanneRef.current || !video || !canvas) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height);
          if (code?.data) {
            scanneRef.current = true;
            onScanRef.current(code.data.trim());
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(boucle);
    }

    async function demarrer() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // "ideal" : préfère la caméra arrière (mobile) mais accepte
          // la webcam frontale d'un PC portable si c'est la seule.
          video: { facingMode: { ideal: 'environment' } },
        });
        if (!actif) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          rafRef.current = requestAnimationFrame(boucle);
        }
      } catch {
        if (actif) setErreurCamera(true);
      }
    }

    void demarrer();

    return () => {
      actif = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function validerManuel(e: React.FormEvent) {
    e.preventDefault();
    const v = manuel.trim();
    if (v) onScanRef.current(v);
  }

  return (
    <div className="space-y-4">
      {/* Caméra */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
        {erreurCamera ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <CameraOff className="h-8 w-8" />
            <p className="px-4 text-center text-sm">
              Caméra indisponible.
              <br />
              Utilisez la saisie manuelle ci-dessous.
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-2/3 w-2/3 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
              <Camera className="h-3 w-3" /> Visez le QR Code
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Saisie manuelle */}
      <form onSubmit={validerManuel} className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="h-3.5 w-3.5" />
          Ou saisir le code manuellement
        </div>
        <div className="flex gap-2">
          <Input
            value={manuel}
            onChange={(e) => setManuel(e.target.value)}
            placeholder={placeholder}
          />
          <Button type="submit" disabled={!manuel.trim()}>
            Valider
          </Button>
        </div>
      </form>
    </div>
  );
}
