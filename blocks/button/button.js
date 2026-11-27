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
  return options.find(
    (option) => block.classList.contains(option),
  ) || fallback;
}

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

function decorateIconOnlyButton(button) {
  const existingAriaLabel =
    button.getAttribute('aria-label');

  if (existingAriaLabel) {
    return;
  }

  const buttonLabel =
    button.querySelector('.button-label');

  if (buttonLabel?.textContent.trim()) {
    button.setAttribute(
      'aria-label',
      buttonLabel.textContent.trim(),
    );

    return;
  }

  const image =
    button.querySelector('img[alt]');

  if (image?.alt.trim()) {
    button.setAttribute(
      'aria-label',
      image.alt.trim(),
    );

    image.setAttribute('alt', '');

    return;
  }

  const text = button.textContent.trim();

  if (text) {
    button.setAttribute(
      'aria-label',
      text,
    );
  }
}

function decorateDisabledState(button) {
  const isDisabled =
    button.getAttribute('aria-disabled') === 'true';

  if (!isDisabled) {
    return;
  }

  button.setAttribute(
    'aria-disabled',
    'true',
  );

  button.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
    },
  );

  button.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Enter'
        || event.key === ' '
      ) {
        event.preventDefault();
      }
    },
  );
}

/**
 * Applies design-system button styles.
 *
 * @param {Element} button Button or anchor element
 * @param {Object} options Button options
 */
export function applyButtonStyles(
  button,
  {
    color = 'primary',
    variant = 'contained',
    size = 'md',
    fullWidth = false,
    iconOnly = false,
  } = {},
) {
  const safeColor =
    COLORS.includes(color)
      ? color
      : 'primary';

  const safeVariant =
    VARIANTS.includes(variant)
      ? variant
      : 'contained';

  const safeSize =
    SIZES.includes(size)
      ? size
      : 'md';

  button.classList.add(
    'button',
    safeColor,
    safeVariant,
    safeSize,
  );

  if (fullWidth) {
    button.classList.add(
      'full-width',
    );
  }

  if (iconOnly) {
    button.classList.add(
      'icon-only',
    );

    decorateIconOnlyButton(button);
  }

  decorateIcons(button);
  decorateDisabledState(button);

  return button;
}

function decorateButton(button, block) {
  applyButtonStyles(
    button,
    {
      color: getOption(
        block,
        COLORS,
        'primary',
      ),

      variant: getOption(
        block,
        VARIANTS,
        'contained',
      ),

      size: getOption(
        block,
        SIZES,
        'md',
      ),

      fullWidth:
        block.classList.contains(
          'full-width',
        ),

      iconOnly:
        block.classList.contains(
          'icon-only',
        ),
    },
  );
}

export default function decorate(block) {
  const buttons =
    block.querySelectorAll(
      'a, button',
    );

  buttons.forEach((button) => {
    decorateButton(
      button,
      block,
    );
  });
}