import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';

const TEMAS: Record<string, { header: string; accent: string; light: string; row: string; badge: string }> = {
  clasificatorio: { header: '#1a5c2a', accent: '#2d8a3e', light: '#edf7ef', row: '#d4edda', badge: '#1a5c2a' },
  reduccion:      { header: '#1a5c2a', accent: '#388e3c', light: '#f1f8e9', row: '#dcedc8', badge: '#1a5c2a' },
  segunda:        { header: '#b83c00', accent: '#e64a19', light: '#fff4f0', row: '#ffe0d0', badge: '#b83c00' },
  primera:        { header: '#014f86', accent: '#0277bd', light: '#e8f4fd', row: '#cce4f7', badge: '#014f86' },
  master:         { header: '#4a1070', accent: '#7b1fa2', light: '#f5eef8', row: '#e8d5f2', badge: '#4a1070' },
};

const FASES = [
  { value: 'clasificatorio', label: '🟢 Series Clasificatorio' },
  { value: 'reduccion',      label: '🟢 Reducción Clasificatorio' },
  { value: 'segunda',        label: '🟠 Series Segunda' },
  { value: 'primera',        label: '🔵 Cruces Primera' },
  { value: 'master',         label: '🟣 Fase Máster' },
];

const F = 'Arial, Helvetica, sans-serif';

const cargarHtml2Canvas = (): Promise<any> =>
  new Promise((resolve, reject) => {
    if ((window as any).html2canvas) { resolve((window as any).html2canvas); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve((window as any).html2canvas);
    script.onerror = () => reject(new Error('No se pudo cargar html2canvas desde CDN'));
    document.head.appendChild(script);
  });

function PubHeader({ data, tema }: { data: any; tema: any }) {
  return (
    <div style={{ background: tema.header, padding: '28px 40px 24px', display: 'flex', alignItems: 'center', gap: 28, fontFamily: F }}>
      <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: 4 }}>
        <img src="/logo-febiu.png" alt="FEBIU" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
      </div>
      <div style={{ flex: 1, textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>{data.torneo}</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3, letterSpacing: 1, opacity: 0.9 }}>
          FEBIU · {data.circuito.toUpperCase()} · TEMPORADA {data.temporada}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 12, letterSpacing: 3, textTransform: 'uppercase' }}>{data.fase}</div>
        {data.fechaPrincipal && (
          <div style={{ fontSize: 14, marginTop: 5, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
            {data.fechaPrincipal}
          </div>
        )}
        <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '6px 20px', display: 'inline-block', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
          PARTIDAS A {data.formato.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function PubFooter({ notas, tema }: { notas: string; tema: any }) {
  if (!notas.trim()) return null;
  return (
    <div style={{ background: tema.light, borderTop: `3px solid ${tema.accent}`, padding: '14px 30px', fontSize: 14, color: tema.header, fontWeight: 600, lineHeight: 1.6, fontFamily: F }}>
      {notas}
    </div>
  );
}

function JRow({ j, tema, border }: { j: any; tema: any; border?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', gap: 7, borderBottom: border ? `1px solid ${tema.light}` : 'none', minHeight: 34, fontFamily: F }}>
      {j.ranking !== null ? (
        <div style={{ width: 30, height: 24, background: tema.badge, color: '#fff', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
          {j.ranking}
        </div>
      ) : (
        <div style={{ width: 30, height: 24, background: '#e0e0e0', color: '#999', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>?</div>
      )}
      <div style={{ flex: 1, fontSize: 13, fontWeight: j.esSlot ? 400 : 700, color: j.esSlot ? '#999' : '#111', fontStyle: j.esSlot ? 'italic' : 'normal', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {j.nombre}
      </div>
      {j.club && (
        <div style={{ background: tema.header, color: '#fff', padding: '2px 7px', borderRadius: 3, fontSize: 11, fontWeight: 800, flexShrink: 0, letterSpacing: 0.5 }}>
          {j.club}
        </div>
      )}
    </div>
  );
}

function InfoPartido({ p, tema, label }: { p: any; tema: any; label: string }) {
  return (
    <div style={{ background: tema.header, color: '#fff', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontFamily: F }}>
      <span style={{ fontWeight: 700, opacity: 0.7, fontSize: 11, flexShrink: 0 }}>{label}</span>
      {p.hora ? <span>🕐 {p.hora}</span> : null}
      {p.fecha ? <span>📅 {p.fecha}</span> : null}
      {p.sede ? <span>📍 {p.sede}{p.mesa ? ` · Mesa ${p.mesa}` : ''}</span> : <span style={{ opacity: 0.5 }}>Sin asignar</span>}
      {p.resultado && (
        <span style={{ marginLeft: 'auto', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '1px 8px', borderRadius: 3, fontSize: 13 }}>
          {p.resultado}
        </span>
      )}
    </div>
  );
}

function PlantillaSeries({ data, tema }: { data: any; tema: any }) {
  const series: any[] = data.series ?? [];
  const pares: any[][] = [];
  for (let i = 0; i < series.length; i += 2) pares.push([series[i], series[i + 1] ?? null]);

  return (
    <div style={{ padding: '16px 20px', background: '#fff', fontFamily: F }}>
      {pares.map((par, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {par.map((s, si) => s ? (
            <div key={si} style={{ flex: 1, border: `2px solid ${tema.accent}`, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
              <div style={{ background: tema.accent, color: '#fff', padding: '6px 12px', fontSize: 13, fontWeight: 900, letterSpacing: 2 }}>
                SERIE {s.numero}
              </div>
              {s.p1 && (
                <>
                  <div style={{ background: tema.light }}>
                    <JRow j={s.p1.jugadorA} tema={tema} border />
                    <JRow j={s.p1.jugadorB} tema={tema} />
                  </div>
                  <InfoPartido p={s.p1} tema={tema} label="P1" />
                </>
              )}
              {s.p2 && (
                <>
                  <div style={{ background: '#fff', borderTop: `2px solid ${tema.light}` }}>
                    <JRow j={s.p2.jugadorA} tema={tema} border />
                    <JRow j={s.p2.jugadorB} tema={tema} />
                  </div>
                  <InfoPartido p={s.p2} tema={tema} label="P2" />
                </>
              )}
            </div>
          ) : <div key={si} style={{ flex: 1 }} />)}
        </div>
      ))}
    </div>
  );
}

function PlantillaReduccion({ data, tema }: { data: any; tema: any }) {
  const cruces: any[] = data.cruces ?? [];
  const pares: any[][] = [];
  for (let i = 0; i < cruces.length; i += 2) pares.push([cruces[i], cruces[i + 1] ?? null]);

  return (
    <div style={{ padding: '16px 20px', background: '#fff', fontFamily: F }}>
      {pares.map((par, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          {par.map((c, ci) => c ? (
            <div key={ci} style={{ flex: 1, border: `2px solid ${tema.accent}`, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
              <div style={{ background: tema.accent, color: '#fff', padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>
                  {c.esRepechaje ? 'REPECHAJE' : `CRUCE ${c.numero}`}
                </span>
                {c.resultado && <span style={{ fontWeight: 900, fontSize: 14 }}>{c.resultado}</span>}
              </div>
              <JRow j={c.jugadorA} tema={tema} border />
              <JRow j={c.jugadorB} tema={tema} />
              <div style={{ background: tema.light, padding: '4px 10px', fontSize: 12, color: tema.header, display: 'flex', gap: 10, fontWeight: 600 }}>
                {c.hora ? <span>🕐 {c.hora}</span> : null}
                {c.fecha ? <span>📅 {c.fecha}</span> : null}
                {c.sede ? <span>📍 {c.sede}{c.mesa ? ` M.${c.mesa}` : ''}</span> : <span style={{ opacity: 0.5 }}>Sin asignar</span>}
              </div>
            </div>
          ) : <div key={ci} style={{ flex: 1 }} />)}
        </div>
      ))}
    </div>
  );
}

function PlantillaCruces({ data, tema }: { data: any; tema: any }) {
  const cruces: any[] = data.cruces ?? [];
  const porEtapa: Record<string, any[]> = {};
  for (const c of cruces) {
    const k = c.etapa ?? 'CRUCES';
    if (!porEtapa[k]) porEtapa[k] = [];
    porEtapa[k].push(c);
  }
  const etapas = Object.keys(porEtapa);

  return (
    <div style={{ padding: '16px 20px', background: '#fff', fontFamily: F }}>
      {etapas.map(etapa => {
        const arr = porEtapa[etapa];
        const pares: any[][] = [];
        for (let i = 0; i < arr.length; i += 2) pares.push([arr[i], arr[i + 1] ?? null]);
        return (
          <div key={etapa} style={{ marginBottom: 16 }}>
            {etapas.length > 1 && (
              <div style={{ background: tema.accent, color: '#fff', padding: '7px 14px', fontSize: 14, fontWeight: 900, letterSpacing: 2, borderRadius: '6px 6px 0 0', marginBottom: 6 }}>
                {etapa}
              </div>
            )}
            {pares.map((par, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                {par.map((c, ci) => c ? (
                  <div key={ci} style={{ flex: 1, border: `2px solid ${tema.accent}`, borderRadius: 5, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: tema.light, padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${tema.accent}` }}>
                      <span style={{ fontWeight: 900, fontSize: 12, color: tema.header, letterSpacing: 1 }}>CRUCE {c.round}</span>
                      <span style={{ fontSize: 11, color: tema.accent, fontWeight: 600 }}>
                        {c.hora ? `🕐 ${c.hora}` : ''} {c.fecha ? `📅 ${c.fecha}` : ''}
                      </span>
                      {c.resultado && <span style={{ fontWeight: 900, color: tema.header, fontSize: 13 }}>{c.resultado}</span>}
                    </div>
                    <JRow j={c.jugadorA} tema={tema} border />
                    <JRow j={c.jugadorB} tema={tema} />
                    {c.sede && (
                      <div style={{ background: tema.header, color: '#fff', padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                        📍 {c.sede}{c.mesa ? ` · Mesa ${c.mesa}` : ''}
                      </div>
                    )}
                  </div>
                ) : <div key={ci} style={{ flex: 1 }} />)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPublicacionesPage() {
  const [torneos, setTorneos] = useState<any[]>([]);
  const [circuitId, setCircuitId] = useState('');
  const [tipoFase, setTipoFase] = useState('clasificatorio');
  const [pubData, setPubData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const pubRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/publicaciones/circuitos').then(r => {
      setTorneos(r.data);
      if (r.data.length > 0 && r.data[0].circuits?.length > 0) {
        setCircuitId(String(r.data[0].circuits[0].id));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (wrapperRef.current && pubRef.current) {
      const h = pubRef.current.scrollHeight * 0.5;
      wrapperRef.current.style.height = `${h}px`;
    }
  }, [pubData, notas]);

  const cargar = async () => {
    if (!circuitId) return;
    setLoading(true); setError(''); setPubData(null);
    try {
      const res = await api.get(`/publicaciones/${circuitId}/${tipoFase}`);
      setPubData(res.data);
      setNotas('');
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const exportar = async () => {
    if (!pubRef.current) return;
    setExportando(true);
    try {
      const h2c = await cargarHtml2Canvas();
      const canvas = await h2c(pubRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `${pubData?.fase ?? 'publicacion'} - ${pubData?.circuito ?? ''}.png`.replace(/[/\\?%*:|"<>]/g, '-');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (e: any) {
      alert(`Error al exportar: ${e.message}`);
    } finally {
      setExportando(false);
    }
  };

  const tema = TEMAS[tipoFase] ?? TEMAS.clasificatorio;
  const circuitos = torneos.flatMap((t: any) =>
    (t.circuits ?? []).map((c: any) => ({ ...c, torneoNombre: t.name }))
  );

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">PUBLICACIONES</h1>
        <p className="text-chalk/50 text-sm mt-1">Generación automática de gráficos para WhatsApp y redes sociales</p>
      </div>

      <div className="p-6 space-y-5">
        <div className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Circuito</label>
              <select className="input" value={circuitId} onChange={e => { setCircuitId(e.target.value); setPubData(null); }}>
                <option value="">Seleccionar circuito...</option>
                {circuitos.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.torneoNombre} — {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Fase</label>
              <select className="input" value={tipoFase} onChange={e => { setTipoFase(e.target.value); setPubData(null); }}>
                {FASES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn-primary w-full" disabled={!circuitId || loading} onClick={cargar}>
                {loading ? 'Cargando...' : '⚡ Generar publicación'}
              </button>
            </div>
          </div>

          {pubData && (
            <>
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nota al pie (opcional)</label>
                <textarea
                  className="input w-full"
                  rows={2}
                  placeholder="Ej: Los ganadores de cada serie pasan automáticamente a la siguiente fase..."
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <button className="btn-primary px-8" disabled={exportando} onClick={exportar}>
                  {exportando ? 'Exportando...' : '⬇ Exportar PNG'}
                </button>
                <span className="text-chalk/30 text-xs">Alta resolución · Listo para WhatsApp y redes</span>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
        )}

        {loading && <LoadingSpinner />}

        {pubData && !loading && (
          <div>
            <p className="text-chalk/40 text-xs uppercase tracking-widest mb-3">
              Vista previa (50%) · {pubData.tipo === 'series' ? `${pubData.series?.length ?? 0} series` : `${pubData.cruces?.length ?? 0} cruces`}
            </p>
            <div
              ref={wrapperRef}
              style={{ width: '540px', overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              <div
                ref={pubRef}
                style={{ width: '1080px', transform: 'scale(0.5)', transformOrigin: 'top left', fontFamily: F, background: '#ffffff', lineHeight: 1.3 }}
              >
                <PubHeader data={pubData} tema={tema} />
                {pubData.tipo === 'series'    && <PlantillaSeries    data={pubData} tema={tema} />}
                {pubData.tipo === 'reduccion' && <PlantillaReduccion data={pubData} tema={tema} />}
                {pubData.tipo === 'cruces'    && <PlantillaCruces    data={pubData} tema={tema} />}
                <PubFooter notas={notas} tema={tema} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
