const desktopMedia = window.matchMedia('(min-width: 1200px)');

/**
 * Updates the mobile/tablet navigation state.
 *
 * @param {HTMLElement} nav Navigation element
 * @param {HTMLButtonElement} button Hamburger button
 * @param {boolean} expanded Navigation state
 */
function setNavigationState(nav, button, expanded) {
  nav.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-expanded', String(expanded));

  button.setAttribute(
    'aria-label',
    expanded ? 'Close navigation' : 'Open navigation',
  );
}

/**
 * Handles responsive navigation when the viewport changes.
 *
 * Desktop >= 1200px
 * Tablet <= 1199px
 * Mobile <= 767px
 *
 * @param {HTMLElement} nav Navigation element
 * @param {HTMLButtonElement} button Hamburger button
 */
function updateResponsiveState(nav, button) {
  if (desktopMedia.matches) {
    setNavigationState(nav, button, true);
  } else {
    setNavigationState(nav, button, false);
  }
}

/**
 * Decorates the header block.
 *
 * @param {HTMLElement} block Header block
 */
export default function decorate(block) {
  const nav = block.querySelector('nav');
  const hamburger = block.querySelector('.nav-hamburger');
  const hamburgerButton = hamburger?.querySelector('button');

  if (!nav || !hamburger || !hamburgerButton) {
    return;
  }

  /*
   * Ensure navigation has an ID so aria-controls works.
   */
  if (!nav.id) {
    nav.id = 'nav';
  }

  /*
   * Hamburger accessibility.
   */
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', nav.id);

  /*
   * Initial responsive state.
   */
  updateResponsiveState(nav, hamburgerButton);

  /*
   * Open / close navigation.
   */
  hamburgerButton.addEventListener('click', () => {
    if (desktopMedia.matches) {
      return;
    }

    const isExpanded = nav.getAttribute('aria-expanded') === 'true';

    setNavigationState(
      nav,
      hamburgerButton,
      !isExpanded,
    );
  });

  /*
   * Close navigation using Escape.
   */
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    if (desktopMedia.matches) {
      return;
    }

    const isExpanded = nav.getAttribute('aria-expanded') === 'true';

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
   * When moving between mobile/tablet and desktop,
   * reset navigation to the correct state.
   */
  desktopMedia.addEventListener('change', () => {
    updateResponsiveState(nav, hamburgerButton);
  });
}