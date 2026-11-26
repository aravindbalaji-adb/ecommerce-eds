import { loadFragment } from '../fragment/fragment.js';

const desktopMedia = window.matchMedia('(min-width: 1200px)');

const OPEN_ICON = '/icons/expand.svg';
const CLOSE_ICON = '/icons/collapse.svg';

/**
 * Updates navigation open/close state.
 *
 * @param {HTMLElement} nav
 * @param {HTMLButtonElement} button
 * @param {boolean} expanded
 */
function setNavigationState(nav, button, expanded) {
  nav.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-expanded', String(expanded));

  const label = expanded
    ? 'Close navigation'
    : 'Open navigation';

  button.setAttribute('aria-label', label);

  const buttonLabel = button.querySelector('.button-label');

  if (buttonLabel) {
    buttonLabel.textContent = label;
  }

  const icon = button.querySelector('.icon');
  const iconImage = icon?.querySelector('img');

  if (!icon || !iconImage) {
    return;
  }

  if (expanded) {
    icon.classList.remove('icon-search');
    icon.classList.add('icon-close');

    iconImage.src = CLOSE_ICON;
    iconImage.dataset.iconName = 'close';
  } else {
    icon.classList.remove('icon-close');
    icon.classList.add('icon-search');

    iconImage.src = OPEN_ICON;
    iconImage.dataset.iconName = 'search';
  }
}

/**
 * Desktop navigation is always expanded.
 * Mobile/tablet navigation starts collapsed.
 *
 * @param {HTMLElement} nav
 * @param {HTMLButtonElement} button
 */
function updateResponsiveState(nav, button) {
  setNavigationState(
    nav,
    button,
    desktopMedia.matches,
  );
}

/**
 * Creates the responsive navigation button.
 *
 * @returns {{ container: HTMLElement, button: HTMLButtonElement }}
 */
function createNavigationButton() {
  const container = document.createElement('div');
  container.className = 'nav-hamburger';

  const button = document.createElement('button');

  button.type = 'button';

  /* Existing design-system button classes */
  button.className = 'button secondary text md icon-only';

  button.setAttribute('aria-controls', 'nav');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Open navigation');

  /*
   * Temporary search icon.
   */
  const icon = document.createElement('span');

  icon.className = 'icon icon-search';
  icon.setAttribute('aria-hidden', 'true');

  const iconImage = document.createElement('img');

  iconImage.src = OPEN_ICON;
  iconImage.dataset.iconName = 'search';
  iconImage.alt = '';
  iconImage.loading = 'lazy';
  iconImage.width = 16;
  iconImage.height = 16;

  icon.append(iconImage);

  /*
   * Accessible text.
   * Your existing icon-only button CSS can visually hide this.
   */
  const label = document.createElement('span');

  label.className = 'button-label';
  label.textContent = 'Open navigation';

  button.append(
    icon,
    label,
  );

  container.append(button);

  return {
    container,
    button,
  };
}

/**
 * Header block decoration.
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  /*
   * Load /nav fragment.
   */
  const fragment = await loadFragment('/nav');

  if (!fragment) {
    return;
  }

  /*
   * Expected /nav structure:
   *
   * Section 1 = Brand
   * Section 2 = Search
   * Section 3 = Tools
   */
  const sections = [...fragment.children];

  const brand = sections[0];
  const search = sections[1];
  const tools = sections[2];

  /*
   * Navigation wrapper.
   */
  const navWrapper = document.createElement('div');

  navWrapper.className = 'nav-wrapper';

  /*
   * Main navigation.
   */
  const nav = document.createElement('nav');

  nav.id = 'nav';

  /*
   * Navigation button.
   */
  const {
    container: hamburger,
    button: hamburgerButton,
  } = createNavigationButton();

  nav.append(hamburger);

  /*
   * Brand.
   */
  if (brand) {
    brand.classList.add('nav-brand');

    nav.append(brand);
  }

  /*
   * Search.
   */
  if (search) {
    search.classList.add(
      'search-container',
      'nav-sections',
    );

    nav.append(search);
  }

  /*
   * Tools:
   * favorite
   * user
   * cart
   */
  if (tools) {
    tools.classList.add('nav-tools');

    nav.append(tools);
  }

  /*
   * Build final structure.
   */
  navWrapper.append(nav);

  block.replaceChildren(navWrapper);

  /*
   * Initial responsive state.
   */
  updateResponsiveState(
    nav,
    hamburgerButton,
  );

  /*
   * Open/close navigation.
   */
  hamburgerButton.addEventListener('click', () => {
    /*
     * No toggle required on desktop.
     */
    if (desktopMedia.matches) {
      return;
    }

    const isExpanded =
      nav.getAttribute('aria-expanded') === 'true';

    setNavigationState(
      nav,
      hamburgerButton,
      !isExpanded,
    );
  });

  /*
   * Escape closes navigation.
   */
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    if (desktopMedia.matches) {
      return;
    }

    const isExpanded =
      nav.getAttribute('aria-expanded') === 'true';

    if (!isExpanded) {
      return;
    }

    setNavigationState(
      nav,
      hamburgerButton,
      false,
    );

    hamburgerButton.focus();
  });

  /*
   * Handle responsive breakpoint changes.
   *
   * 0 - 767px       Mobile
   * 768 - 1199px    Tablet
   * 1200px+         Desktop
   */
  desktopMedia.addEventListener('change', () => {
    updateResponsiveState(
      nav,
      hamburgerButton,
    );
  });
}