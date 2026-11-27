import { createOptimizedPicture } from '../../scripts/aem.js';
import { applyButtonStyles } from '../button/button.js';

const CATEGORY_TYPE = 'category';

/**
 * Creates previous/next arrow icon.
 *
 * @param {'previous'|'next'} direction Arrow direction
 * @returns {SVGElement}
 */
function createArrowIcon(direction) {
  const namespace = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(namespace, 'svg');
  const path = document.createElementNS(namespace, 'path');

  svg.classList.add('category-navigation-icon');

  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  path.setAttribute(
    'd',
    direction === 'previous'
      ? 'M15 18 9 12l6-6'
      : 'm9 18 6-6-6-6',
  );

  svg.append(path);

  return svg;
}

/**
 * Creates category previous/next navigation button.
 *
 * Reuses shared button design system.
 *
 * @param {'previous'|'next'} direction Navigation direction
 * @param {string} label Accessible label
 * @returns {HTMLButtonElement}
 */
function createNavigationButton(direction, label) {
  const button = document.createElement('button');

  button.type = 'button';

  button.classList.add(
    'category-navigation-button',
    `category-navigation-${direction}`,
  );

  button.setAttribute('aria-label', label);

  button.append(
    createArrowIcon(direction),
  );

  applyButtonStyles(button, {
    color: 'secondary',
    variant: 'text',
    size: 'sm',
    iconOnly: true,
  });

  return button;
}

/**
 * Creates optimized category image.
 *
 * @param {string} imageUrl Category image URL
 * @returns {HTMLElement|null}
 */
function createCategoryImage(imageUrl) {
  if (!imageUrl) {
    return null;
  }

  const imageWrapper = document.createElement('span');

  imageWrapper.className = 'category-item-image';

  const picture = createOptimizedPicture(
    imageUrl,
    '',
    false,
    [
      {
        media: '(min-width: 1200px)',
        width: '96',
      },
      {
        media: '(min-width: 768px)',
        width: '80',
      },
      {
        width: '72',
      },
    ],
  );

  const image = picture.querySelector('img');

  if (image) {
    image.loading = 'lazy';
    image.decoding = 'async';

    /*
     * Decorative image because category
     * name is already displayed as text.
     */
    image.alt = '';
  }

  imageWrapper.append(picture);

  return imageWrapper;
}

/**
 * Creates category text content.
 *
 * Empty elements are not rendered.
 *
 * @param {string} title Category title
 * @param {string} subtitle Category subtitle
 * @param {string} description Category description
 * @returns {HTMLElement|null}
 */
function createCategoryContent(
  title,
  subtitle,
  description,
) {
  if (!title && !subtitle && !description) {
    return null;
  }

  const content = document.createElement('span');

  content.className = 'category-item-content';

  if (title) {
    const titleElement = document.createElement('span');

    titleElement.className = 'category-item-title';
    titleElement.textContent = title;

    content.append(titleElement);
  }

  if (subtitle) {
    const subtitleElement = document.createElement('span');

    subtitleElement.className = 'category-item-subtitle';
    subtitleElement.textContent = subtitle;

    content.append(subtitleElement);
  }

  if (description) {
    const descriptionElement = document.createElement('span');

    descriptionElement.className = 'category-item-description';
    descriptionElement.textContent = description;

    content.append(descriptionElement);
  }

  return content;
}

/**
 * Creates one category item.
 *
 * @param {Object} category Category JSON record
 * @returns {HTMLLIElement|null}
 */
function createCategoryItem(category) {
  const {
    id,
    title = '',
    subtitle = '',
    description = '',
  } = category;

  const imageUrl = category['image-url'] || '';

  /*
   * Completely empty category should not render.
   */
  if (!title && !subtitle && !description && !imageUrl) {
    return null;
  }

  const item = document.createElement('li');

  item.className = 'category-item';

  if (id !== undefined && id !== null) {
    item.dataset.categoryId = String(id);
  }

  /*
   * Category works as a selection/filter action.
   * Keep semantic <button>.
   *
   * If category later navigates directly to PLP,
   * change this to an <a href="...">.
   */
  const button = document.createElement('button');

  button.type = 'button';
  button.className = 'category-item-button';

  if (id !== undefined && id !== null) {
    button.dataset.categoryId = String(id);
  }

  if (title) {
    button.setAttribute(
      'aria-label',
      `View ${title}`,
    );
  } else {
    button.setAttribute(
      'aria-label',
      'View category',
    );
  }

  /*
   * Category image
   */
  const image = createCategoryImage(imageUrl);

  if (image) {
    button.append(image);
  }

  /*
   * Category textual content
   */
  const content = createCategoryContent(
    title,
    subtitle,
    description,
  );

  if (content) {
    button.append(content);
  }

  /*
   * Don't render an empty button.
   */
  if (!button.children.length) {
    return null;
  }

  item.append(button);

  return item;
}

/**
 * Determines whether horizontal scrolling is available.
 *
 * @param {HTMLElement} list Category list
 * @returns {boolean}
 */
function hasHorizontalOverflow(list) {
  return list.scrollWidth > list.clientWidth + 2;
}

/**
 * Updates previous/next navigation state.
 *
 * @param {HTMLElement} list Category list
 * @param {HTMLButtonElement} previousButton Previous button
 * @param {HTMLButtonElement} nextButton Next button
 */
function updateNavigationState(
  list,
  previousButton,
  nextButton,
) {
  const tolerance = 2;

  const maxScrollLeft = Math.max(
    0,
    list.scrollWidth - list.clientWidth,
  );

  const isAtStart =
    list.scrollLeft <= tolerance;

  const isAtEnd =
    list.scrollLeft >= maxScrollLeft - tolerance;

  const hasOverflow =
    hasHorizontalOverflow(list);

  previousButton.disabled =
    !hasOverflow || isAtStart;

  nextButton.disabled =
    !hasOverflow || isAtEnd;

  previousButton.setAttribute(
    'aria-disabled',
    String(!hasOverflow || isAtStart),
  );

  nextButton.setAttribute(
    'aria-disabled',
    String(!hasOverflow || isAtEnd),
  );

  /*
   * When all categories fit, navigation
   * controls are unnecessary.
   */
  previousButton.hidden = !hasOverflow;
  nextButton.hidden = !hasOverflow;
}

/**
 * Determines amount to scroll.
 *
 * @param {HTMLElement} list Category list
 * @returns {number}
 */
function getScrollAmount(list) {
  /*
   * Scroll most of the visible viewport.
   * This works better than using the width
   * of the first item because category names
   * have different widths.
   */
  return Math.max(
    200,
    list.clientWidth * 0.75,
  );
}

/**
 * Scrolls category list.
 *
 * @param {HTMLElement} list Category list
 * @param {'previous'|'next'} direction Scroll direction
 */
function scrollCategories(list, direction) {
  const scrollAmount =
    getScrollAmount(list);

  const prefersReducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

  list.scrollBy({
    left:
      direction === 'previous'
        ? -scrollAmount
        : scrollAmount,

    behavior:
      prefersReducedMotion
        ? 'auto'
        : 'smooth',
  });
}

/**
 * Loads JSON and returns only category records.
 *
 * @param {string} url JSON endpoint
 * @returns {Promise<Object[]>}
 */
async function loadCategories(url) {
  if (!url) {
    return [];
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Category request failed: ${response.status}`,
      );
    }

    const json = await response.json();

    if (!Array.isArray(json.data)) {
      return [];
    }

    return json.data.filter((item) => {
      const type =
        typeof item.type === 'string'
          ? item.type.trim().toLowerCase()
          : '';

      return type === CATEGORY_TYPE;
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      'Unable to load categories.',
      error,
    );

    return [];
  }
}

/**
 * Gets JSON URL from authored Category block.
 *
 * Supports:
 * - Authored link
 * - Plain URL text
 *
 * @param {HTMLElement} block Category block
 * @returns {string}
 */
function getDataUrl(block) {
  const link =
    block.querySelector('a[href]');

  if (link?.href) {
    return link.href;
  }

  return block.textContent.trim();
}

/**
 * Renders empty state.
 *
 * @param {HTMLElement} block Category block
 */
function renderEmptyState(block) {
  const message =
    document.createElement('p');

  message.className = 'category-empty';

  message.textContent =
    'No categories available.';

  block.replaceChildren(message);
}

/**
 * Decorates Category block.
 *
 * Expected JSON:
 *
 * {
 *   "data": [
 *     {
 *       "id": "11",
 *       "type": "category",
 *       "image-url": "...",
 *       "title": "Mobiles",
 *       "subtitle": "",
 *       "description": ""
 *     }
 *   ]
 * }
 *
 * Only records where:
 *
 * type === "category"
 *
 * are rendered.
 *
 * @param {HTMLElement} block Category block
 */
export default async function decorate(block) {
  const dataUrl = getDataUrl(block);

  if (!dataUrl) {
    renderEmptyState(block);
    return;
  }

  /*
   * Load category JSON.
   */
  const categories =
    await loadCategories(dataUrl);

  if (!categories.length) {
    renderEmptyState(block);
    return;
  }

  /*
   * Semantic navigation landmark.
   */
  const nav =
    document.createElement('nav');

  nav.className = 'category-navigation';

  nav.setAttribute(
    'aria-label',
    'Product categories',
  );

  /*
   * Previous navigation button.
   */
  const previousButton =
    createNavigationButton(
      'previous',
      'Scroll to previous categories',
    );

  /*
   * Semantic category list.
   */
  const list =
    document.createElement('ul');

  list.className = 'category-list';

  /*
   * Render category records.
   */
  categories.forEach((category) => {
    const item =
      createCategoryItem(category);

    if (item) {
      list.append(item);
    }
  });

  if (!list.children.length) {
    renderEmptyState(block);
    return;
  }

  /*
   * Next navigation button.
   */
  const nextButton =
    createNavigationButton(
      'next',
      'Scroll to next categories',
    );

  /*
   * Previous button action.
   */
  previousButton.addEventListener(
    'click',
    () => {
      scrollCategories(
        list,
        'previous',
      );
    },
  );

  /*
   * Next button action.
   */
  nextButton.addEventListener(
    'click',
    () => {
      scrollCategories(
        list,
        'next',
      );
    },
  );

  /*
   * Keyboard support.
   *
   * ArrowLeft:
   * scroll previous categories.
   *
   * ArrowRight:
   * scroll next categories.
   */
  list.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();

        scrollCategories(
          list,
          'previous',
        );

        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();

        scrollCategories(
          list,
          'next',
        );
      }
    },
  );

  /*
   * Update navigation state after
   * touch, mouse or button scrolling.
   */
  let scrollFrame;

  list.addEventListener(
    'scroll',
    () => {
      window.cancelAnimationFrame(
        scrollFrame,
      );

      scrollFrame =
        window.requestAnimationFrame(
          () => {
            updateNavigationState(
              list,
              previousButton,
              nextButton,
            );
          },
        );
    },
    {
      passive: true,
    },
  );

  /*
   * Build final semantic DOM.
   */
  nav.append(
    previousButton,
    list,
    nextButton,
  );

  block.replaceChildren(nav);

  /*
   * Use ResizeObserver instead of a global
   * resize listener so this component reacts
   * to its actual available width.
   */
  const resizeObserver =
    new ResizeObserver(() => {
      window.cancelAnimationFrame(
        scrollFrame,
      );

      scrollFrame =
        window.requestAnimationFrame(
          () => {
            updateNavigationState(
              list,
              previousButton,
              nextButton,
            );
          },
        );
    });

  resizeObserver.observe(nav);

  /*
   * Initial navigation state after layout.
   */
  window.requestAnimationFrame(() => {
    updateNavigationState(
      list,
      previousButton,
      nextButton,
    );
  });
}