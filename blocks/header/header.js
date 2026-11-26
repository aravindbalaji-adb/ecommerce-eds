const desktopMedia = window.matchMedia('(min-width: 1200px)');

function setNavigationState(nav, button, expanded) {
  nav.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-expanded', String(expanded));

  button.setAttribute(
    'aria-label',
    expanded ? 'Close navigation' : 'Open navigation',
  );
}

function updateResponsiveState(nav, button) {
  setNavigationState(
    nav,
    button,
    desktopMedia.matches,
  );
}

export default function decorate(block) {
  /*
   * Get the sections coming from DA / document content.
   *
   * Expected:
   * 1st div = brand
   * 2nd div = search
   * 3rd div = tools
   */
  const sections = [...block.children];

  if (!sections.length) {
    return;
  }

  const brand = sections[0];
  const search = sections[1];
  const tools = sections[2];

  /*
   * Create nav wrapper
   */
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';

  /*
   * Create nav
   */
  const nav = document.createElement('nav');
  nav.id = 'nav';

  /*
   * Create hamburger container
   */
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';

  /*
   * Create hamburger button
   */
  const hamburgerButton = document.createElement('button');

  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', nav.id);
  hamburgerButton.setAttribute('aria-expanded', 'false');
  hamburgerButton.setAttribute(
    'aria-label',
    'Open navigation',
  );

  /*
   * Hamburger icon
   */
  const hamburgerIcon = document.createElement('span');
  hamburgerIcon.className = 'nav-hamburger-icon';
  hamburgerIcon.setAttribute('aria-hidden', 'true');

  hamburgerButton.append(hamburgerIcon);
  hamburger.append(hamburgerButton);

  /*
   * Brand section
   */
  if (brand) {
    brand.classList.add('nav-brand');
  }

  /*
   * Search section
   */
  if (search) {
    search.classList.add(
      'search-container',
      'nav-sections',
    );
  }

  /*
   * Tools section
   */
  if (tools) {
    tools.classList.add('nav-tools');
  }

  /*
   * Build navigation structure
   */
  nav.append(hamburger);

  if (brand) {
    nav.append(brand);
  }

  if (search) {
    nav.append(search);
  }

  if (tools) {
    nav.append(tools);
  }

  navWrapper.append(nav);

  /*
   * Replace original block content
   */
  block.replaceChildren(navWrapper);

  /*
   * Set initial navigation state
   */
  updateResponsiveState(
    nav,
    hamburgerButton,
  );

  /*
   * Hamburger click
   */
  hamburgerButton.addEventListener('click', () => {
    if (desktopMedia.matches) {
      return;
    }

    const isExpanded = (
      nav.getAttribute('aria-expanded') === 'true'
    );

    setNavigationState(
      nav,
      hamburgerButton,
      !isExpanded,
    );
  });

  /*
   * Escape key closes mobile/tablet navigation
   */
  document.addEventListener('keydown', (event) => {
    if (
      event.key !== 'Escape'
      || desktopMedia.matches
      || nav.getAttribute('aria-expanded') !== 'true'
    ) {
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
   * Handle breakpoint changes
   */
  desktopMedia.addEventListener('change', () => {
    updateResponsiveState(
      nav,
      hamburgerButton,
    );
  });
}