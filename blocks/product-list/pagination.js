import { createButton } from '../button/button.js';

const ELLIPSIS = 'ellipsis';

/**
 * Builds the page list, e.g. [1, 'ellipsis', 4, 5, 6, 'ellipsis', 18].
 *
 * @param {number} current Current page
 * @param {number} total Total pages
 * @returns {Array<number|string>}
 */
export function getPageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current - 1, current, current + 1]);

  if (current <= 3) {
    [2, 3, 4].forEach((page) => pages.add(page));
  }

  if (current >= total - 2) {
    [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));
  }

  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  return sorted.reduce((items, page, index) => {
    if (index && page - sorted[index - 1] > 1) {
      items.push(ELLIPSIS);
    }

    items.push(page);

    return items;
  }, []);
}

function createStepButton(label, title) {
  const { wrapper, button } = createButton({
    href: '#',
    title,
    label,
    color: 'accent',
    variant: 'text',
    size: 'sm',
  });

  wrapper.classList.add('pagination-step');

  return { wrapper, button };
}

/**
 * Creates a pagination control.
 *
 * @param {Object} options Options
 * @param {number} options.pageSize Items per page
 * @param {Function} options.onChange Called with the new page number
 * @returns {{
 *   element: HTMLElement,
 *   getPage: () => number,
 *   setPage: (page: number) => void,
 *   update: (totalItems: number) => void,
 *   slice: (items: Array) => Array
 * }}
 */
export function createPagination({ pageSize = 12, onChange } = {}) {
  let page = 1;
  let totalPages = 1;

  const element = document.createElement('nav');
  const summary = document.createElement('p');
  const controls = document.createElement('div');
  const list = document.createElement('ul');

  element.className = 'pagination';
  element.setAttribute('aria-label', 'Pagination');
  summary.className = 'pagination-summary';
  controls.className = 'pagination-controls';
  list.className = 'pagination-pages';

  const previous = createStepButton('PREVIOUS', 'Previous page');
  const next = createStepButton('NEXT', 'Next page');

  controls.append(previous.wrapper, list, next.wrapper);
  element.append(summary, controls);

  function goTo(target) {
    const clamped = Math.min(Math.max(target, 1), totalPages);

    if (clamped === page) {
      return;
    }

    page = clamped;
    onChange?.(page);
  }

  function render() {
    element.hidden = totalPages <= 1;
    summary.textContent = `Page ${page} of ${totalPages}`;

    previous.button.setAttribute('aria-disabled', String(page <= 1));
    next.button.setAttribute('aria-disabled', String(page >= totalPages));

    list.replaceChildren(
      ...getPageItems(page, totalPages).map((item) => {
        const li = document.createElement('li');

        if (item === ELLIPSIS) {
          li.className = 'pagination-ellipsis';
          li.textContent = '…';

          return li;
        }

        const { wrapper, button: pageButton } = createButton({
          href: '#',
          title: `Page ${item}`,
          label: String(item),
          color: item === page ? 'accent' : 'secondary',
          variant: item === page ? 'contained' : 'text',
          size: 'sm',
        });

        wrapper.classList.add('pagination-page');

        if (item === page) {
          pageButton.setAttribute('aria-current', 'page');
        }

        pageButton.addEventListener('click', (event) => {
          event.preventDefault();
          goTo(item);
        });
        li.append(wrapper);

        return li;
      }),
    );
  }

  [[previous, -1], [next, 1]].forEach(([{ button }, step]) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      goTo(page + step);
    });
  });

  return {
    element,
    getPage: () => page,
    setPage(value) {
      page = Math.max(1, Number(value) || 1);
      render();
    },
    update(totalItems) {
      totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      page = Math.min(page, totalPages);
      render();
    },
    slice(items) {
      const start = (page - 1) * pageSize;

      return items.slice(start, start + pageSize);
    },
  };
}
