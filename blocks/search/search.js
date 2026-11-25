const SEARCH_INDEX_URL = '/query-index.json?limit=1000';
const MAX_RESULTS = 10;

let searchIndexPromise;
let inputId = 0;

async function loadSearchIndex() {
  const response = await fetch(SEARCH_INDEX_URL);
  if (!response.ok) {
    throw new Error(`Search index request failed with status ${response.status}`);
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
  const params = new URLSearchParams(window.location.search);
  if (query) params.set('q', query);
  else params.delete('q');
  const search = params.toString();
  const url = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', url);
}

function createResult(page) {
  if (typeof page.path !== 'string' || !page.path.startsWith('/') || page.path.startsWith('//')) {
    return null;
  }

  const item = document.createElement('li');
  item.className = 'search-result';

  const link = document.createElement('a');
  link.className = 'search-result-link';
  link.href = page.path;
  link.textContent = typeof page.title === 'string' && page.title.trim()
    ? page.title
    : page.path;
  item.append(link);

  if (typeof page.description === 'string' && page.description.trim()) {
    const description = document.createElement('p');
    description.className = 'search-result-description';
    description.textContent = page.description;
    item.append(description);
  }

  return item;
}

function findResults(pages, query) {
  const normalizedQuery = query.toLocaleLowerCase();
  return pages.filter((page) => {
    const title = typeof page.title === 'string' ? page.title : '';
    const description = typeof page.description === 'string' ? page.description : '';
    const path = typeof page.path === 'string' ? page.path : '';
    return `${title} ${description} ${path}`.toLocaleLowerCase().includes(normalizedQuery);
  });
}

export default function decorate(block) {
  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');

  const label = document.createElement('label');
  label.className = 'search-label';
  label.htmlFor = `search-input-${inputId += 1}`;
  label.textContent = 'Search products';

  const input = document.createElement('input');
  input.id = label.htmlFor;
  input.className = 'input md';
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search products';
  input.autocomplete = 'off';

  const submit = document.createElement('button');
  submit.className = 'button md';
  submit.type = 'submit';
  submit.textContent = 'Search';

  const status = document.createElement('p');
  status.className = 'search-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const results = document.createElement('ul');
  results.className = 'search-results';

  form.append(label, input, submit);
  block.replaceChildren(form, status, results);

  let requestId = 0;
  async function search(query) {
    const currentRequest = requestId + 1;
    requestId = currentRequest;
    const normalizedQuery = query.trim();
    results.replaceChildren();
    status.removeAttribute('data-state');

    if (!normalizedQuery) {
      status.textContent = 'Enter a search term.';
      input.focus();
      updateSearchUrl('');
      return;
    }

    status.textContent = 'Searching...';
    form.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    updateSearchUrl(normalizedQuery);

    try {
      const pages = await getSearchIndex();
      if (currentRequest !== requestId) return;

      const matches = findResults(pages, normalizedQuery);
      const visibleMatches = matches
        .slice(0, MAX_RESULTS)
        .map(createResult)
        .filter((item) => item);
      results.replaceChildren(...visibleMatches);
      status.textContent = matches.length
        ? `Showing ${visibleMatches.length} of ${matches.length} results for "${normalizedQuery}".`
        : `No results found for "${normalizedQuery}".`;
    } catch (error) {
      if (currentRequest !== requestId) return;
      // eslint-disable-next-line no-console
      console.error('Search failed to load the query index', error);
      status.dataset.state = 'error';
      status.textContent = 'Search is temporarily unavailable. Please try again.';
    } finally {
      if (currentRequest === requestId) {
        form.removeAttribute('aria-busy');
        submit.disabled = false;
      }
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    search(input.value);
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    input.value = initialQuery;
    search(initialQuery);
  }
}
