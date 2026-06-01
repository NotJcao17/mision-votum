'use client';
/**
 * Misión Votum · Pantalla 8 — Lista de Equipos (vista del juez, móvil)
 * Saludo + progreso personal + lista (pendientes primero). Cada ítem es
 * tappable y lleva a la votación. Estética "Mercado" adaptada a móvil.
 */
const { useState } = React;

const T = {
  bg: '#FAF5EC', cream: '#F2E7D4', ink: '#2B1D14', inksoft: '#6F5E4C',
  inkfaint: '#A2917C', terra: '#C2552F', olive: '#3E5A4A', saffron: '#DE9A33',
  disp: '"Fraunces", Georgia, serif', body: '"Hanken Grotesk", sans-serif',
};

const EQUIPOS_JUEZ = [
  { id: 1, nombre: 'Gran Muralla', pais: 'China', flag: '🇨🇳', estado: 'pendiente' },
  { id: 2, nombre: 'Pirámides de Giza', pais: 'Egipto', flag: '🇪🇬', estado: 'pendiente' },
  { id: 3, nombre: 'Cristo Redentor', pais: 'Brasil', flag: '🇧🇷', estado: 'pendiente' },
  { id: 4, nombre: 'Sagrada Familia', pais: 'España', flag: '🇪🇸', estado: 'pendiente' },
  { id: 5, nombre: 'Coliseo', pais: 'Italia', flag: '🇮🇹', estado: 'votado', califq: 4.5 },
  { id: 6, nombre: 'Torre Eiffel', pais: 'Francia', flag: '🇫🇷', estado: 'votado', califq: 4.2 },
  { id: 7, nombre: 'Taj Mahal', pais: 'India', flag: '🇮🇳', estado: 'votado', califq: 4.8 },
  { id: 8, nombre: 'Machu Picchu', pais: 'Perú', flag: '🇵🇪', estado: 'votado', califq: 4.6 },
];

function TeamRow({ eq, onClick }) {
  const votado = eq.estado === 'votado';
  return (
    <button onClick={onClick} className="w-full text-left" style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px',
      background: '#fff', borderRadius: 18, border: `1px solid rgba(43,29,20,0.08)`,
      boxShadow: '0 1px 2px rgba(43,29,20,0.04)', cursor: 'pointer',
    }}>
      <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{eq.flag}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 18, color: T.ink, lineHeight: 1.1, letterSpacing: -0.2 }}>{eq.nombre}</div>
        <div style={{ fontFamily: T.body, fontSize: 13, color: T.inkfaint, marginTop: 2 }}>
          {eq.pais}{votado && <span style={{ color: T.olive, fontWeight: 700 }}> · Tu calificación: {eq.califq.toFixed(1)}</span>}
        </div>
      </div>
      {votado ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, background: 'rgba(62,90,74,0.12)', color: T.olive, fontFamily: T.body, fontWeight: 700, fontSize: 12, padding: '5px 10px', borderRadius: 999 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.olive} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Votado
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, background: 'rgba(222,154,51,0.16)', color: '#A66E12', fontFamily: T.body, fontWeight: 700, fontSize: 12, padding: '5px 10px', borderRadius: 999 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: T.saffron }} />Pendiente
        </span>
      )}
    </button>
  );
}

function JudgeTeamList() {
  const [equipos] = useState(EQUIPOS_JUEZ);
  const orden = [...equipos].sort((a, b) => (a.estado === 'pendiente' ? 0 : 1) - (b.estado === 'pendiente' ? 0 : 1));
  const votados = equipos.filter((e) => e.estado === 'votado').length;
  const total = equipos.length;
  const pct = Math.round((votados / total) * 100);
  const pendientes = orden.filter((e) => e.estado === 'pendiente');
  const hechos = orden.filter((e) => e.estado === 'votado');

  return (
    <div style={{ minHeight: '100%', background: T.bg, fontFamily: T.body, color: T.ink, paddingTop: 56, paddingBottom: 28 }}>
      {/* header */}
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: T.terra }}>Misión Votum</div>
          <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 27, color: T.ink, lineHeight: 1.05, marginTop: 4, letterSpacing: -0.4, whiteSpace: 'nowrap' }}>Hola, María</div>
          <div style={{ fontFamily: T.body, fontSize: 14, color: T.inksoft, marginTop: 3 }}>Monumentos del Mundo</div>
        </div>
        <button title="Cerrar sesión" aria-label="Cerrar sesión" style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 19, border: `1px solid rgba(43,29,20,0.12)`, background: 'transparent', display: 'grid', placeItems: 'center', color: T.inksoft, cursor: 'pointer' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
        </button>
      </div>

      {/* progreso personal */}
      <div style={{ margin: '16px 20px 0', padding: '16px 18px', background: T.cream, borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 15, color: T.ink, whiteSpace: 'nowrap' }}>Tu progreso</span>
          <span style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 18, color: T.terra }}>{pct}%</span>
        </div>
        <div style={{ fontFamily: T.body, fontSize: 13.5, color: T.inksoft, marginTop: 2 }}>Has votado a <b style={{ color: T.ink }}>{votados}</b> de <b style={{ color: T.ink }}>{total}</b> equipos</div>
        <div style={{ height: 9, borderRadius: 5, background: 'rgba(43,29,20,0.1)', overflow: 'hidden', marginTop: 11 }}>
          <div style={{ width: pct + '%', height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${T.terra}, ${T.saffron})` }} />
        </div>
      </div>

      {/* pendientes */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '22px 0 11px' }}>
          <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, letterSpacing: 0.3, textTransform: 'uppercase', color: '#A66E12', whiteSpace: 'nowrap' }}>Por votar · {pendientes.length}</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(43,29,20,0.1)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pendientes.map((eq) => <TeamRow key={eq.id} eq={eq} onClick={() => {}} />)}
        </div>

        {/* votados */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 0 11px' }}>
          <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, letterSpacing: 0.3, textTransform: 'uppercase', color: T.olive, whiteSpace: 'nowrap' }}>Ya votados · {hechos.length}</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(43,29,20,0.1)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hechos.map((eq) => <TeamRow key={eq.id} eq={eq} onClick={() => {}} />)}
        </div>
      </div>
    </div>
  );
}

window.JudgeTeamList = JudgeTeamList;
