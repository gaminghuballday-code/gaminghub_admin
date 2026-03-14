import { useEffect, useRef } from 'react';
import { ANDROID_APK_URL, STATIC_ROUTES } from '@utils/constants';
import boyaahxfavi2Img from '@assets/boyaahxfavi2.png';
import './Downloads.scss';

const TICKER_ITEMS = [
  '🏆 Win Cash',
  'Free Fire Tournaments',
  'Instant UPI Withdrawal',
  '1v1 & Squad Battles',
  'Bank-Grade Security',
  'Play Daily — Earn Daily',
];

const Downloads: React.FC = () => {
  const hasAndroidLink = ANDROID_APK_URL.trim().length > 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let stars: Array<{
      x: number;
      y: number;
      r: number;
      a: number;
      tw: number;
      ts: number;
      c: string;
    }> = [];
    let nebulae: Array<{
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      h: string;
      al: number;
      ph: number;
    }> = [];
    let shooters: Array<{
      x: number;
      y: number;
      dx: number;
      dy: number;
      life: number;
      decay: number;
      len: number;
    }> = [];
    let pmx = 0.5;
    let pmy = 0.5;
    let rafId = 0;
    let lastMouse = 0;
    const MOUSE_THROTTLE = 64; // ~15fps for parallax
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isNarrow = () => window.innerWidth < 768;

    const handleResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      stars = [];
      nebulae = [];
      const rawCount = Math.floor((W * H) / 1800);
      const n = isNarrow() ? Math.min(rawCount, 180) : Math.min(rawCount, 520);
      for (let i = 0; i < n; i++) {
        const t = Math.random();
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: t > 0.97 ? Math.random() * 1.6 + 0.8 : t > 0.86 ? Math.random() * 0.8 + 0.35 : Math.random() * 0.35 + 0.1,
          a: Math.random() * 0.65 + 0.25,
          tw: Math.random() * Math.PI * 2,
          ts: Math.random() * 0.006 + 0.002,
          c: Math.random() > 0.65 ? 'rgba(180,215,255,' : 'rgba(230,242,255,',
        });
      }
      [
        { cx: 0.15, cy: 0.2, rx: 600, ry: 400, h: 'rgba(0,60,180,' },
        { cx: 0.85, cy: 0.7, rx: 500, ry: 380, h: 'rgba(0,40,140,' },
        { cx: 0.5, cy: 0.5, rx: 400, ry: 500, h: 'rgba(0,30,120,' },
        { cx: 0.3, cy: 0.8, rx: 450, ry: 300, h: 'rgba(0,50,160,' },
      ].forEach((n) => nebulae.push({ ...n, al: Math.random() * 0.14 + 0.08, ph: Math.random() * Math.PI * 2 }));
    };

    const drawStaticFrame = () => {
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      bg.addColorStop(0, 'rgba(0,4,20,.6)');
      bg.addColorStop(1, 'rgba(0,0,10,.95)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      const core = ctx.createRadialGradient(W * 0.52, H * 0.48, 0, W * 0.52, H * 0.48, W * 0.3);
      core.addColorStop(0, 'rgba(0,80,200,.08)');
      core.addColorStop(0.4, 'rgba(0,40,120,.04)');
      core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, W, H);
      stars.forEach((s) => {
        const a = s.a * 0.7;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.c + a + ')';
        ctx.fill();
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMouse < MOUSE_THROTTLE) return;
      lastMouse = now;
      pmx = e.clientX / window.innerWidth;
      pmy = e.clientY / window.innerHeight;
    };

    const spawnShooter = () => {
      if (isNarrow() || Math.random() > 0.007) return;
      const s = Math.random() > 0.5;
      shooters.push({
        x: s ? 0 : W,
        y: Math.random() * H * 0.6,
        dx: (s ? 1 : -1) * (Math.random() * 4 + 3),
        dy: Math.random() * 2 + 1,
        life: 1,
        decay: Math.random() * 0.014 + 0.008,
        len: Math.random() * 120 + 60,
      });
    };

    const draw = () => {
      if (document.hidden) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      if (isNarrow()) {
        drawStaticFrame();
        rafId = 0;
        return;
      }
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      bg.addColorStop(0, 'rgba(0,4,20,.6)');
      bg.addColorStop(1, 'rgba(0,0,10,.95)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const t = Date.now() * 0.001;
      const narrow = isNarrow();

      if (!narrow) {
        nebulae.forEach((n) => {
          const a = n.al * (0.7 + 0.3 * Math.sin(t * 0.3 + n.ph));
          const px = n.cx * W + (pmx - 0.5) * -40;
          const py = n.cy * H + (pmy - 0.5) * -30;
          const mx2 = Math.max(n.rx, n.ry);
          const grd = ctx.createRadialGradient(px, py, 0, px, py, mx2);
          grd.addColorStop(0, n.h + a + ')');
          grd.addColorStop(0.5, n.h + a * 0.4 + ')');
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.save();
          ctx.scale(n.rx / mx2, n.ry / mx2);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(px * (mx2 / n.rx), py * (mx2 / n.ry), mx2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      const core = ctx.createRadialGradient(W * 0.52, H * 0.48, 0, W * 0.52, H * 0.48, W * 0.3);
      core.addColorStop(0, 'rgba(0,80,200,.08)');
      core.addColorStop(0.4, 'rgba(0,40,120,.04)');
      core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, W, H);

      stars.forEach((s) => {
        s.tw += s.ts;
        const a = s.a * (0.4 + 0.6 * Math.sin(s.tw));
        const d = s.r / 2.4;
        const px = narrow ? s.x : s.x + (pmx - 0.5) * d * 35;
        const py = narrow ? s.y : s.y + (pmy - 0.5) * d * 25;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.c + a + ')';
        ctx.fill();
        if (!narrow && s.r > 0.8) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, s.r * 6);
          g.addColorStop(0, `rgba(0,190,255,${a * 0.3})`);
          g.addColorStop(1, 'rgba(0,80,200,0)');
          ctx.beginPath();
          ctx.arc(px, py, s.r * 6, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
      });

      spawnShooter();
      shooters = shooters.filter((s) => s.life > 0);
      shooters.forEach((s) => {
        const spd = Math.sqrt(s.dx * s.dx + s.dy * s.dy);
        const tail = ctx.createLinearGradient(
          s.x,
          s.y,
          s.x - s.dx * (s.len / spd),
          s.y - s.dy * (s.len / spd)
        );
        tail.addColorStop(0, `rgba(180,230,255,${s.life})`);
        tail.addColorStop(0.4, `rgba(0,200,255,${s.life * 0.5})`);
        tail.addColorStop(1, 'rgba(0,100,200,0)');
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.dx * (s.len / spd), s.y - s.dy * (s.len / spd));
        ctx.strokeStyle = tail;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        s.x += s.dx;
        s.y += s.dy;
        s.life -= s.decay;
      });

      rafId = requestAnimationFrame(draw);
    };

    const handleResizeAndMode = () => {
      handleResize();
      if (isNarrow()) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        if (!isReducedMotion) drawStaticFrame();
        else {
          ctx.fillStyle = 'rgba(0,4,20,.95)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (!rafId && !isReducedMotion) {
        draw();
      }
    };

    handleResizeAndMode();

    window.addEventListener('resize', handleResizeAndMode);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResizeAndMode);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const count = (el: Element) => {
      const tar = +(el.getAttribute('data-count') ?? 0);
      const pre = el.getAttribute('data-prefix') ?? '';
      const dur = 2400;
      const s = performance.now();

      const tick = (n: number) => {
        const p = Math.min((n - s) / dur, 1);
        const e = 1 - Math.pow(1 - p, 4);
        const v = Math.floor(e * tar);
        el.textContent = pre + (v >= 1000 ? v.toLocaleString('en-IN') : String(v));
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = pre + tar.toLocaleString('en-IN');
      };
      tick(s);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((x) => {
          if (x.isIntersecting) {
            x.target.classList.add('dl-v');
            io.unobserve(x.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((x) => {
          if (x.isIntersecting) {
            count(x.target);
            co.unobserve(x.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    const revealEls = document.querySelectorAll('.downloads-landing .dl-r');
    const countEls = document.querySelectorAll('.downloads-landing [data-count]');

    revealEls.forEach((el) => io.observe(el));
    countEls.forEach((el) => co.observe(el));

    return () => {
      io.disconnect();
      co.disconnect();
    };
  }, []);

  const downloadHref = hasAndroidLink ? ANDROID_APK_URL : '#';
  const preventDisabled = (e: React.MouseEvent) => {
    if (!hasAndroidLink) e.preventDefault();
  };

  return (
    <div className="downloads-landing">
      <div className="dl-grain" aria-hidden />
      <canvas ref={canvasRef} className="dl-gc" aria-hidden />

      <nav className="dl-nav">
        <a href={STATIC_ROUTES.DOWNLOADS} className="dl-logo">
          <img src="/favicon.png" alt="" className="dl-logo-icon" aria-hidden />
          BOOYAH<em>X</em>
        </a>
        <div className="dl-nav-links">
          <a href="#features" className="dl-nl">
            Features
          </a>
          <a href="#how" className="dl-nl">
            How It Works
          </a>
          <a href="#download" className="dl-nl">
            Download
          </a>
          <a
            href={downloadHref}
            className={`dl-nav-btn ${!hasAndroidLink ? 'dl-nav-btn--disabled' : ''}`}
            download={hasAndroidLink || undefined}
            onClick={preventDisabled}
          >
            Get APK
          </a>
        </div>
      </nav>

      <div className="dl-tk">
        <div className="dl-tk-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="dl-tk-item">
              {item} <span className="d">◆</span>
            </span>
          ))}
        </div>
      </div>

      <section className="dl-hero" id="home">
        <div className="dl-hero-burst" aria-hidden />
        <div className="dl-hring dl-hr1" aria-hidden />
        <div className="dl-hring dl-hr2" aria-hidden />
        <div className="dl-hring dl-hr3" aria-hidden />

        <div className="dl-hero-badge">
          <span className="dot" aria-hidden />
          India&apos;s #1 Real Cash Tournament App — Now Live
        </div>

        <div className="dl-hero-logo">
          <img src={boyaahxfavi2Img} alt="" />
          <span className="dl-hero-logo-name">Booyah<em>X</em></span>
        </div>

        <h1 className="dl-headline">
          <span className="l1">PLAY FREE FIRE.</span>
          <span className="l2">EARN REAL CASH.</span>
        </h1>

        <div className="dl-hero-line">
          <div className="dl-hero-line-dot" aria-hidden />
        </div>

        <p className="dl-hero-sub">
          Enter tournaments, compete with players across India, and withdraw your winnings instantly
          via UPI. No delays. No excuses. Just victory.
        </p>

        <div className="dl-stats">
          <div className="dl-stat">
            <div className="dl-stat-n" data-count="5000">
              0
            </div>
            <div className="dl-stat-l">Active Players</div>
          </div>
          <div className="dl-stat">
            <div className="dl-stat-n" data-count="40">
              0
            </div>
            <div className="dl-stat-l">Daily Tournaments</div>
          </div>
          <div className="dl-stat">
            <div className="dl-stat-n" data-prefix="₹" data-count="5000">
              0
            </div>
            <div className="dl-stat-l">Prize Pool Distributed</div>
          </div>
        </div>

        <a
          href={downloadHref}
          className={`dl-btn ${!hasAndroidLink ? 'dl-btn--disabled' : ''}`}
          download={hasAndroidLink || undefined}
          onClick={preventDisabled}
        >
          <div className="dl-shine" aria-hidden />
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 4h14v-2H5v2z" />
          </svg>
          {hasAndroidLink ? 'Download APK — Free' : 'Android download link coming soon'}
        </a>
        <p className="dl-hero-note">
          Android 6.0+ &nbsp;·&nbsp; v1.0.0 &nbsp;·&nbsp; ~38 MB &nbsp;·&nbsp; Free to register
        </p>
      </section>

      <section className="dl-features" id="features">
        <div className="dl-wrap">
          <div className="dl-sh dl-r">
            <div className="dl-sh-eye">Why BooyahX</div>
            <h2>Built for <em>Champions</em></h2>
          </div>
          <div className="dl-bento">
            <div className="dl-bc dl-bc-1 dl-r">
              <span className="dl-bc-icon" aria-hidden>🔥</span>
              <h3>Live Tournaments Running 24/7</h3>
              <p>
                Real-time Free Fire competitions that never sleep. Join rooms, compete, and watch
                live standings shift as the match unfolds across India.
              </p>
              <span className="dl-bc-tag">Real-Time</span>
              <div className="dl-bc-big-num" aria-hidden>01</div>
            </div>
            <div className="dl-bc dl-bc-2 dl-r">
              <span className="dl-bc-icon" aria-hidden>💸</span>
              <h3>Instant UPI Payouts</h3>
              <p>
                Win and get cash to GPay, PhonePe, or Paytm within minutes of the result. No
                waiting. No forms.
              </p>
              <span className="dl-bc-tag">GPay · PhonePe · Paytm</span>
              <div className="dl-bc-big-num" aria-hidden>02</div>
            </div>
            <div className="dl-bc dl-bc-3 dl-r">
              <span className="dl-bc-icon" aria-hidden>🔒</span>
              <h3>Secure &amp; Verified</h3>
              <p>
                Firebase Auth, encrypted wallets, and anti-cheat room codes. Your money is always
                protected.
              </p>
              <span className="dl-bc-tag">Bank-Grade</span>
              <div className="dl-bc-big-num" aria-hidden>03</div>
            </div>
            <div className="dl-bc dl-bc-4 dl-r">
              <span className="dl-bc-icon" aria-hidden>🎯</span>
              <h3>Skill Matchmaking</h3>
              <p>
                Rookie, Pro, Elite tiers — compete at your level and climb the leaderboard.
              </p>
              <span className="dl-bc-tag">Rank-Based</span>
              <div className="dl-bc-big-num" aria-hidden>04</div>
            </div>
            <div className="dl-bc dl-bc-5 dl-r">
              <span className="dl-bc-icon" aria-hidden>💬</span>
              <h3>In-Room Chat</h3>
              <p>
                Coordinate with your squad in live lobby chat. Build your crew, call strategies.
              </p>
              <span className="dl-bc-tag">Live Chat</span>
              <div className="dl-bc-big-num" aria-hidden>05</div>
            </div>
            <div className="dl-bc dl-bc-6 dl-r">
              <span className="dl-bc-icon" aria-hidden>📊</span>
              <h3>Live Wallet Dashboard</h3>
              <p>
                Track deposits, winnings, and withdrawals in one clean dashboard. QR top-up in
                seconds — no friction between you and your next tournament.
              </p>
              <span className="dl-bc-tag">QR · UPI</span>
              <div className="dl-bc-big-num" aria-hidden>06</div>
            </div>
            <div className="dl-bc dl-bc-7 dl-r" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="dl-bc-icon" aria-hidden>⚡</span>
                <h3>Zero-Delay Room Entry</h3>
                <p>
                  Enter any room instantly — room ID and password delivered to your screen the
                  moment you join.
                </p>
              </div>
              <span className="dl-bc-tag" style={{ alignSelf: 'flex-end' }}>Instant Access</span>
              <div className="dl-bc-big-num" aria-hidden>07</div>
            </div>
          </div>
        </div>
      </section>

      <section className="dl-how" id="how">
        <div className="dl-wrap">
          <div className="dl-sh dl-r">
            <div className="dl-sh-eye">Simple Process</div>
            <h2>How It <em>Works</em></h2>
          </div>
          <div className="dl-timeline">
            <div className="dl-tl-beam">
              <div className="dl-tl-beam-travel" aria-hidden />
            </div>
            <div className="dl-tl-step dl-r">
              <div className="dl-tl-node">01</div>
              <h4>Download &amp; Register</h4>
              <p>
                Install the APK, sign in with Google, and set up your player profile in under a
                minute.
              </p>
            </div>
            <div className="dl-tl-step dl-r">
              <div className="dl-tl-node">02</div>
              <h4>Add Wallet Balance</h4>
              <p>
                Top up via UPI QR code. Funds appear in your wallet instantly after payment
                confirmation.
              </p>
            </div>
            <div className="dl-tl-step dl-r">
              <div className="dl-tl-node">03</div>
              <h4>Enter a Tournament</h4>
              <p>
                Pick your room, pay the entry fee, and receive your room ID and password
                instantly.
              </p>
            </div>
            <div className="dl-tl-step dl-r">
              <div className="dl-tl-node">04</div>
              <h4>Win &amp; Withdraw</h4>
              <p>
                Prize money hits your wallet after verified results. Withdraw to UPI anytime,
                instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="dl-section" id="download">
        <div className="dl-inner">
          <div className="dl-sh dl-r" style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div className="dl-sh-eye" style={{ justifyContent: 'center' }}>Get The App</div>
          </div>
          <h2 className="dl-r">
            Ready to <em>BOOYAH?</em>
          </h2>
          <p className="dl-sub dl-r">
            Free to download. Free to register. Pay only the entry fee. One install, infinite
            tournaments.
          </p>
          <div className="dl-r">
            <div className="dl-apk-hud">
              <div className="dl-apk-em" aria-hidden>📱</div>
              <div className="dl-apk-info">
                <div className="dl-apk-n">BooyahX.apk</div>
                <div className="dl-apk-m">v1.0.0 &nbsp;·&nbsp; Android 6.0+ &nbsp;·&nbsp; ~37 MB</div>
              </div>
            </div>
          </div>
          <div className="dl-r">
            <a
              href={downloadHref}
              className={`dl-btn ${!hasAndroidLink ? 'dl-btn--disabled' : ''}`}
              download={hasAndroidLink || undefined}
              onClick={preventDisabled}
              style={{ animation: 'none' }}
            >
              <div className="dl-shine" aria-hidden />
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 4h14v-2H5v2z" />
              </svg>
              {hasAndroidLink ? 'Download Free — Android APK' : 'Android download link coming soon'}
            </a>
          </div>
          <p className="dl-install-note dl-r">
            Enable &quot;Install from Unknown Sources&quot; in Android Settings before installing.
          </p>
          <div className="dl-trust-row dl-r">
            <span className="dl-tr">Secure Download</span>
            <span className="dl-tr">No Ads</span>
            <span className="dl-tr">Free Registration</span>
            <span className="dl-tr">Instant Payouts</span>
            <span className="dl-tr">Anti-Cheat Protected</span>
          </div>
        </div>
      </section>

      <section className="dl-social" id="social">
        <h2 className="dl-social__title">Follow us</h2>
        <p className="dl-social__subtitle">
          Stay updated with tournament announcements, maintenance notices, and support. Reach us on these handles.
        </p>
        <div className="dl-social__links">
          <a
            href="https://www.instagram.com/_booyah_x__?igsh=ejhmODc2cnF4eHJ6"
            target="_blank"
            rel="noreferrer"
            className="dl-social__link dl-social__link--instagram"
            aria-label="Instagram"
          >
            <span className="dl-social__icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </span>
            <span>Instagram</span>
          </a>
          <a
            href="https://t.me/gethelpbooyahx"
            target="_blank"
            rel="noreferrer"
            className="dl-social__link dl-social__link--telegram"
            aria-label="Telegram"
          >
            <span className="dl-social__icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </span>
            <span>Telegram</span>
          </a>
          <a
            href="https://discord.gg/q86wreRTGw"
            target="_blank"
            rel="noreferrer"
            className="dl-social__link dl-social__link--discord"
            aria-label="Discord"
          >
            <span className="dl-social__icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </span>
            <span>Discord</span>
          </a>
          <a
            href="https://whatsapp.com/channel/0029VbC0xQyA2pLKBc1nqI3v"
            target="_blank"
            rel="noreferrer"
            className="dl-social__link dl-social__link--whatsapp"
            aria-label="WhatsApp"
          >
            <span className="dl-social__icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.865 9.865 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </span>
            <span>WhatsApp</span>
          </a>
        </div>
      </section>

      <footer className="dl-footer">
        <a href={STATIC_ROUTES.DOWNLOADS} className="dl-foot-logo">
          BOOYAH<em>X</em>
        </a>
        <div className="dl-foot-links">
          <a href={STATIC_ROUTES.PRIVACY}>Privacy Policy</a>
          <a href={STATIC_ROUTES.TERMS_CONDITIONS}>Terms of Use</a>
          <a href={STATIC_ROUTES.CONTACT_US}>Contact</a>
          <a href={STATIC_ROUTES.CONTACT_US}>Support</a>
        </div>
        <p>© 2025 BooyahX. All rights reserved. &nbsp;·&nbsp; Designed for Indian Free Fire players.</p>
      </footer>
    </div>
  );
};

export default Downloads;
