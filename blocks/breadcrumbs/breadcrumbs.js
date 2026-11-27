/**
 * Decorates the existing Breadcrumbs markup.
 *
 * Expected authored structure:
 *
 * ul
 *   li > a
 *   li > a
 *   li
 *
 * @param {HTMLElement} block Breadcrumbs block
 */
export default function decorate(block) {
  const list = block.querySelector('ul');

  if (!list) {
    return;
  }

  const items = [...list.children].filter(
    (item) => item.tagName === 'LI',
  );

  if (!items.length) {
    return;
  }

  /*
   * Use semantic ordered list for breadcrumbs.
   */
  const orderedList = document.createElement('ol');

  orderedList.className = 'breadcrumbs-list';

  items.forEach((item, index) => {
    item.classList.add('breadcrumbs-item');

    const isCurrent = index === items.length - 1;

    if (isCurrent) {
      const link = item.querySelector('a');

      /*
       * Current page should not be a navigation link.
       */
      if (link) {
        const current = document.createElement('span');

        current.textContent = link.textContent.trim();
        current.setAttribute('aria-current', 'page');

        item.replaceChildren(current);
      } else {
        const text = item.textContent.trim();
        const current = document.createElement('span');

        current.textContent = text;
        current.setAttribute('aria-current', 'page');

        item.replaceChildren(current);
      }
    }

    orderedList.append(item);
  });

  const nav = document.createElement('nav');

  nav.className = 'breadcrumbs-nav';

  nav.setAttribute(
    'aria-label',
    'Breadcrumb',
  );

  nav.append(orderedList);

  block.replaceChildren(nav);
}