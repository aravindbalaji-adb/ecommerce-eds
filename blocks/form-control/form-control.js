const SIZES = [
  'sm',
  'small',
  'md',
  'lg',
  'large',
];

/**
 * Finds a supported option from the block classes.
 *
 * @param {HTMLElement} block Form Control block
 * @param {string[]} options Supported options
 * @param {string} fallback Default option
 * @returns {string}
 */
function getOption(
  block,
  options,
  fallback = '',
) {
  return options.find(
    (option) => (
      block.classList.contains(option)
    ),
  ) || fallback;
}

/**
 * Normalizes supported size aliases.
 *
 * small -> sm
 * large -> lg
 *
 * @param {string} size Requested size
 * @returns {'sm'|'md'|'lg'}
 */
function getSafeSize(size) {
  if (size === 'small') {
    return 'sm';
  }

  if (size === 'large') {
    return 'lg';
  }

  if (
    size === 'sm'
    || size === 'md'
    || size === 'lg'
  ) {
    return size;
  }

  return 'md';
}

/**
 * Creates a unique ID when the caller does not
 * provide one.
 *
 * @param {string} prefix ID prefix
 * @returns {string}
 */
function createControlId(
  prefix = 'form-control',
) {
  if (
    typeof crypto !== 'undefined'
    && typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

/**
 * Applies disabled semantics.
 *
 * Supports:
 * disabled
 * aria-disabled="true"
 *
 * @param {HTMLInputElement|HTMLSelectElement} control Form control
 */
function decorateDisabledState(control) {
  const isDisabled = (
    control.disabled
    || control.getAttribute(
      'aria-disabled',
    ) === 'true'
  );

  if (!isDisabled) {
    return;
  }

  control.disabled = true;

  control.setAttribute(
    'aria-disabled',
    'true',
  );
}

/**
 * Applies invalid-state accessibility.
 *
 * @param {HTMLInputElement|HTMLSelectElement} control Form control
 */
function decorateInvalidState(control) {
  if (
    control.getAttribute(
      'aria-invalid',
    ) === 'true'
  ) {
    control.classList.add('invalid');
  }
}

/**
 * Applies required-state accessibility.
 *
 * @param {HTMLInputElement|HTMLSelectElement} control Form control
 */
function decorateRequiredState(control) {
  if (!control.required) {
    return;
  }

  control.setAttribute(
    'aria-required',
    'true',
  );
}

/**
 * Applies shared design-system classes to an
 * existing input or select.
 *
 * @param {HTMLInputElement|HTMLSelectElement} control Form control
 * @param {Object} options Form-control options
 * @param {'sm'|'small'|'md'|'lg'|'large'} options.size Control size
 * @param {boolean} options.fullWidth Full-width state
 * @returns {HTMLInputElement|HTMLSelectElement}
 */
export function applyFormControlStyles(
  control,
  {
    size = 'md',
    fullWidth = false,
  } = {},
) {
  if (!control) {
    return control;
  }

  const safeSize =
    getSafeSize(size);

  if (
    control.tagName === 'SELECT'
  ) {
    control.classList.add(
      'select',
      safeSize,
    );
  } else if (
    control.tagName === 'INPUT'
  ) {
    control.classList.add(
      'input',
      safeSize,
    );
  } else {
    return control;
  }

  if (fullWidth) {
    control.classList.add(
      'full-width',
    );
  }

  decorateDisabledState(control);
  decorateInvalidState(control);
  decorateRequiredState(control);

  return control;
}

/**
 * Decorates one authored form control.
 *
 * @param {HTMLInputElement|HTMLSelectElement} control Control
 * @param {HTMLElement} block Form Control block
 */
function decorateFormControl(
  control,
  block,
) {
  applyFormControlStyles(
    control,
    {
      size: getOption(
        block,
        SIZES,
        'md',
      ),

      fullWidth:
        block.classList.contains(
          'full-width',
        ),
    },
  );
}

/**
 * Finds an existing label associated with a control.
 *
 * @param {HTMLElement} block Form Control block
 * @param {HTMLInputElement|HTMLSelectElement} control Control
 * @returns {HTMLLabelElement|null}
 */
function getControlLabel(
  block,
  control,
) {
  if (control.id) {
    const escapedId =
      CSS.escape(control.id);

    const explicitLabel =
      block.querySelector(
        `label[for="${escapedId}"]`,
      );

    if (explicitLabel) {
      return explicitLabel;
    }
  }

  return control.closest('label');
}

/**
 * Ensures that an authored control with a visible
 * label has a valid label association.
 *
 * @param {HTMLElement} block Form Control block
 * @param {HTMLInputElement|HTMLSelectElement} control Control
 */
function decorateLabel(
  block,
  control,
) {
  const label =
    getControlLabel(
      block,
      control,
    );

  if (!label) {
    return;
  }

  label.classList.add(
    'form-control-label',
  );

  if (!control.id) {
    control.id =
      createControlId(
        'form-control',
      );
  }

  if (
    label.tagName === 'LABEL'
    && !label.contains(control)
  ) {
    label.htmlFor =
      control.id;
  }
}

/**
 * Decorates an authored Form Control block.
 *
 * Supported block classes:
 *
 * form-control sm
 * form-control small
 * form-control md
 * form-control lg
 * form-control large
 * form-control full-width
 *
 * @param {HTMLElement} block Form Control block
 */
export default function decorate(block) {
  const controls = [
    ...block.querySelectorAll(
      'input, select',
    ),
  ];

  controls.forEach((control) => {
    decorateLabel(
      block,
      control,
    );

    decorateFormControl(
      control,
      block,
    );
  });
}

/**
 * Creates the shared Input structure.
 *
 * Structure:
 *
 * div.form-control
 *   label.form-control-label
 *   input.input.md
 *   p.form-control-helper
 *
 * Label and helper are conditionally rendered.
 *
 * @param {Object} options Input configuration
 * @param {string} options.id Input ID
 * @param {string} options.name Input name
 * @param {string} options.type Input type
 * @param {string} options.label Visible label
 * @param {string} options.value Initial value
 * @param {string} options.placeholder Placeholder
 * @param {'sm'|'small'|'md'|'lg'|'large'} options.size Size
 * @param {boolean} options.required Required state
 * @param {boolean} options.disabled Disabled state
 * @param {boolean} options.fullWidth Full-width state
 * @param {string} options.helperText Supporting text
 * @param {string} options.errorMessage Error message
 * @param {string} options.autocomplete Autocomplete value
 * @param {string} options.inputMode Input-mode value
 * @param {string} options.ariaLabel Accessible label
 * @returns {{
 *   wrapper: HTMLDivElement,
 *   label: HTMLLabelElement|null,
 *   input: HTMLInputElement,
 *   helper: HTMLParagraphElement|null
 * }}
 */
export function createInput({
  id = '',
  name = '',
  type = 'text',
  label = '',
  value = '',
  placeholder = '',
  size = 'md',
  required = false,
  disabled = false,
  fullWidth = false,
  helperText = '',
  errorMessage = '',
  autocomplete = '',
  inputMode = '',
  ariaLabel = '',
} = {}) {
  const controlId =
    id
    || createControlId('input');

  const wrapper =
    document.createElement('div');

  wrapper.className =
    'form-control';

  const input =
    document.createElement('input');

  input.id = controlId;
  input.type = type;
  input.name = name;
  input.value = value;
  input.placeholder = placeholder;
  input.required = required;
  input.disabled = disabled;

  if (autocomplete) {
    input.autocomplete =
      autocomplete;
  }

  if (inputMode) {
    input.inputMode =
      inputMode;
  }

  if (ariaLabel) {
    input.setAttribute(
      'aria-label',
      ariaLabel,
    );
  }

  let labelElement = null;

  if (label) {
    labelElement =
      document.createElement('label');

    labelElement.className =
      'form-control-label';

    labelElement.htmlFor =
      controlId;

    labelElement.textContent =
      label;

    if (required) {
      const requiredIndicator =
        document.createElement('span');

      requiredIndicator.className =
        'form-control-required';

      requiredIndicator.setAttribute(
        'aria-hidden',
        'true',
      );

      requiredIndicator.textContent =
        ' *';

      labelElement.append(
        requiredIndicator,
      );
    }

    wrapper.append(
      labelElement,
    );
  }

  applyFormControlStyles(
    input,
    {
      size,
      fullWidth,
    },
  );

  wrapper.append(input);

  let helper = null;

  const supportingText =
    errorMessage || helperText;

  if (supportingText) {
    helper =
      document.createElement('p');

    helper.id =
      `${controlId}-message`;

    helper.className =
      errorMessage
        ? 'form-control-helper error'
        : 'form-control-helper';

    helper.textContent =
      supportingText;

    input.setAttribute(
      'aria-describedby',
      helper.id,
    );

    if (errorMessage) {
      input.setAttribute(
        'aria-invalid',
        'true',
      );

      input.classList.add(
        'invalid',
      );
    }

    wrapper.append(helper);
  }

  return {
    wrapper,
    label: labelElement,
    input,
    helper,
  };
}

/**
 * Creates the shared Select structure.
 *
 * Structure:
 *
 * div.form-control
 *   label.form-control-label
 *   select.select.md
 *     option
 *   p.form-control-helper
 *
 * @param {Object} options Select configuration
 * @param {string} options.id Select ID
 * @param {string} options.name Select name
 * @param {string} options.label Visible label
 * @param {string} options.ariaLabel Accessible label
 * @param {Object[]} options.options Select options
 * @param {string} options.value Selected value
 * @param {'sm'|'small'|'md'|'lg'|'large'} options.size Size
 * @param {boolean} options.required Required state
 * @param {boolean} options.disabled Disabled state
 * @param {boolean} options.fullWidth Full-width state
 * @param {string} options.placeholder Placeholder option
 * @param {string} options.helperText Supporting text
 * @param {string} options.errorMessage Error message
 * @returns {{
 *   wrapper: HTMLDivElement,
 *   label: HTMLLabelElement|null,
 *   select: HTMLSelectElement,
 *   helper: HTMLParagraphElement|null
 * }}
 */
export function createSelect({
  id = '',
  name = '',
  label = '',
  ariaLabel = '',
  options = [],
  value = '',
  size = 'md',
  required = false,
  disabled = false,
  fullWidth = false,
  placeholder = '',
  helperText = '',
  errorMessage = '',
} = {}) {
  const controlId =
    id
    || createControlId('select');

  const wrapper =
    document.createElement('div');

  wrapper.className =
    'form-control';

  const select =
    document.createElement('select');

  select.id = controlId;
  select.name = name;
  select.required = required;
  select.disabled = disabled;

  if (ariaLabel) {
    select.setAttribute(
      'aria-label',
      ariaLabel,
    );
  }

  let labelElement = null;

  if (label) {
    labelElement =
      document.createElement('label');

    labelElement.className =
      'form-control-label';

    labelElement.htmlFor =
      controlId;

    labelElement.textContent =
      label;

    if (required) {
      const requiredIndicator =
        document.createElement('span');

      requiredIndicator.className =
        'form-control-required';

      requiredIndicator.setAttribute(
        'aria-hidden',
        'true',
      );

      requiredIndicator.textContent =
        ' *';

      labelElement.append(
        requiredIndicator,
      );
    }

    wrapper.append(
      labelElement,
    );
  }

  if (placeholder) {
    const placeholderOption =
      document.createElement('option');

    placeholderOption.value = '';
    placeholderOption.textContent =
      placeholder;

    placeholderOption.disabled = true;

    placeholderOption.selected =
      !value;

    select.append(
      placeholderOption,
    );
  }

  options.forEach((option) => {
    const optionElement =
      document.createElement('option');

    optionElement.value =
      String(
        option.value ?? '',
      );

    optionElement.textContent =
      String(
        option.label
        ?? option.value
        ?? '',
      );

    optionElement.disabled =
      Boolean(option.disabled);

    optionElement.selected =
      String(option.value)
      === String(value);

    select.append(
      optionElement,
    );
  });

  applyFormControlStyles(
    select,
    {
      size,
      fullWidth,
    },
  );

  wrapper.append(select);

  let helper = null;

  const supportingText =
    errorMessage || helperText;

  if (supportingText) {
    helper =
      document.createElement('p');

    helper.id =
      `${controlId}-message`;

    helper.className =
      errorMessage
        ? 'form-control-helper error'
        : 'form-control-helper';

    helper.textContent =
      supportingText;

    select.setAttribute(
      'aria-describedby',
      helper.id,
    );

    if (errorMessage) {
      select.setAttribute(
        'aria-invalid',
        'true',
      );

      select.classList.add(
        'invalid',
      );
    }

    wrapper.append(helper);
  }

  return {
    wrapper,
    label: labelElement,
    select,
    helper,
  };
}