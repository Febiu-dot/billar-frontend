import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui';

const TEMAS: Record<string, { header: string; accent: string; light: string; badge: string }> = {
  clasificatorio: { header: '#1a5c2a', accent: '#2d8a3e', light: '#edf7ef', badge: '#1a5c2a' },
  reduccion:      { header: '#1a5c2a', accent: '#388e3c', light: '#f1f8e9', badge: '#1a5c2a' },
  segunda:        { header: '#b83c00', accent: '#e64a19', light: '#fff4f0', badge: '#b83c00' },
  primera:        { header: '#014f86', accent: '#0277bd', light: '#e8f4fd', badge: '#014f86' },
  master:         { header: '#4a1070', accent: '#7b1fa2', light: '#f5eef8', badge: '#4a1070' },
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
    script.onerror = () => reject(new Error('No se pudo cargar html2canvas'));
    document.head.appendChild(script);
  });

function PubHeader({ data, tema }: { data: any; tema: any }) {
  return (
    <div style={{ background: tema.header, padding: '36px 50px 32px', display: 'flex', alignItems: 'center', gap: 36, fontFamily: F }}>
      <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: 6 }}>
        <img src="/logo-febiu.png" alt="FEBIU" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
      </div>
      <div style={{ flex: 1, textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1.1 }}>{data.torneo}</div>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, letterSpacing: 2, opacity: 0.9 }}>
          FEBIU · {data.circuito.toUpperCase()} · TEMPORADA {data.temporada}
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, marginTop: 16, letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1.1 }}>{data.fase}</div>
        {data.fechaPrincipal && (
          <div style={{ fontSize: 20, marginTop: 8, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>
            {data.fechaPrincipal}
          </div>
        )}
        <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '8px 24px', display: 'inline-block', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
          PARTIDAS A {data.formato.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function PubFooter({ notas, tema }: { notas: string; tema: any }) {
  if (!notas.trim()) return null;
  return (
    <div style={{ background: tema.light, borderTop: `4px solid ${tema.accent}`, padding: '20px 40px', fontSize: 20, color: tema.header, fontWeight: 600, lineHeight: 1.6, fontFamily: F }}>
      {notas}
    </div>
  );
}

function JRow({ j, tema, border }: { j: any; tema: any; border?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10, borderBottom: border ? `1px solid ${tema.light}` : 'none', minHeight: 48, fontFamily: F }}>
      {j.ranking !== null ? (
        <div style={{ width: 40, height: 32, background: tema.badge, color: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, flexShrink: 0 }}>
          {j.ranking}
        </div>
      ) : (
        <div style={{ width: 40, height: 32, background: '#ddd', color: '#888', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>?</div>
      )}
      <div style={{ flex: 1, fontSize: 20, fontWeight: j.esSlot ? 400 : 700, color: j.esSlot ? '#999' : '#111', fontStyle: j.esSlot ? 'italic' : 'normal', wordBreak: 'break-word' }}>
        {j.nombre}
      </div>
      {j.club && (
        <div style={{ background: tema.header, color: '#fff', padding: '4px 10px', borderRadius: 4, fontSize: 16, fontWeight: 800, flexShrink: 0, letterSpacing: 1 }}>
          {j.club}
        </div>
      )}
    </div>
  );
}

function InfoPartido({ p, tema, label }: { p: any; tema: any; label: string }) {
  return (
    <div style={{ background: tema.header, color: '#fff', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, fontFamily: F, flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 700, opacity: 0.7, fontSize: 15, flexShrink: 0 }}>{label}</span>
      {p.hora ? <span>🕐 {p.hora}</span> : null}
      {p.fecha ? <span>📅 {p.fecha}</span> : null}
      {p.sede ? <span>📍 {p.sede}{p.mesa ? ` · Mesa ${p.mesa}` : ''}</span> : <span style={{ opacity: 0.5 }}>Sin asignar</span>}
      {p.resultado && (
        <span style={{ marginLeft: 'auto', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '2px 12px', borderRadius: 4, fontSize: 19 }}>
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
    <div style={{ padding: '20px 24px', background: '#f8f8f8', fontFamily: F }}>
      {pares.map((par, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          {par.map((s, si) => s ? (
            <div key={si} style={{ flex: 1, border: `2px solid ${tema.accent}`, borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ background: tema.accent, color: '#fff', padding: '8px 16px', fontSize: 18, fontWeight: 900, letterSpacing: 3, borderRadius: '6px 6px 0 0' }}>
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
    <div style={{ padding: '20px 24px', background: '#f8f8f8', fontFamily: F }}>
      {pares.map((par, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
          {par.map((c, ci) => c ? (
            <div key={ci} style={{ flex: 1, border: `2px solid ${tema.accent}`, borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ background: tema.accent, color: '#fff', padding: '7px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '6px 6px 0 0' }}>
                <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: 1 }}>
                  {c.esRepechaje ? 'REPECHAJE' : `CRUCE ${c.numero}`}
                </span>
                {c.resultado && <span style={{ fontWeight: 900, fontSize: 19 }}>{c.resultado}</span>}
              </div>
              <JRow j={c.jugadorA} tema={tema} border />
              <JRow j={c.jugadorB} tema={tema} />
              <div style={{ background: tema.light, padding: '7px 14px', fontSize: 16, color: tema.header, display: 'flex', gap: 12, fontWeight: 600, flexWrap: 'wrap' }}>
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
    <div style={{ padding: '20px 24px', background: '#f8f8f8', fontFamily: F }}>
      {etapas.map(etapa => {
        const arr = porEtapa[etapa];
        const pares: any[][] = [];
        for (let i = 0; i < arr.length; i += 2) pares.push([arr[i], arr[i + 1] ?? null]);
        return (
          <div key={etapa} style={{ marginBottom: 20 }}>
            {etapas.length > 1 && (
              <div style={{ background: tema.accent, color: '#fff', padding: '10px 18px', fontSize: 20, fontWeight: 900, letterSpacing: 3, borderRadius: '8px 8px 0 0', marginBottom: 8 }}>
                {etapa}
              </div>
            )}
            {pares.map((par, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                {par.map((c, ci) => c ? (
                  <div key={ci} style={{ flex: 1, border: `2px solid ${tema.accent}`, borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <div style={{ background: tema.light, padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${tema.accent}`, borderRadius: '6px 6px 0 0', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontWeight: 900, fontSize: 17, color: tema.header, letterSpacing: 1 }}>CRUCE {c.round}</span>
                      <span style={{ fontSize: 16, color: tema.accent, fontWeight: 600 }}>
                        {c.hora ? `🕐 ${c.hora}` : ''} {c.fecha ? `📅 ${c.fecha}` : ''}
                      </span>
                      {c.resultado && <span style={{ fontWeight: 900, color: tema.header, fontSize: 20 }}>{c.resultado}</span>}
                    </div>
                    <JRow j={c.jugadorA} tema={tema} border />
                    <JRow j={c.jugadorB} tema={tema} />
                    {c.sede && (
                      <div style={{ background: tema.header, color: '#fff', padding: '7px 14px', fontSize: 16, fontWeight: 600 }}>
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

function PubContenido({ data, tema, notas }: { data: any; tema: any; notas: string }) {
  return (
    <>
      <PubHeader data={data} tema={tema} />
      {data.tipo === 'series'    && <PlantillaSeries    data={data} tema={tema} />}
      {data.tipo === 'reduccion' && <PlantillaReduccion data={data} tema={tema} />}
      {data.tipo === 'cruces'    && <PlantillaCruces    data={data} tema={tema} />}
      <PubFooter notas={notas} tema={tema} />
    </>
  );
}

export default function AdminPublicacionesPage() {
  const { user } = useAuth();
  const esAdmin = user?.role === 'admin';

  const [torneos, setTorneos] = useState<any[]>([]);
  const [circuitId, setCircuitId] = useState('');
  const [tipoFase, setTipoFase] = useState('clasificatorio');
  const [pubData, setPubData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/publicaciones/circuitos').then(r => {
      setTorneos(r.data);
      if (r.data.length > 0 && r.data[0].circuits?.length > 0) {
        // Seleccionar el circuito con mayor order por defecto
        const circuits = r.data[0].circuits;
        const maxOrder = Math.max(...circuits.map((c: any) => c.order ?? 0));
        const ultimo = circuits.find((c: any) => c.order === maxOrder) ?? circuits[0];
        setCircuitId(String(ultimo.id));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (wrapperRef.current && exportRef.current) {
      const h = exportRef.current.scrollHeight * 0.5;
      wrapperRef.current.style.height = `${h}px`;
    }
  }, [pubData, notas]);

  const cargar = async () => {
    if (!circuitId) return;
    setLoading(true); setError(''); setPubData(null);
    try {
      const res = await api.get(`/publicaciones/${circuitId}/${tipoFase}`);
      setPubData(res.data); setNotas('');
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al cargar los datos');
    } finally { setLoading(false); }
  };

  const exportar = async () => {
    if (!exportRef.current) return;
    setExportando(true);
    try {
      const h2c = await cargarHtml2Canvas();
      const canvas = await h2c(exportRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: exportRef.current.scrollWidth,
        height: exportRef.current.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `${pubData?.fase ?? 'publicacion'} - ${pubData?.circuito ?? ''}.png`.replace(/[/\\?%*:|"<>]/g, '-');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (e: any) {
      alert(`Error al exportar: ${e.message}`);
    } finally { setExportando(false); }
  };

  const tema = TEMAS[tipoFase] ?? TEMAS.clasificatorio;
  const circuitos = torneos.flatMap((t: any) =>
    (t.circuits ?? []).map((c: any) => ({ ...c, torneoNombre: t.name }))
  );

  return (
    <div>
      {/* DIV OCULTO para exportar — solo se usa en modo admin */}
      {pubData && esAdmin && (
        <div
          ref={exportRef}
          style={{ position: 'absolute', left: '-9999px', top: 0, width: '1080px', fontFamily: F, background: '#ffffff', lineHeight: 1.3 }}
        >
          <PubContenido data={pubData} tema={tema} notas={notas} />
        </div>
      )}

      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">PUBLICACIONES</h1>
        <p className="text-chalk/50 text-sm mt-1">
          {esAdmin ? 'Generación y exportación de gráficos para difusión' : 'Gráficos del torneo'}
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Controles de selección — visibles para todos */}
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
                {loading ? 'Cargando...' : '👁 Ver publicación'}
              </button>
            </div>
          </div>

          {/* Nota al pie y exportar — SOLO ADMIN */}
          {esAdmin && pubData && (
            <>
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nota al pie (opcional)</label>
                <textarea
                  className="input w-full" rows={2}
                  placeholder="Ej: Los ganadores pasan a la siguiente fase..."
                  value={notas} onChange={e => setNotas(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <button className="btn-primary px-8" disabled={exportando} onClick={exportar}>
                  {exportando ? 'Exportando...' : '⬇ Exportar PNG'}
                </button>
                <span className="text-chalk/30 text-xs">3240px · Alta resolución · WhatsApp y redes</span>
              </div>
            </>
          )}
        </div>

        {error && <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
        {loading && <LoadingSpinner />}

        {/* Vista previa */}
        {pubData && !loading && (
          <div>
            <p className="text-chalk/40 text-xs uppercase tracking-widest mb-3">
              {pubData.tipo === 'series' ? `${pubData.series?.length ?? 0} series` : `${pubData.cruces?.length ?? 0} cruces`}
            </p>
            <div
              ref={wrapperRef}
              style={{ width: '540px', overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              <div style={{ width: '1080px', transform: 'scale(0.5)', transformOrigin: 'top left', fontFamily: F, background: '#ffffff', lineHeight: 1.3 }}>
                <PubContenido data={pubData} tema={tema} notas={notas} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
