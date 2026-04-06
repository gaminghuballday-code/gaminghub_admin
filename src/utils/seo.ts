import { getPublicAbsoluteUrl } from '@utils/constants';

export const USER_APP_DEFAULT_DOCUMENT_TITLE = 'Booyahx';

const MANAGED_ATTR = 'data-app-managed-seo';

export interface PageSeoOptions {
  title: string;
  description: string;
  /** Full page URL (e.g. from `getPublicAbsoluteUrl('/downloads')`) */
  canonicalUrl: string;
  /** Path or absolute URL for og:image */
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (el) {
    el.setAttribute('content', content);
    el.setAttribute(MANAGED_ATTR, '1');
    return;
  }
  const created = document.createElement('meta');
  created.setAttribute(attr, key);
  created.setAttribute('content', content);
  created.setAttribute(MANAGED_ATTR, '1');
  document.head.appendChild(created);
}

function resolveOgImage(ogImage?: string): string {
  const raw = (ogImage ?? '/backbooyah.png').trim();
  if (!raw) return getPublicAbsoluteUrl('/backbooyah.png');
  if (/^https?:\/\//i.test(raw)) return raw;
  return getPublicAbsoluteUrl(raw.startsWith('/') ? raw : `/${raw}`);
}

/**
 * Updates document head for the current route. Call the returned cleanup on unmount
 * so navigations within the SPA do not leave stale social / canonical tags.
 */
export function applyManagedPageSeo(opts: PageSeoOptions): () => void {
  const previousTitle = document.title;
  const descriptionMeta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  const previousDescription = descriptionMeta?.getAttribute('content') ?? null;

  document.title = opts.title;

  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', opts.description);
    descriptionMeta.setAttribute(MANAGED_ATTR, '1');
  } else {
    const m = document.createElement('meta');
    m.setAttribute('name', 'description');
    m.setAttribute('content', opts.description);
    m.setAttribute(MANAGED_ATTR, '1');
    document.head.appendChild(m);
  }

  const imageAbs = resolveOgImage(opts.ogImage);

  setMeta('property', 'og:title', opts.title);
  setMeta('property', 'og:description', opts.description);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:url', opts.canonicalUrl);
  setMeta('property', 'og:image', imageAbs);

  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', opts.title);
  setMeta('name', 'twitter:description', opts.description);
  setMeta('name', 'twitter:image', imageAbs);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const hadCanonical = Boolean(canonical);
  const previousCanonicalHref = canonical?.getAttribute('href') ?? null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute(MANAGED_ATTR, '1');
    document.head.appendChild(canonical);
  } else {
    canonical.setAttribute(MANAGED_ATTR, '1');
  }
  canonical.setAttribute('href', opts.canonicalUrl);

  let jsonLdEl: HTMLScriptElement | null = null;
  if (opts.jsonLd) {
    jsonLdEl = document.createElement('script');
    jsonLdEl.type = 'application/ld+json';
    jsonLdEl.setAttribute(MANAGED_ATTR, '1');
    jsonLdEl.textContent = JSON.stringify(opts.jsonLd);
    document.head.appendChild(jsonLdEl);
  }

  return () => {
    document.title = previousTitle;

    const dm = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (dm?.hasAttribute(MANAGED_ATTR)) {
      if (previousDescription !== null) {
        dm.setAttribute('content', previousDescription);
        dm.removeAttribute(MANAGED_ATTR);
      } else {
        dm.remove();
      }
    }

    document.head.querySelectorAll(`meta[${MANAGED_ATTR}]`).forEach((n) => n.remove());

    const can = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (can?.hasAttribute(MANAGED_ATTR)) {
      if (hadCanonical && previousCanonicalHref !== null) {
        can.setAttribute('href', previousCanonicalHref);
        can.removeAttribute(MANAGED_ATTR);
      } else {
        can.remove();
      }
    }

    if (jsonLdEl?.isConnected) {
      jsonLdEl.remove();
    } else {
      document.head.querySelector(`script[type="application/ld+json"][${MANAGED_ATTR}]`)?.remove();
    }
  };
}
