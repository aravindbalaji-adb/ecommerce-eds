/**
 * Creates an accessible form control.
 * Expected row structure:
 * Label | Type | Size | Name | Placeholder
 * Example:
 * Email address | email | md | email | Enter your email
 *
 * @param {HTMLElement} block Form Controls block
 */
export default function decorate(block) {
  const form = document.createElement('form');
  form.className = 'form-controls-form';

  [...block.children].forEach((row, index) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const labelText = cells[0]?.textContent.trim();
    const type = cells[1]?.textContent.trim().toLowerCase();
    const size = cells[2]?.textContent.trim().toLowerCase() || 'md';
    const name = cells[3]?.textContent.trim() || `field-${index + 1}`;
    const placeholder = cells[4]?.textContent.trim() || '';

    const allowedSizes = ['sm', 'md', 'lg', 'small', 'large'];
    const controlSize = allowedSizes.includes(size) ? size : 'md';

    const field = document.createElement('div');
    field.className = 'form-control-field';

    const id = `form-control-${name}-${index + 1}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;

    let control;

    if (type === 'select') {
      control = document.createElement('select');
      control.className = `select ${controlSize}`;

      const options = placeholder
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean);

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = options.length
        ? `Select ${labelText}`
        : labelText;
      defaultOption.disabled = true;
      defaultOption.selected = true;

      control.append(defaultOption);

      options.forEach((optionText) => {
        const option = document.createElement('option');
        option.value = optionText.toLowerCase().replace(/\s+/g, '-');
        option.textContent = optionText;
        control.append(option);
      });
    } else {
      const supportedTypes = [
        'text',
        'email',
        'password',
        'number',
        'tel',
        'url',
        'search',
        'date',
      ];

      control = document.createElement('input');
      control.type = supportedTypes.includes(type) ? type : 'text';
      control.className = `input ${controlSize}`;
      control.placeholder = placeholder;

      if (control.type === 'email') {
        control.autocomplete = 'email';
      }

      if (control.type === 'tel') {
        control.autocomplete = 'tel';
      }
    }

    control.id = id;
    control.name = name;

    field.append(label, control);
    form.append(field);
  });

  block.replaceChildren(form);
}