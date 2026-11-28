import { createInput } from '../form-control/form-control.js';

const SEARCH_INDEX_URL = '/query-index.json?limit=1000';
const MAX_RESULTS = 10;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

let searchIndexPromise;
let inputId = 0;
function createSearchIcon() {
  const icon = document.createElement('span');

  icon.className = 'search-icon';
  icon.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS(
    SVG_NAMESPACE,
    'svg',
  );

  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('focusable', 'false');

  const lens = document.createElementNS(
    SVG_NAMESPACE,
    'circle',
  );

  lens.setAttribute('cx', '10.8');
  lens.setAttribute('cy', '10.8');
  lens.setAttribute('r', '7.3');

  const handle = document.createElementNS(
    SVG_NAMESPACE,
    'path',
  );

  handle.setAttribute(
    'd',
    'm16.2 16.2 4.8 4.8',
  );

  svg.append(
    lens,
    handle,
  );

  icon.append(svg);

  return icon;
}
export default function decorate(block) {
  inputId += 1;

  const inputElementId =
    `search-input-${inputId}`;

  const statusElementId =
    `search-status-${inputId}`;

  const form = document.createElement('form');

  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.noValidate = true;

  const label = document.createElement('label');

  label.className =
    'search-label visually-hidden';

  label.htmlFor = inputElementId;

  label.textContent =
    'Search products, brands, and more';

  const searchField =
    document.createElement('div');

  searchField.className =
    'search-field sm';

  const icon = createSearchIcon();

  const { input } = createInput({
    id: inputElementId,
    name: 'search',
    type: 'search',
    placeholder:
      'Search for Products, Brands and More',
    ariaLabel:
      'Search products, brands, and more',
    autocomplete: 'off',
  });

  input.spellcheck = false;
  input.enterKeyHint = 'search';

  input.setAttribute(
    'aria-describedby',
    statusElementId,
  );

  const submit =
    document.createElement('button');

  submit.className = 'visually-hidden';
  submit.type = 'submit';
  submit.textContent = 'Search';

  const status =
    document.createElement('p');

  status.id = statusElementId;
  status.className = 'search-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');

  const results =
    document.createElement('ul');

  results.className = 'search-results';

  results.setAttribute(
    'aria-label',
    'Search results',
  );

  searchField.append(
    icon,
    input,
  );

  form.append(
    label,
    searchField,
    submit,
  );

  block.replaceChildren(
    form,
    status,
    results,
  );

  // Keep your remaining search logic here.
}