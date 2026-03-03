import { ANDROID_APK_URL, STATIC_ROUTES } from '@utils/constants';
import './StaticPages.scss';

const Downloads: React.FC = () => {
  const hasAndroidLink = ANDROID_APK_URL.trim().length > 0;

  return (
    <div className="static-page-container">
      <div className="static-page-content downloads-page">
        <header className="downloads-page__intro">
          <h1 className="downloads-page__title">Download Booyahx App</h1>
          <p className="downloads-page__subtitle">
            Choose your platform and start playing tournaments with real-time wallet, secure payments, and instant results.
          </p>
        </header>

        <section className="downloads-page__blocks">
          <div className="downloads-block downloads-block--android">
            <div className="downloads-block__header">
              <div className="downloads-block__icon">🤖</div>
              <div className="downloads-block__meta">
                <h2 className="downloads-block__title">Android (APK)</h2>
                <p className="downloads-block__tagline">Best experience, full features, instant updates.</p>
              </div>
            </div>

            <div className="downloads-block__stats">
              <div className="downloads-block__stat">
                <span className="downloads-block__stat-value">4.7★</span>
                <span className="downloads-block__stat-label">Player rating</span>
              </div>
              <div className="downloads-block__stat">
                <span className="downloads-block__stat-value">120 MB</span>
                <span className="downloads-block__stat-label">Approx. size</span>
              </div>
              <div className="downloads-block__stat">
                <span className="downloads-block__stat-value">Android 6.0+</span>
                <span className="downloads-block__stat-label">Minimum OS</span>
              </div>
              <div className="downloads-block__stat">
                <span className="downloads-block__stat-value">100K+</span>
                <span className="downloads-block__stat-label">Downloads</span>
              </div>
            </div>

            <p className="downloads-block__description">
              Download the official Booyahx Android app APK to join daily tournaments, manage your wallet, and track your match history in one place.
            </p>

            <a
              href={hasAndroidLink ? ANDROID_APK_URL : '#'}
              className={`downloads-block__button ${!hasAndroidLink ? 'downloads-block__button--disabled' : ''}`}
              download={hasAndroidLink || undefined}
              aria-disabled={!hasAndroidLink}
              onClick={(event) => {
                if (!hasAndroidLink) {
                  event.preventDefault();
                }
              }}
            >
              {hasAndroidLink ? 'Download APK for Android' : 'Android download link coming soon'}
            </a>
          </div>

          <div className="downloads-block downloads-block--ios">
            <div className="downloads-block__header">
              <div className="downloads-block__icon"></div>
              <div className="downloads-block__meta">
                <h2 className="downloads-block__title">iOS</h2>
                <p className="downloads-block__tagline">Optimized for iPhone &amp; iPad.</p>
              </div>
            </div>

            <p className="downloads-block__description">
              Our iOS app is under active development and will be available soon on the App Store.
              You&apos;ll get the same secure tournaments, wallet, and support experience as Android.
            </p>

            <button
              type="button"
              className="downloads-block__button downloads-block__button--outline"
              disabled
            >
              iOS app coming soon
            </button>
          </div>
        </section>

        <section className="downloads-info">
          <h2 className="downloads-info__title">Before you download</h2>
          <ul className="downloads-info__list">
            <li>Booyahx is intended for users who are 12+ and legally allowed to participate in online gaming in their region.</li>
            <li>Play fair – multiple accounts, fraudulent activity, or misuse of rewards can lead to permanent bans.</li>
            <li>Make sure you have a stable internet connection for match updates, wallet sync, and withdrawals.</li>
            <li>Data charges may apply from your mobile or broadband provider while downloading and playing.</li>
            <li>
              By installing and using the app, you agree to our{' '}
              <a href={STATIC_ROUTES.TERMS_CONDITIONS}>Terms &amp; Conditions</a>,{' '}
              <a href={STATIC_ROUTES.PRIVACY}>Privacy Policy</a>, and{' '}
              <a href={STATIC_ROUTES.CANCELLATION_REFUNDS}>Cancellation &amp; Refunds Policy</a>.
            </li>
          </ul>
        </section>

        <section className="downloads-social">
          <h2 className="downloads-social__title">Join our community</h2>
          <p className="downloads-social__subtitle">
            Stay updated with tournament announcements, maintenance notices, and support channels.
          </p>
          <div className="downloads-social__links">
            <a
              href="https://www.instagram.com/_booyah_x__?igsh=ejhmODc2cnF4eHJ6"
              target="_blank"
              rel="noreferrer"
              className="downloads-social__link downloads-social__link--instagram"
            >
              <span className="downloads-social__icon downloads-social__icon--instagram" />
              <span>Instagram</span>
            </a>
            <a
              href="https://t.me/gethelpbooyahx"
              target="_blank"
              rel="noreferrer"
              className="downloads-social__link downloads-social__link--telegram"
            >
              <span className="downloads-social__icon">TG</span>
              <span>Telegram</span>
            </a>
            <a
              href="https://discord.gg/q86wreRTGw"
              target="_blank"
              rel="noreferrer"
              className="downloads-social__link downloads-social__link--discord"
            >
              <span className="downloads-social__icon">DC</span>
              <span>Discord</span>
            </a>
            <a
              href="https://whatsapp.com/channel/0029VbC0xQyA2pLKBc1nqI3v"
              target="_blank"
              rel="noreferrer"
              className="downloads-social__link downloads-social__link--whatsapp"
            >
              <span className="downloads-social__icon">WA</span>
              <span>WhatsApp</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Downloads;

