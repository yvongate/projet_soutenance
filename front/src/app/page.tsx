'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';

/**
 * Page d'accueil publique (landing) servie sur `/`.
 * Un utilisateur déjà connecté est redirigé vers son tableau de bord `/accueil`.
 * Le markup et le style sont autonomes (scopés sous `.landing-page`) pour ne
 * pas interférer avec le reste de l'app.
 */
export default function Home() {
  const { token, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && token) router.replace('/accueil');
  }, [hydrated, token, router]);

  // Déjà connecté : on ne montre pas la landing (évite le flash avant redirection)
  if (hydrated && token) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        className="landing-page"
        dangerouslySetInnerHTML={{ __html: MARKUP }}
      />
    </>
  );
}

const CSS = `
.landing-page{
  --indigo:oklch(0.52 0.22 264);
  --indigo-deep:oklch(0.46 0.205 265);
  --ink:oklch(0.22 0.02 265);
  --muted:oklch(0.46 0.015 265);
  --paper:oklch(0.985 0.004 260);
  --line:oklch(0.92 0.005 260);
  --green:oklch(0.62 0.15 150);
  --amber:oklch(0.72 0.15 72);
  --font:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-family:var(--font);background:var(--paper);color:var(--ink);min-height:100vh;
  -webkit-font-smoothing:antialiased;
}
.landing-page *{box-sizing:border-box}
.landing-page a{text-decoration:none;color:inherit}
.landing-page .page{min-height:100vh;display:flex;flex-direction:column}

.landing-page nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
  padding:18px 40px;background:#fff;border-bottom:1px solid var(--line)}
.landing-page .nav-links{display:flex;gap:24px;align-items:center;white-space:nowrap;min-width:0}
.landing-page .nav-links a{color:var(--muted);font-size:15px;font-weight:500;transition:color .15s}
.landing-page .nav-links a:first-child{color:var(--ink)}
.landing-page .nav-links a:hover{color:var(--indigo)}
.landing-page .brand{display:flex;align-items:center;gap:10px;justify-self:center}
.landing-page .brand-mark{width:34px;height:34px;border-radius:10px;background:var(--indigo);
  display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px -4px var(--indigo)}
.landing-page .brand-name{font-size:20px;font-weight:750;color:var(--ink);letter-spacing:-0.02em}
.landing-page .nav-actions{display:flex;align-items:center;gap:12px;justify-self:end}
.landing-page .btn{border-radius:9px;font-size:14px;font-weight:650;cursor:pointer;
  transition:transform .12s,box-shadow .2s;display:inline-flex;align-items:center;gap:8px}
.landing-page .btn:active{transform:translateY(1px)}
.landing-page .btn-ghost{padding:9px 18px;border:1px solid var(--line);background:#fff;color:var(--ink)}
.landing-page .btn-ghost:hover{border-color:var(--indigo);color:var(--indigo)}
.landing-page .btn-primary{padding:10px 22px;border:none;background:var(--indigo);color:#fff}
.landing-page .btn-primary:hover{box-shadow:0 8px 20px -6px var(--indigo)}

.landing-page .hero{flex:1;position:relative;background:var(--indigo);overflow:hidden;display:flex}
.landing-page .hero::before{content:"";position:absolute;inset:0;
  background:linear-gradient(115deg,var(--indigo) 0%,var(--indigo) 52%,var(--indigo-deep) 54%,var(--indigo-deep) 100%)}
.landing-page .hero::after{content:"";position:absolute;width:520px;height:520px;border-radius:50%;
  right:-140px;top:-160px;background:radial-gradient(circle,oklch(1 0 0 / 0.10),transparent 70%)}
.landing-page .hero-inner{position:relative;display:flex;flex:1;align-items:stretch}
.landing-page .hero-copy{flex:1;display:flex;align-items:center;padding:56px 4vw 56px 64px;max-width:660px}
.landing-page .eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;
  background:oklch(1 0 0 / 0.14);color:#fff;font-size:13px;font-weight:600;margin-bottom:22px;
  border:1px solid oklch(1 0 0 / 0.18)}
.landing-page .eyebrow .dot{width:7px;height:7px;border-radius:50%;background:var(--green)}
.landing-page h1{font-size:clamp(34px,4.4vw,52px);line-height:1.1;font-weight:800;color:#fff;
  margin:0 0 22px;letter-spacing:-0.025em;text-wrap:balance}
.landing-page h1 .hl{color:oklch(0.9 0.09 200)}
.landing-page .lede{font-size:17px;line-height:1.7;color:oklch(0.96 0.02 265 / 0.92);
  margin:0 0 32px;max-width:500px}
.landing-page .cta-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:30px}
.landing-page .btn-lg{padding:14px 28px;border-radius:11px;font-size:15px;font-weight:700}
.landing-page .btn-white{background:#fff;color:var(--indigo);border:none}
.landing-page .btn-white:hover{box-shadow:0 12px 28px -8px oklch(0 0 0 / 0.4)}
.landing-page .btn-outline{background:transparent;color:#fff;border:1.5px solid oklch(1 0 0 / 0.55)}
.landing-page .btn-outline:hover{background:oklch(1 0 0 / 0.1)}
.landing-page .pills{display:flex;gap:10px;flex-wrap:wrap}
.landing-page .pill{display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;
  background:oklch(1 0 0 / 0.1);color:oklch(0.97 0.02 265);font-size:13px;font-weight:550;
  border:1px solid oklch(1 0 0 / 0.12)}
.landing-page .pill svg{width:14px;height:14px}

.landing-page .hero-visual{flex:1;display:flex;align-items:center;justify-content:center;padding:36px 40px}
.landing-page .phone{width:288px;height:596px;border-radius:44px;background:#0d0e16;padding:11px;
  box-shadow:0 44px 90px -24px oklch(0 0 0 / 0.55);flex-shrink:0}
.landing-page .screen{width:100%;height:100%;border-radius:34px;overflow:hidden;position:relative;
  background:var(--paper);display:flex;flex-direction:column}
.landing-page .notch{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:96px;height:22px;
  background:#0d0e16;border-radius:12px;z-index:6}
.landing-page .app-top{background:#fff;padding:30px 18px 12px;border-bottom:1px solid var(--line)}
.landing-page .app-bar{display:flex;align-items:center;justify-content:space-between}
.landing-page .app-brand{display:flex;align-items:center;gap:7px}
.landing-page .app-brand .m{width:22px;height:22px;border-radius:7px;background:var(--indigo);
  display:flex;align-items:center;justify-content:center}
.landing-page .app-brand span{font-size:15px;font-weight:750;letter-spacing:-0.01em}
.landing-page .app-bell{position:relative;color:var(--muted)}
.landing-page .app-bell .bdg{position:absolute;top:-3px;right:-3px;width:9px;height:9px;border-radius:50%;
  background:oklch(0.6 0.2 25);border:1.5px solid #fff}
.landing-page .app-search{margin-top:14px;display:flex;align-items:center;gap:8px;background:var(--paper);
  border:1px solid var(--line);border-radius:10px;padding:9px 12px;color:var(--muted);font-size:12.5px}
.landing-page .app-body{flex:1;overflow:hidden;padding:14px 16px;display:flex;flex-direction:column;gap:12px}
.landing-page .greet{font-size:16px;font-weight:750;letter-spacing:-0.01em}
.landing-page .cta-card{background:var(--indigo);border-radius:14px;padding:14px 16px;color:#fff;
  display:flex;align-items:center;justify-content:space-between;gap:10px}
.landing-page .cta-card .t{font-size:13.5px;font-weight:700}
.landing-page .cta-card .s{font-size:11px;opacity:.85;margin-top:2px;line-height:1.4}
.landing-page .cta-card .ic{width:34px;height:34px;border-radius:10px;background:oklch(1 0 0 / 0.16);
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.landing-page .sec-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;
  color:var(--muted);margin-top:2px}
.landing-page .book{display:flex;gap:11px;align-items:center;background:#fff;border:1px solid var(--line);
  border-radius:12px;padding:9px}
.landing-page .cover{width:38px;height:52px;border-radius:6px;flex-shrink:0;display:flex;align-items:flex-end;
  padding:5px;color:#fff}
.landing-page .cover span{font-size:8px;font-weight:700;line-height:1.1}
.landing-page .book-meta{min-width:0;flex:1}
.landing-page .book-t{font-size:12.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.landing-page .book-a{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.landing-page .badge{display:inline-flex;align-items:center;gap:4px;margin-top:5px;font-size:10px;
  font-weight:650;padding:2px 7px;border-radius:999px}
.landing-page .badge.ok{color:var(--green);background:oklch(0.62 0.15 150 / 0.12)}
.landing-page .badge.no{color:var(--amber);background:oklch(0.72 0.15 72 / 0.14)}
.landing-page .badge .d{width:5px;height:5px;border-radius:50%;background:currentColor}
.landing-page .app-nav{background:#fff;border-top:1px solid var(--line);display:flex;padding:8px 6px 14px}
.landing-page .app-nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;
  color:var(--muted);font-size:9px;font-weight:600}
.landing-page .app-nav a.on{color:var(--indigo)}
.landing-page .app-nav svg{width:19px;height:19px}

@media(max-width:900px){
  .landing-page nav{grid-template-columns:auto 1fr;padding:16px 22px}
  .landing-page .nav-links{display:none}
  .landing-page .brand{justify-self:start}
  .landing-page .hero-inner{flex-direction:column}
  .landing-page .hero-copy{padding:48px 28px 8px;max-width:none;text-align:center;justify-content:center}
  .landing-page .eyebrow,.landing-page .cta-row,.landing-page .pills{margin-left:auto;margin-right:auto}
  .landing-page .cta-row,.landing-page .pills{justify-content:center}
  .landing-page .lede{margin-left:auto;margin-right:auto}
  .landing-page .hero-visual{padding:16px 24px 44px}
  .landing-page .phone{transform:scale(0.94)}
}
@media(max-width:420px){ .landing-page .nav-actions .btn-ghost{display:none} }
@media(prefers-reduced-motion:reduce){ .landing-page *{transition:none!important} }
`;

const MARKUP = `
<div class="page">
  <nav>
    <div class="nav-links">
      <a href="/login">Accueil</a>
      <a href="/login">Fonctionnalités</a>
      <a href="/login">Catalogue</a>
      <a href="/login">À&nbsp;propos</a>
    </div>
    <div class="brand">
      <div class="brand-mark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <span class="brand-name">BiblioSmart</span>
    </div>
    <div class="nav-actions">
      <a class="btn btn-primary" href="/login">Explorer le catalogue</a>
    </div>
  </nav>

  <section class="hero">
    <div class="hero-inner">
      <div class="hero-copy">
        <div>
          <span class="eyebrow"><span class="dot"></span>Bibliothèque universitaire · PWA</span>
          <h1>Votre bibliothèque, <span class="hl">dans votre poche.</span></h1>
          <p class="lede">Cherchez dans le catalogue, empruntez un livre en scannant son QR&nbsp;Code, réservez les ouvrages indisponibles et recevez des recommandations personnalisées — le tout depuis une application installable sur votre téléphone.</p>
          <div class="cta-row">
            <a class="btn btn-lg btn-white" href="/login">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M20 20h.01M17 20h.01M20 17h.01"/></svg>
              Se connecter
            </a>
            <a class="btn btn-lg btn-outline" href="/login">En savoir plus</a>
          </div>
          <div class="pills">
            <span class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/></svg>Emprunt par scan</span>
            <span class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>Réservations</span>
            <span class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.5L18 9l-4.1 1.5L12 15l-1.9-4.5L6 9l4.1-1.5z"/></svg>Recommandations</span>
            <span class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5a7 7 0 0 1 14 0"/><path d="M2 9a11 11 0 0 1 20 0"/><circle cx="12" cy="18" r="1.5"/></svg>Mode hors-ligne</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="phone">
          <div class="screen">
            <div class="notch"></div>
            <div class="app-top">
              <div class="app-bar">
                <div class="app-brand">
                  <div class="m"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                  <span>BiblioSmart</span>
                </div>
                <div class="app-bell">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  <span class="bdg"></span>
                </div>
              </div>
              <div class="app-search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                Rechercher un livre…
              </div>
            </div>
            <div class="app-body">
              <div class="greet">Bonjour Awa 👋</div>
              <div class="cta-card">
                <div>
                  <div class="t">Emprunter un livre</div>
                  <div class="s">Scannez le QR d'un livre au&nbsp;guichet</div>
                </div>
                <div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/></svg></div>
              </div>
              <div class="sec-label">Suggestions pour vous</div>
              <div class="book">
                <div class="cover" style="background:oklch(0.55 0.16 28)"><span>L'Étranger</span></div>
                <div class="book-meta">
                  <div class="book-t">L'Étranger</div>
                  <div class="book-a">Albert Camus</div>
                  <span class="badge ok"><span class="d"></span>3 disponibles</span>
                </div>
              </div>
              <div class="book">
                <div class="cover" style="background:oklch(0.5 0.13 250)"><span>Clean Code</span></div>
                <div class="book-meta">
                  <div class="book-t">Clean Code</div>
                  <div class="book-a">Robert C. Martin</div>
                  <span class="badge no"><span class="d"></span>Sur réservation</span>
                </div>
              </div>
              <div class="book">
                <div class="cover" style="background:oklch(0.52 0.14 155)"><span>1984</span></div>
                <div class="book-meta">
                  <div class="book-t">1984</div>
                  <div class="book-a">George Orwell</div>
                  <span class="badge ok"><span class="d"></span>1 disponible</span>
                </div>
              </div>
            </div>
            <div class="app-nav">
              <a class="on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>Accueil</a>
              <a><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>Catalogue</a>
              <a><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/></svg>Emprunts</a>
              <a><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>Profil</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>
`;
