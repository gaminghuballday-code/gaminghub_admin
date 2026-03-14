import React from 'react';
import './StaticLanding.scss';

const SOCIAL_LINKS = [
  {
    href: 'https://www.instagram.com/_booyah_x__?igsh=ejhmODc2cnF4eHJ6',
    label: 'Instagram',
    className: 'sl-social__link sl-social__link--instagram',
    iconClass: 'sl-social__icon sl-social__icon--instagram',
    iconContent: null,
  },
  {
    href: 'https://t.me/gethelpbooyahx',
    label: 'Telegram',
    className: 'sl-social__link sl-social__link--telegram',
    iconClass: 'sl-social__icon',
    iconContent: 'TG',
  },
  {
    href: 'https://discord.gg/q86wreRTGw',
    label: 'Discord',
    className: 'sl-social__link sl-social__link--discord',
    iconClass: 'sl-social__icon',
    iconContent: 'DC',
  },
  {
    href: 'https://whatsapp.com/channel/0029VbC0xQyA2pLKBc1nqI3v',
    label: 'WhatsApp',
    className: 'sl-social__link sl-social__link--whatsapp',
    iconClass: 'sl-social__icon',
    iconContent: 'WA',
  },
];

const SocialLinks: React.FC = () => (
  <section className="sl-social" id="social">
    <h2 className="sl-social__title">Follow us</h2>
    <p className="sl-social__subtitle">
      Stay updated with tournament announcements, maintenance notices, and support. Reach us on these handles.
    </p>
    <div className="sl-social__links">
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className={link.className}
        >
          <span className={link.iconClass}>{link.iconContent}</span>
          <span>{link.label}</span>
        </a>
      ))}
    </div>
  </section>
);

export default SocialLinks;
