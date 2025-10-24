import { fetchPlaceholders } from '../../scripts/placeholders.js';
import getEnvConfig from '../../scripts/utils/envConfig.js';

const envConfig = getEnvConfig();

function ensureMeta(name, content) {
  let meta = document.head.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/**
 * Load and decorate EXL Header
 */
async function loadExlHeader(header) {
  window.hlx = window.hlx || {};
  window.hlx.DO_NOT_LOAD_PAGE = true;
  window.exlRootDomain = envConfig.exlDomain;
  window.exlHeaderJs = `${envConfig.exlDomain}/blocks/header/header.js`;

  ensureMeta('header-fragment', 'en/global-fragments/header');

  const dispatchHeaderReady = () => {
    window.isHeaderReady = true;
    window.dispatchEvent(new Event('header-ready'));
  };

  const headerOrigin = window.exlRootDomain;
  const navLinkOrigin = window.exlRootDomain;
  // const lang = 'en';
  const khorosProfileUrl = `${headerOrigin}/api/action/khoros/profile-menu-list`;
  const isAnonymous = true;

  const languages = [
    { lang: 'de', title: 'Deutsch' },
    { lang: 'en', title: 'English' },
    { lang: 'es', title: 'Español' },
    { lang: 'fr', title: 'Français' },
    { lang: 'ja', title: '日本語' },
    { lang: 'pt', title: 'Português' },
    { lang: 'ko', title: '한국어' },
  ];

  if (!header) throw new Error('Header element not found');

  const headerModule = await import(window.exlHeaderJs);
  window.hlx.codeBasePath = headerOrigin;

  headerModule.default(header, {
    isUserSignedIn: () => !isAnonymous,
    khorosProfileUrl,
    languages,
    navLinkOrigin,
    onSignOut: () => {
      window.location =
        '/plugins/common/feature/oauthss/sso_logout_redirect?tid=-6083555255532770731';
    },
  });

  const exlHeader = header.querySelector('exl-header');
  if (exlHeader.isLoaded) dispatchHeaderReady();
  else exlHeader.addEventListener('header-decorated', () => dispatchHeaderReady());
}

async function insertPremiumBadge() {
  const PREMIUM_BADGE = '/blocks/header/header.css';
  const placeholders = await fetchPlaceholders('en');
  const { premium } = placeholders;

  const header = document.querySelector('exl-header');
  const shadowRoot = header?.shadowRoot;

  // Retry if shadowRoot not ready
  if (!shadowRoot) {
    requestAnimationFrame(insertPremiumBadge);
    return;
  }

  // Select brand link
  const brandLink = shadowRoot.querySelector('.brand a');
  if (!brandLink) {
    requestAnimationFrame(insertPremiumBadge);
    return;
  }

  // Apply Adobe red color to brand link
  brandLink.style.setProperty('color', '#EB1000', 'important');
  brandLink.style.setProperty('text-decoration', 'none', 'important');

  // Prevent multiple badge injections
  if (shadowRoot.querySelector('.premium-badge')) return;

  // Inject CSS for Premium badge
  if (!shadowRoot.querySelector(`link[href="${PREMIUM_BADGE}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = PREMIUM_BADGE;
    shadowRoot.appendChild(link);
  }

  // Create badge element
  const badge = document.createElement('span');
  badge.className = 'premium-badge';
  badge.textContent = premium || 'Premium member';

  // Wrap brand link + badge in a container
  const container = document.createElement('div');
  container.className = 'premium-container';
  brandLink.replaceWith(container);
  container.appendChild(brandLink);
  container.appendChild(badge);
}

/**
 * Main decorate function
 */
export default async function decorate(block) {
  await loadExlHeader(block);
  insertPremiumBadge();
}
