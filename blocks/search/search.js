const SEARCH_INDEX_URL = '/query-index.json?limit=1000';
const MAX_RESULTS = 10;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

let searchIndexPromise;
let inputId = 0;

async function loadSearchIndex() {
  const response = await fetch(SEARCH_INDEX_URL);

  if (!response.ok) {
    throw new Error(
      `Search index request failed with status ${response.status}`,
    );
  }

  const index = await response.json();

  if (!Array.isArray(index.data)) {
    throw new Error('Search index response does not contain a data array');
  }

  return index.data;
}

function getSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = loadSearchIndex().catch((error) => {
      searchIndexPromise = null;
      throw error;
    });
  }

  return searchIndexPromise;
}

function updateSearchUrl(query) {
  const url = new URL(window.location.href);

  if (query) {
    url.searchParams.set('q', query);
  } else {
    url.searchParams.delete('q');
  }

  window.history.replaceState({}, '', url);
}

function createSearchIcon() {
  const icon = document.createElement('span');
  icon.className = 'search-icon';
  icon.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('focusable', 'false');

  const lens = document.createElementNS(SVG_NAMESPACE, 'circle');
  lens.setAttribute('cx', '10.8');
  lens.setAttribute('cy', '10.8');
  lens.setAttribute('r', '7.3');

  const handle = document.createElementNS(SVG_NAMESPACE, 'path');
  handle.setAttribute('d', 'm16.2 16.2 4.8 4.8');

  svg.append(lens, handle);
  icon.append(svg);

  return icon;
}

function createResult(page) {
  const {
    path,
    title = '',
    description = '',
  } = page;

  if (
    typeof path !== 'string'
    || !path.startsWith('/')
    || path.startsWith('//')
  ) {
    return null;
  }

  const item = document.createElement('li');
  item.className = 'search-result';

  const link = document.createElement('a');
  link.className = 'search-result-link';
  link.href = path;
  link.textContent = typeof title === 'string' && title.trim()
    ? title.trim()
    : path;

  item.append(link);

  if (typeof description === 'string' && description.trim()) {
    const resultDescription = document.createElement('p');
    resultDescription.className = 'search-result-description';
    resultDescription.textContent = description.trim();
    item.append(resultDescription);
  }

  return item;
}

function findResults(pages, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return pages.filter((page) => {
    const title = typeof page.title === 'string' ? page.title : '';
    const description = typeof page.description === 'string'
      ? page.description
      : '';
    const path = typeof page.path === 'string' ? page.path : '';

    const searchableContent = `${title} ${description} ${path}`
      .toLocaleLowerCase();

    return searchableContent.includes(normalizedQuery);
  });
}

export default function decorate(block) {
  inputId += 1;

  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.setAttribute('novalidate', '');

  /*
   * A real label is retained for accessibility.
   * CSS visually hides the label because the screenshot shows only the input.
   */
  const label = document.createElement('label');
  label.className = 'search-label visually-hidden';
  label.htmlFor = `search-input-${inputId}`;
  label.textContent = 'Search products, brands, and more';

  const searchField = document.createElement('div');
  searchField.className = 'search-field md';

  const icon = createSearchIcon();

  const input = document.createElement('input');
  input.id = label.htmlFor;
  input.className = 'input';
  input.type = 'text';
  input.name = 'q';
  input.placeholder = 'Search for Products, Brands and More';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.enterKeyHint = 'search';
  input.setAttribute('aria-describedby', `search-status-${inputId}`);

  /*
   * The screenshot does not have a visible search button.
   * This hidden submit button preserves standard form submission.
   */
  const submit = document.createElement('button');
  submit.className = 'visually-hidden';
  submit.type = 'submit';
  submit.textContent = 'Search';

  const status = document.createElement('p');
  status.id = `search-status-${inputId}`;
  status.className = 'search-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');

  const results = document.createElement('ul');
  results.className = 'search-results';
  results.setAttribute('aria-label', 'Search results');

  searchField.append(icon, input);
  form.append(label, searchField, submit);
  block.replaceChildren(form, status, results);

  let requestId = 0;

  async function search(query) {
    requestId += 1;
    const currentRequestId = requestId;
    const normalizedQuery = query.trim();

    results.replaceChildren();
    status.removeAttribute('data-state');

    if (!normalizedQuery) {
      status.textContent = 'Enter a search term.';
      updateSearchUrl('');
      input.focus();
      return;
    }

    status.textContent = 'Searching…';
    form.setAttribute('aria-busy', 'true');
    input.disabled = true;
    submit.disabled = true;
    updateSearchUrl(normalizedQuery);

    try {
      const pages = await getSearchIndex();

      if (currentRequestId !== requestId) {
        return;
      }

      const matches = findResults(pages, normalizedQuery);

      const visibleMatches = matches
        .slice(0, MAX_RESULTS)
        .map(createResult)
        .filter(Boolean);

      results.replaceChildren(...visibleMatches);

      if (matches.length > 0) {
        status.textContent = `Showing ${visibleMatches.length} of ${matches.length} results for "${normalizedQuery}".`;
      } else {
        status.textContent = `No results found for "${normalizedQuery}".`;
      }
    } catch (error) {
      if (currentRequestId !== requestId) {
        return;
      }

      // eslint-disable-next-line no-console
      console.error('Search failed to load the query index', error);

      status.dataset.state = 'error';
      status.textContent = 'Search is temporarily unavailable. Please try again.';
    } finally {
      if (currentRequestId === requestId) {
        form.removeAttribute('aria-busy');
        input.disabled = false;
        submit.disabled = false;
        input.focus();
      }
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    search(input.value);
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q');

  if (initialQuery?.trim()) {
    input.value = initialQuery.trim();
    search(initialQuery);
  }
}