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
  console.log("button: ", button.classList.value);
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


/**
 * Creates the standard design-system Button structure.
 *
 * Structure:
 * p.button-wrapper
 *   a.button
 *     span.icon
 *       img
 *     span.button-label
 *
 * @param {Object} options Button options
 * @returns {{
 *   wrapper: HTMLParagraphElement,
 *   button: HTMLAnchorElement
 * }}
 */
export function createButton({
  href = '#',
  title = '',
  label = '',
  iconSrc = '',
  iconName = '',
  color = 'primary',
  variant = 'contained',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
} = {}) {
  const wrapper = document.createElement('p');
  const button = document.createElement('a');

  wrapper.className = 'button-wrapper';

  button.href = href;
  button.title = title || label;

  /*
   * Icon
   */
  if (iconSrc) {
    const icon = document.createElement('span');
    const image = document.createElement('img');

    icon.className = iconName
      ? `icon icon-${iconName}`
      : 'icon';

    if (iconName) {
      image.dataset.iconName = iconName;
    }

    image.src = iconSrc;
    image.alt = '';
    image.loading = 'lazy';
    image.width = 16;
    image.height = 16;

    icon.append(image);
    button.append(icon);
  }

  /*
   * Icon-only:
   * Do NOT render .button-label.
   * Accessibility comes from aria-label.
   */
  if (iconOnly) {
    const accessibleLabel = title || label;

    if (accessibleLabel) {
      button.setAttribute(
        'aria-label',
        accessibleLabel,
      );
    }
  } else if (label) {
    /*
     * Normal buttons render visible label.
     */
    const buttonLabel = document.createElement('span');

    buttonLabel.className = 'button-label';
    buttonLabel.textContent = label;

    button.append(buttonLabel);
  }

  applyButtonStyles(button, {
    color,
    variant,
    size,
    fullWidth,
    iconOnly,
  });

  wrapper.append(button);

  return {
    wrapper,
    button,
  };
}
