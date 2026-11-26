const COLORS = [
  'primary',
  'secondary',
  'success',
  'accent',
];

const VARIANTS = [
  'contained',
  'outlined',
  'text',
  'tertiary',
];

const SIZES = [
  'sm',
  'small',
  'md',
  'lg',
  'large',
];

function getOption(block, options, fallback = '') {
  return options.find((option) => block.classList.contains(option)) || fallback;
}

/**
 * Makes decorative icons inaccessible to screen readers.
 *
 * @param {Element} button
 */
function decorateIcons(button) {
  const icons = button.querySelectorAll('.icon');

  icons.forEach((icon) => {
    icon.setAttribute('aria-hidden', 'true');

    const img = icon.querySelector('img');

    if (img) {
      img.setAttribute('alt', '');
    }
  });
}

/**
 * Adds accessibility support to icon-only buttons.
 *
 * @param {Element} button
 */
function decorateIconOnlyButton(button) {
  const existingAriaLabel = button.getAttribute('aria-label');

  if (existingAriaLabel) {
    return;
  }

  const buttonLabel = button.querySelector('.button-label');

  if (buttonLabel?.textContent.trim()) {
    button.setAttribute(
      'aria-label',
      buttonLabel.textContent.trim(),
    );

    return;
  }

  const image = button.querySelector('img[alt]');

  if (image?.alt.trim()) {
    button.setAttribute('aria-label', image.alt.trim());

    image.setAttribute('alt', '');
    return;
  }

  const text = button.textContent.trim();

  if (text) {
    button.setAttribute('aria-label', text);
  }
}

/**
 * Handles disabled state accessibility.
 *
 * @param {Element} button
 */
function decorateDisabledState(button) {
  const isDisabled = button.getAttribute('aria-disabled') === 'true';

  if (!isDisabled) {
    return;
  }

  /*
   * <a> elements don't support the native disabled attribute.
   * aria-disabled announces the disabled state to assistive technology.
   */
  button.setAttribute('aria-disabled', 'true');

  button.addEventListener('click', (event) => {
    event.preventDefault();
  });

  button.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
    }
  });
}

/**
 * Decorates an individual button.
 *
 * @param {Element} button
 * @param {Element} block
 */
function decorateButton(button, block) {
  const color = getOption(block, COLORS, 'primary');
  const variant = getOption(block, VARIANTS, 'contained');
  const size = getOption(block, SIZES, 'md');

  button.classList.add(
    'button',
    color,
    variant,
    size,
  );

  /* Full-width */
  if (block.classList.contains('full-width')) {
    button.classList.add('full-width');
  }

  /* Icon-only */
  if (block.classList.contains('icon-only')) {
    button.classList.add('icon-only');

    decorateIconOnlyButton(button);
  }

  /* Decorative icons */
  decorateIcons(button);

  /* Disabled accessibility */
  decorateDisabledState(button);
}

/**
 * Decorates the button block.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const buttons = block.querySelectorAll('a, button');

  buttons.forEach((button) => {
    decorateButton(button, block);
  });
}