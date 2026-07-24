/**
 * Indicateur de disponibilité d'un livre (vert si disponible, rouge sinon).
 * Côté étudiant on n'affiche que le nombre d'exemplaires disponibles — le
 * total et la liste des exemplaires sont une info d'inventaire (staff).
 */
export function Dispo({ dispo }: { dispo: number; total?: number }) {
  const ok = dispo > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        ok ? 'text-dispo' : 'text-retard'
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {ok ? `${dispo} disponible${dispo > 1 ? 's' : ''}` : 'Indisponible'}
    </span>
  );
}
