import { STATUT_EXEMPLAIRE_LABEL, type StatutExemplaire } from '@/lib/types';

/** Classe de couleur sémantique par statut d'exemplaire (voir globals.css). */
const STATUT_CLASSE: Record<StatutExemplaire, string> = {
  DISPONIBLE: 'badge-dispo',
  EMPRUNTE: 'badge-emprunte',
  RESERVE: 'badge-reserve',
};

/**
 * Badge de statut d'exemplaire à couleur unifiée (Disponible/Emprunté/Réservé),
 * cohérente dans toute l'app et adaptée au mode sombre.
 */
export function StatutBadge({
  statut,
  className = '',
}: {
  statut: StatutExemplaire;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STATUT_CLASSE[statut]} ${className}`}
    >
      {STATUT_EXEMPLAIRE_LABEL[statut]}
    </span>
  );
}
