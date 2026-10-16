import { useEffect, useState } from 'react';

// Boton grande "Instalar app". Android/Chrome: instala con un toque (sin pasos).
// iPhone (Safari): Apple no permite instalar con un boton; se muestra un cartel minimo con una flecha.
declare global { interface Window { __pwaPrompt?: any } }

const esStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;

export default function BotonInstalar() {
  const [prompt, setPrompt] = useState<any>(window.__pwaPrompt ?? null);
  const [instalada, setInstalada] = useState(esStandalone());
  const [oculto, setOculto] = useState(() => { try { return sessionStorage.getItem('pwa-oculto') === '1'; } catch { return false; } });
  const [ayudaIOS, setAyudaIOS] = useState(false);

  const ua = navigator.userAgent;
  const esIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  // Samsung Internet instala un paquete viejo que Android 14+ bloquea (Play Protect): hay que usar Chrome
  const esSamsung = /SamsungBrowser/i.test(ua) && /Android/i.test(ua);
  const esSafariIOS = esIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

  useEffect(() => {
    const onPrompt = (e: any) => { e.preventDefault(); window.__pwaPrompt = e; setPrompt(e); };
    const onInstalled = () => { setInstalada(true); window.__pwaPrompt = undefined; setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (instalada || oculto) return null;
  if (!esSamsung && !prompt && !esSafariIOS) return null;

  const cerrar = () => { setOculto(true); try { sessionStorage.setItem('pwa-oculto', '1'); } catch {} };
  const abrirEnChrome = () => {
    const u = window.location;
    const web = encodeURIComponent(u.href);
    window.location.href = `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${web};end`;
  };
  const instalar = async () => {
    if (esSamsung) { abrirEnChrome(); return; }
    if (prompt) {
      prompt.prompt();
      try { await prompt.userChoice; } catch {}
      window.__pwaPrompt = undefined; setPrompt(null);
    } else {
      setAyudaIOS(true);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999, padding: '10px 12px calc(10px + env(safe-area-inset-bottom))', background: 'rgba(10,10,10,.92)', borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={instalar}
          style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 12px', fontSize: esSamsung ? 17 : 20, fontWeight: 800, letterSpacing: '.02em' }}>
          {esSamsung ? '🌐 ABRIR EN CHROME PARA INSTALAR' : '📲 INSTALAR APP'}
        </button>
        <button onClick={cerrar} aria-label="Cerrar"
          style={{ background: 'transparent', color: '#aaa', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '14px 16px', fontSize: 18 }}>✕</button>
      </div>
      {ayudaIOS && (
        <div onClick={() => setAyudaIOS(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,.75)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', padding: 24, paddingBottom: 90 }}>
          <div style={{ background: '#fff', color: '#111', borderRadius: 18, padding: '22px 20px', textAlign: 'center', maxWidth: 360, fontSize: 20, fontWeight: 700, lineHeight: 1.35 }}>
            Tocá <span style={{ fontSize: 30 }}>⬆️</span> abajo<br />y elegí<br /><span style={{ color: '#16a34a' }}>“Agregar a inicio”</span>
          </div>
          <div style={{ fontSize: 46, color: '#fff', marginTop: 8 }}>⬇️</div>
        </div>
      )}
    </>
  );
}
