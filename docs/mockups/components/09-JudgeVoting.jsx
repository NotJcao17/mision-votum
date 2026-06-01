'use client';
/**
 * Misión Votum · Pantalla 9 — Pantalla de Votación (vista del juez, móvil)
 * Selector de chips grande por categoría (rango 1–5) · valor previo
 * preseleccionado · validación · "Enviar/Actualizar voto" · toast + volver.
 */
const { useState } = React;

const TV = {
  bg: '#FAF5EC', cream: '#F2E7D4', ink: '#2B1D14', inksoft: '#6F5E4C',
  inkfaint: '#A2917C', terra: '#C2552F', terradeep: '#A23F1F', olive: '#3E5A4A', saffron: '#DE9A33',
  disp: '"Fraunces", Georgia, serif', body: '"Hanken Grotesk", sans-serif',
};

const RANGO = [1, 2, 3, 4, 5];
const CATS = [
  { id: 'fid', nombre: 'Fidelidad histórica', hint: '¿Qué tan fiel es al monumento real?' },
  { id: 'cre', nombre: 'Creatividad', hint: 'Originalidad y vuelta propia' },
  { id: 'pre', nombre: 'Presentación', hint: 'Acabado, color y montaje' },
  { id: 'equ', nombre: 'Trabajo en equipo', hint: 'Coordinación durante la entrega' },
];

// Voto previo (este juez ya calificó este equipo) → preseleccionado.
const VOTO_PREVIO = { fid: 4, cre: 5, pre: 4, equ: 3 };

function ChipScale({ value, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {RANGO.map((n) => {
        const on = value === n;
        return (
          <button key={n} onClick={() => onPick(n)} aria-pressed={on} style={{
            flex: 1, height: 56, borderRadius: 16, cursor: 'pointer',
            fontFamily: TV.disp, fontWeight: 600, fontSize: 22,
            background: on ? TV.terra : '#fff',
            color: on ? '#FFF6EE' : TV.inkfaint,
            border: on ? `2px solid ${TV.terra}` : `1.5px solid rgba(43,29,20,0.14)`,
            boxShadow: on ? '0 6px 14px rgba(194,85,47,0.30)' : 'none',
            transform: on ? 'translateY(-2px)' : 'none',
            transition: 'all .14s ease',
          }}>{n}</button>
        );
      })}
    </div>
  );
}

function JudgeVoting() {
  const yaVoto = true; // demo: el juez ya había votado a este equipo
  const [scores, setScores] = useState(yaVoto ? { ...VOTO_PREVIO } : {});
  const [showError, setShowError] = useState(false);
  const [sent, setSent] = useState(false);

  const completas = CATS.every((c) => scores[c.id]);
  const hechas = CATS.filter((c) => scores[c.id]).length;

  function pick(id, n) {
    setScores((s) => ({ ...s, [id]: n }));
    setShowError(false);
  }
  function enviar() {
    if (!completas) { setShowError(true); return; }
    setSent(true);
    setTimeout(() => setSent(false), 2600); // tras el toast, "vuelve" a la lista
  }

  return (
    <div style={{ minHeight: '100%', background: TV.bg, fontFamily: TV.body, color: TV.ink, paddingTop: 52, display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ padding: '8px 18px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(43,29,20,0.08)' }}>
        <button aria-label="Volver" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: TV.inksoft, fontFamily: TV.body, fontWeight: 700, fontSize: 15, cursor: 'pointer', padding: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          Volver
        </button>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          <div style={{ fontFamily: TV.body, fontSize: 11.5, letterSpacing: 1, textTransform: 'uppercase', color: TV.inkfaint, whiteSpace: 'nowrap' }}>Calificando</div>
          <div style={{ fontFamily: TV.disp, fontWeight: 600, fontSize: 19, color: TV.ink, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Coliseo · Italia 🇮🇹</div>
        </div>
      </div>

      {/* banner voto previo */}
      {yaVoto && (
        <div style={{ margin: '14px 18px 0', padding: '10px 14px', background: 'rgba(62,90,74,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TV.olive} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4" /></svg>
          <span style={{ fontFamily: TV.body, fontSize: 13, color: TV.olive, fontWeight: 600 }}>Ya calificaste a este equipo. Puedes actualizar tu puntuación.</span>
        </div>
      )}

      {/* categorías */}
      <div style={{ flex: 1, padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {CATS.map((c) => (
          <div key={c.id}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: TV.disp, fontWeight: 600, fontSize: 19, color: TV.ink, letterSpacing: -0.2 }}>{c.nombre}</div>
                <div style={{ fontFamily: TV.body, fontSize: 12.5, color: TV.inkfaint, marginTop: 1 }}>{c.hint}</div>
              </div>
              {scores[c.id] && <span style={{ fontFamily: TV.disp, fontWeight: 600, fontSize: 17, color: TV.terra, flexShrink: 0 }}>{scores[c.id]}</span>}
            </div>
            <ChipScale value={scores[c.id]} onPick={(n) => pick(c.id, n)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: TV.body, fontSize: 11, color: TV.inkfaint }}>
              <span>Bajo</span><span>Alto</span>
            </div>
          </div>
        ))}
      </div>

      {/* pie: validación + enviar */}
      <div style={{ position: 'sticky', bottom: 0, padding: '14px 18px 30px', background: TV.bg, borderTop: '1px solid rgba(43,29,20,0.08)' }}>
        {showError && (
          <div style={{ marginBottom: 11, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(178,58,46,0.1)', color: '#B23A2E', borderRadius: 10, padding: '9px 12px', fontFamily: TV.body, fontWeight: 600, fontSize: 13 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.3" /></svg>
            Debes calificar todas las categorías antes de enviar.
          </div>
        )}
        <button onClick={enviar} style={{
          width: '100%', height: 58, borderRadius: 16, border: 'none', cursor: 'pointer',
          fontFamily: TV.body, fontWeight: 700, fontSize: 17, letterSpacing: 0.2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          background: completas ? TV.terra : 'rgba(43,29,20,0.16)',
          color: completas ? '#FFF6EE' : '#fff',
          boxShadow: completas ? '0 8px 20px rgba(194,85,47,0.28)' : 'none',
          transition: 'all .15s',
        }}>
          {yaVoto ? 'Actualizar voto' : 'Enviar voto'}
          <svg width="17" height="14" viewBox="0 0 17 14" fill="none" stroke={completas ? '#FFF6EE' : '#fff'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7h14M10 2l5 5-5 5" /></svg>
        </button>
        <div style={{ textAlign: 'center', marginTop: 9, fontFamily: TV.body, fontSize: 12, color: TV.inkfaint }}>{hechas} de {CATS.length} categorías calificadas</div>
      </div>

      {/* toast tras enviar */}
      {sent && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 46, display: 'flex', justifyContent: 'center', zIndex: 70, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: TV.ink, color: '#FFF6EE', borderRadius: 14, padding: '13px 18px', fontFamily: TV.body, fontWeight: 700, fontSize: 14, boxShadow: '0 12px 30px rgba(43,29,20,0.4)' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 11, background: TV.olive }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            Voto enviado para Coliseo
          </div>
        </div>
      )}
    </div>
  );
}

window.JudgeVoting = JudgeVoting;
