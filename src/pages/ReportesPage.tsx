import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Report {
  id: number;
  tipo: string;
  titulo: string;
  contenido: any;
  texto: string;
  createdAt: string;
}

export default function ReportesPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState<number | null>(null);

  useEffect(() => {
    api.get('/reports').then(r => { setReports(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const copiar = async (report: Report) => {
    try { await navigator.clipboard.writeText(report.texto); }
    catch {
      const el = document.createElement('textarea');
      el.value = report.texto;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiado(report.id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const formatFecha = (d: string) => new Date(d).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

  if (loading) return (
    <div className="min-h-screen bg-carbon-100 flex items-center justify-center">
      <span className="text-gold font-display text-2xl">Cargando...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-carbon-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl text-gold mb-1">RESULTADOS</h1>
          <p className="text-chalk/50 text-sm">Departamental Montevideo — FEBIU</p>
        </div>

        {reports.length === 0 ? (
          <div className="text-center text-chalk/30 py-16">No hay resultados publicados aún.</div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                copiado={copiado === report.id}
                onCopiar={() => copiar(report)}
                formatFecha={formatFecha}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCard({ report, copiado, onCopiar, formatFecha }: {
  report: any; copiado: boolean; onCopiar: () => void; formatFecha: (d: string) => string
}) {
  const c = report.contenido;
  const esSerie = report.tipo === 'serie';

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`badge-status text-xs mr-2 ${esSerie ? 'bg-blue-900/30 text-blue-400' : 'bg-gold/20 text-gold'}`}>
            {esSerie ? 'Serie' : 'Cruce'}
          </span>
          <span className="text-chalk/30 text-xs font-mono">{formatFecha(report.createdAt)}</span>
        </div>
        <button
          onClick={onCopiar}
          className={`text-xs px-3 py-1 rounded border transition-all ${copiado ? 'border-green-500/40 text-green-400 bg-green-900/20' : 'border-gold/30 text-gold/70 hover:bg-gold/10'}`}
        >
          {copiado ? '✓ Copiado' : '📋 Copiar WhatsApp'}
        </button>
      </div>

      <h2 className="font-display text-xl text-gold mb-3">{c.titulo}</h2>

      {esSerie ? <SerieContent c={c} /> : <CruceContent c={c} />}
    </div>
  );
}

function SerieContent({ c }: { c: any }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {(c.resultados ?? []).map((r: any) => (
          <div key={r.numero} className="flex items-center gap-2 text-sm">
            <span className="text-chalk/30 font-mono w-6">P{r.numero}</span>
            <span className={`flex-1 text-right ${r.setsA > r.setsB ? 'text-chalk font-semibold' : 'text-chalk/50'}`}>{r.jugadorA}</span>
            <span className="text-gold font-mono font-bold w-10 text-center">{r.setsA}-{r.setsB}</span>
            <span className={`flex-1 ${r.setsB > r.setsA ? 'text-chalk font-semibold' : 'text-chalk/50'}`}>{r.jugadorB}</span>
            {r.isWO && <span className="text-red-400 text-xs">W.O.</span>}
          </div>
        ))}
      </div>

      {c.clasificados?.length > 0 && (
        <div className="pt-2 border-t border-felt-light/10">
          <p className="text-xs text-chalk/40 uppercase tracking-widest mb-1">Clasificados</p>
          {c.clasificados.map((cl: any) => (
            <div key={cl.puesto} className="flex items-center gap-2 text-sm">
              <span className="text-gold">{cl.puesto === 1 ? '1️⃣' : '2️⃣'}</span>
              <span className="text-chalk font-semibold">{cl.jugador}</span>
            </div>
          ))}
        </div>
      )}

      {c.nextMatches?.length > 0 && (
        <div className="pt-2 border-t border-felt-light/10">
          <p className="text-xs text-chalk/40 uppercase tracking-widest mb-1">Próximos partidos</p>
          {c.nextMatches.map((nm: any, i: number) => <NextMatchInfo key={i} nm={nm} />)}
        </div>
      )}
    </div>
  );
}

function CruceContent({ c }: { c: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={`flex-1 text-right font-semibold ${c.setsA > c.setsB ? 'text-chalk' : 'text-chalk/50'}`}>{c.jugadorA}</span>
        <span className="text-gold font-mono font-bold text-lg">{c.setsA}-{c.setsB}</span>
        <span className={`flex-1 font-semibold ${c.setsB > c.setsA ? 'text-chalk' : 'text-chalk/50'}`}>{c.jugadorB}</span>
      </div>

      {c.sets?.length > 0 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {c.sets.map((s: any) => (
            <span key={s.setNumber} className="text-xs text-chalk/40 font-mono">
              S{s.setNumber}: {s.pointsA}-{s.pointsB}
            </span>
          ))}
        </div>
      )}

      {c.isWO && <p className="text-center text-red-400 text-xs">W.O.</p>}

      <div className="pt-2 border-t border-felt-light/10">
        <p className="text-xs text-chalk/40 uppercase tracking-widest mb-1">Avanza</p>
        <p className="text-chalk font-semibold">✅ {c.ganador}</p>
      </div>

      {c.nextMatch && (
        <div className="pt-2 border-t border-felt-light/10">
          <p className="text-xs text-chalk/40 uppercase tracking-widest mb-1">Próximo partido</p>
          <NextMatchInfo nm={c.nextMatch} />
        </div>
      )}
    </div>
  );
}

function NextMatchInfo({ nm }: { nm: any }) {
  if (!nm) return null;
  return (
    <div className="text-sm space-y-0.5">
      <p className="text-chalk/80">{nm.jugadorA} <span className="text-chalk/30">vs</span> {nm.jugadorB}</p>
      {nm.sede && <p className="text-chalk/40 text-xs font-mono">🏛 {nm.sede}{nm.mesa ? ` · Mesa ${nm.mesa}` : ''}</p>}
      {nm.scheduledAt && <p className="text-chalk/40 text-xs font-mono">📅 {new Date(nm.scheduledAt).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}hs</p>}
    </div>
  );
}
