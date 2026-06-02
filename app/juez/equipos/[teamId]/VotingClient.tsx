'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, useToast } from '@/components/ui/Toast';
import { BackIcon, ArrowIcon, RefreshIcon } from '@/components/ui/icons';
import { submitVote } from '../../actions';

export interface CategoryItem {
  id: string;
  nombre: string;
}

export function VotingClient({
  teamId,
  teamName,
  minScore,
  maxScore,
  categorias,
  previo,
}: {
  teamId: string;
  teamName: string;
  minScore: number;
  maxScore: number;
  categorias: CategoryItem[];
  previo: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { toast, showToast } = useToast();

  const hadPrevious = Object.keys(previo).length === categorias.length && categorias.length > 0;
  const [scores, setScores] = useState<Record<string, number>>({ ...previo });
  const [error, setError] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const rango: number[] = [];
  for (let n = minScore; n <= maxScore; n++) rango.push(n);

  const completas = categorias.every((c) => scores[c.id] !== undefined);
  const hechas = categorias.filter((c) => scores[c.id] !== undefined).length;

  function pick(catId: string, value: number) {
    setScores((s) => ({ ...s, [catId]: value }));
    setShowValidation(false);
    setError('');
  }

  function handleSubmit() {
    if (!completas) {
      setShowValidation(true);
      return;
    }
    setError('');
    startTransition(async () => {
      const res = await submitVote(teamId, scores);
      if (res.ok) {
        showToast(`Voto enviado para ${teamName}`);
        setTimeout(() => router.push('/juez'), 700);
      } else {
        setError(res.error ?? 'No se pudo registrar el voto.');
      }
    });
  }

  return (
    <main className="flex min-h-screen flex-col bg-ivory font-body text-ink">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-ink/8 px-5 py-3">
        <button
          onClick={() => router.push('/juez')}
          aria-label="Volver"
          className="inline-flex items-center gap-1 text-sm font-bold text-inksoft transition hover:text-terra"
        >
          <BackIcon className="h-[18px] w-[18px]" />
          Volver
        </button>
        <div className="min-w-0 flex-1 text-right">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-inkfaint">
            Calificando
          </div>
          <div className="truncate font-display text-[17px] font-semibold leading-tight text-ink">
            {teamName}
          </div>
        </div>
      </header>

      {/* Banner voto previo */}
      {hadPrevious && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-olive/10 px-3.5 py-2.5">
          <RefreshIcon className="h-4 w-4 flex-shrink-0 text-olive" />
          <span className="text-[13px] font-semibold text-olive">
            Ya calificaste a este equipo. Puedes actualizar tu puntuación.
          </span>
        </div>
      )}

      {/* Categorías */}
      <div className="flex-1 space-y-6 px-5 py-5">
        {categorias.map((c) => (
          <div key={c.id}>
            <div className="mb-2.5 flex items-baseline justify-between">
              <div className="font-display text-lg font-semibold tracking-tight text-ink">
                {c.nombre}
              </div>
              {scores[c.id] !== undefined && (
                <span className="font-display text-base font-semibold text-terra">
                  {scores[c.id]}
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {rango.map((n) => {
                const on = scores[c.id] === n;
                return (
                  <button
                    key={n}
                    onClick={() => pick(c.id, n)}
                    aria-pressed={on}
                    className={`rounded-2xl py-3.5 font-display text-xl font-semibold transition ${
                      on
                        ? 'border-2 border-terra bg-terra text-ivory shadow-terra'
                        : 'border-[1.5px] border-ink/15 bg-white text-inkfaint hover:border-terra/40'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pie sticky */}
      <div className="sticky bottom-0 border-t border-ink/8 bg-ivory px-5 pb-6 pt-3.5">
        {(showValidation && !completas) && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-semibold text-danger">
            <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6M12 16.5v.3" />
            </svg>
            Debes calificar todas las categorías antes de enviar.
          </div>
        )}
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-semibold text-danger">
            <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6M12 16.5v.3" />
            </svg>
            {error}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={pending}
          className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition ${
            completas
              ? 'bg-terra text-ivory shadow-terra hover:bg-terradeep'
              : 'bg-ink/15 text-ivory'
          } disabled:opacity-70`}
        >
          {pending ? 'Enviando…' : hadPrevious ? 'Actualizar voto' : 'Enviar voto'}
          {!pending && <ArrowIcon />}
        </button>
        <p className="mt-2.5 text-center text-xs text-inkfaint">
          {hechas} de {categorias.length} {categorias.length === 1 ? 'categoría calificada' : 'categorías calificadas'}
        </p>
      </div>

      <Toast toast={toast} />
    </main>
  );
}
