import { createOptimizedPicture } from '../../scripts/aem.js';

const CATEGORY_TYPE = 'category';

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

function createNavigationButton(direction, label) {
  const button = document.createElement('button');

  button.type = 'button';
  button.className = [
    'category-navigation-button',
    `category-navigation-${direction}`,
  ].join(' ');

  button.setAttribute('aria-label', label);

  button.append(
    createArrowIcon(direction),
  );

  return button;
}

function createCategoryImage(imageUrl, title) {
  if (!imageUrl) {
    return null;
  }

  const imageWrapper = document.createElement('span');

  imageWrapper.className = 'category-item-image';

  const picture = createOptimizedPicture(
    imageUrl,
    title || '',
    false,
    [
      {
        media: '(min-width: 768px)',
        width: '96',
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
     * The category title is already visible as text,
     * so the image is decorative.
     */
    image.alt = '';
  }

  imageWrapper.append(picture);

  return imageWrapper;
}

function createCategoryItem(category) {
  const {
    id,
    title,
    subtitle,
    description,
  } = category;

  const imageUrl = category['image-url'];

  /*
   * Don't create an empty category.
   */
  if (!title && !imageUrl) {
    return null;
  }

  const item = document.createElement('li');

  item.className = 'category-item';

  if (id) {
    item.dataset.categoryId = String(id);
  }

  /*
   * Use button because the category is an
   * interactive filter/selection control.
   *
   * If categories navigate to URLs later,
   * change this element to an <a>.
   */
  const button = document.createElement('button');

  button.type = 'button';
  button.className = 'category-item-button';

  if (id) {
    button.dataset.categoryId = String(id);
  }

  if (title) {
    button.setAttribute(
      'aria-label',
      `View ${title}`,
    );
  }

  const image = createCategoryImage(
    imageUrl,
    title,
  );

  if (image) {
    button.append(image);
  }

  if (
    title
    || subtitle
    || description
  ) {
    const content = document.createElement('span');

    content.className = 'category-item-content';

    if (title) {
      const titleElement = document.createElement('span');

      titleElement.className = 'category-item-title';
      titleElement.textContent = title;

      content.append(titleElement);
    }

    if (subtitle) {
      const subtitleElement =
        document.createElement('span');

      subtitleElement.className =
        'category-item-subtitle';

      subtitleElement.textContent =
        subtitle;

      content.append(subtitleElement);
    }

    if (description) {
      const descriptionElement =
        document.createElement('span');

      descriptionElement.className =
        'category-item-description';

      descriptionElement.textContent =
        description;

      content.append(descriptionElement);
    }

    if (content.children.length) {
      button.append(content);
    }
  }

  item.append(button);

  return item;
}

function updateNavigationState(
  list,
  previousButton,
  nextButton,
) {
  const maxScrollLeft =
    list.scrollWidth - list.clientWidth;

  const tolerance = 2;

  previousButton.disabled =
    list.scrollLeft <= tolerance;

  nextButton.disabled =
    list.scrollLeft >= maxScrollLeft - tolerance;
}

function scrollCategories(list, direction) {
  const firstItem =
    list.querySelector('.category-item');

  if (!firstItem) {
    return;
  }

  const itemWidth =
    firstItem.getBoundingClientRect().width;

  const styles =
    window.getComputedStyle(list);

  const gap =
    Number.parseFloat(styles.columnGap)
    || Number.parseFloat(styles.gap)
    || 0;

  const visibleItems = Math.max(
    1,
    Math.floor(
      list.clientWidth / (itemWidth + gap),
    ),
  );

  const scrollAmount =
    (itemWidth + gap)
    * Math.max(1, visibleItems - 1);

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

    return json.data.filter(
      (item) => (
        item.type
          ?.trim()
          .toLowerCase() === CATEGORY_TYPE
      ),
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      'Unable to load categories.',
      error,
    );

    return [];
  }
}

function getDataUrl(block) {
  const link =
    block.querySelector('a[href]');

  if (link?.href) {
    return link.href;
  }

  return block.textContent.trim();
}

function renderEmptyState(block) {
  const message =
    document.createElement('p');

  message.className =
    'category-empty';

  message.textContent =
    'No categories available.';

  block.replaceChildren(message);
}

export default async function decorate(block) {
  const dataUrl = getDataUrl(block);

  if (!dataUrl) {
    renderEmptyState(block);
    return;
  }

  const categories =
    await loadCategories(dataUrl);

  if (!categories.length) {
    renderEmptyState(block);
    return;
  }

  /*
   * Semantic navigation landmark
   */
  const nav =
    document.createElement('nav');

  nav.className =
    'category-navigation';

  nav.setAttribute(
    'aria-label',
    'Product categories',
  );

  /*
   * Category list
   */
  const list =
    document.createElement('ul');

  list.className =
    'category-list';

  list.setAttribute(
    'aria-label',
    'Categories',
  );

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
   * Previous navigation
   */
  const previousButton =
    createNavigationButton(
      'previous',
      'Scroll to previous categories',
    );

  /*
   * Next navigation
   */
  const nextButton =
    createNavigationButton(
      'next',
      'Scroll to next categories',
    );

  previousButton.addEventListener(
    'click',
    () => {
      scrollCategories(
        list,
        'previous',
      );
    },
  );

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
   * Keyboard scrolling
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
   * Update navigation after scrolling.
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
   * Handle responsive changes.
   */
  window.addEventListener(
    'resize',
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

  nav.append(
    previousButton,
    list,
    nextButton,
  );

  block.replaceChildren(nav);

  /*
   * Initial arrow state.
   */
  window.requestAnimationFrame(() => {
    updateNavigationState(
      list,
      previousButton,
      nextButton,
    );
  });
}