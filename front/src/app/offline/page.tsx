import { WifiOff } from 'lucide-react';

export const metadata = { title: 'Hors ligne — BiblioSmart' };

export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-xl font-bold">Vous êtes hors ligne</h1>
      <p className="max-w-sm text-muted-foreground">
        Cette page n’est pas disponible sans connexion. Le catalogue déjà
        consulté reste accessible.
      </p>
    </div>
  );
}
