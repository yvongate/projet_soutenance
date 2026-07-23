/** Indicateur de disponibilité d'un livre (vert si disponible, rouge sinon). */
export function Dispo({ dispo, total }: { dispo: number; total: number }) {
  const ok = dispo > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        ok ? 'text-dispo' : 'text-retard'
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {ok
        ? `${dispo}/${total} disponible${dispo > 1 ? 's' : ''}`
        : 'Indisponible'}
    </span>
  );
}
