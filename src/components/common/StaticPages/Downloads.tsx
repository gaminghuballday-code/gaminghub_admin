import { useEffect, useRef } from 'react';
import { ANDROID_APK_URL, STATIC_ROUTES } from '@utils/constants';
import './Downloads.scss';

const TICKER_ITEMS = [
  '🏆 Win Real Money',
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

    const handleResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      stars = [];
      nebulae = [];
      const n = Math.floor((W * H) / 1800);
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

    const handleMouseMove = (e: MouseEvent) => {
      pmx = e.clientX / window.innerWidth;
      pmy = e.clientY / window.innerHeight;
    };

    const spawnShooter = () => {
      if (Math.random() > 0.007) return;
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
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      bg.addColorStop(0, 'rgba(0,4,20,.6)');
      bg.addColorStop(1, 'rgba(0,0,10,.95)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const t = Date.now() * 0.001;

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
        const px = s.x + (pmx - 0.5) * d * 35;
        const py = s.y + (pmy - 0.5) * d * 25;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.c + a + ')';
        ctx.fill();
        if (s.r > 0.8) {
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

      requestAnimationFrame(draw);
    };

    handleResize();
    draw();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
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
          India&apos;s #1 Real Money Tournament App — Now Live
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
                <div className="dl-apk-m">v1.0.0 &nbsp;·&nbsp; Android 6.0+ &nbsp;·&nbsp; ~18 MB</div>
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
