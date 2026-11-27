import { createOptimizedPicture } from "../../scripts/aem.js";
import { createButton, applyButtonStyles } from "../button/button.js";

const CATEGORY_TYPE = "category";

/**
 * Creates a category item using the existing Button structure.
 *
 * @param {Object} category Category data
 * @returns {HTMLLIElement|null}
 */
function createCategoryItem(category) {
  const {
    id,
    title = '',
    'image-url': imageUrl = '',
  } = category;

  if (!title && !imageUrl) {
    return null;
  }

  const item = document.createElement('li');
  item.className = 'category-item';

  /*
   * Mobiles -> mobiles
   * Small Appliances -> small-appliances
   * Air Conditioners -> air-conditioners
   */
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const categoryUrl = `/category/${slug}`;

  /*
   * Reuse complete custom Button component.
   */
  const { wrapper, button } = createButton({
    href: categoryUrl,
    title: title || 'Category',
    label: title,
    iconSrc: imageUrl,
    color: 'secondary',
    variant: 'text',
    size: 'md',
  });

  if (id !== undefined && id !== null) {
    const categoryId = String(id);

    item.dataset.categoryId = categoryId;
    button.dataset.categoryId = categoryId;
  }

  /*
   * Open category PLP in a new tab.
   */
  button.target = '_blank';
  button.rel = 'noopener noreferrer';

  item.append(wrapper);

  return item;
}

/**
 * Creates previous/next navigation
 * using the existing Button structure.
 *
 * @param {'previous'|'next'} direction Direction
 * @param {string} label Accessible label
 * @param {string} iconName Icon name
 * @returns {{
 *   wrapper: HTMLParagraphElement,
 *   button: HTMLAnchorElement
 * }}
 */
function createNavigationIcon(direction) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  const path = document.createElementNS(namespace, 'path');

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
  /*
   * Reuse complete Button component.
   */
  const { wrapper, button } = createButton({
    href: '#',
    title: label,
    label,
    color: 'secondary',
    variant: 'text',
    size: 'md',
    iconOnly: true,
  });

  /*
   * Only Category-specific class.
   */
  button.classList.add(direction);

  /*
   * Get the existing Button icon container.
   *
   * If createButton() didn't create .icon because
   * no iconSrc was supplied, create only the slot.
   */
  let icon = button.querySelector('.icon');

  if (!icon) {
    icon = document.createElement('span');
    icon.className = 'icon';

    button.prepend(icon);
  }

  /*
   * Add Category's SVG arrow into the existing
   * Button icon slot.
   */
  icon.replaceChildren(
    createNavigationIcon(direction),
  );

  icon.setAttribute(
    'aria-hidden',
    'true',
  );

  return {
    wrapper,
    button,
  };
}

/**
 * Fetches category data.
 *
 * @param {string} url JSON endpoint
 * @returns {Promise<Object[]>}
 */
async function fetchCategories(url) {
  if (!url) {
    return [];
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Category request failed: ${response.status}`);
    }

    const json = await response.json();

    if (!Array.isArray(json.data)) {
      return [];
    }

    return json.data.filter(
      (item) =>
        typeof item.type === "string" &&
        item.type.trim().toLowerCase() === CATEGORY_TYPE,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unable to load category data.", error);

    return [];
  }
}

/**
 * Gets JSON URL from authored block.
 *
 * @param {HTMLElement} block Category block
 * @returns {string}
 */
function getDataUrl(block) {
  const link = block.querySelector("a[href]");

  if (link?.href) {
    return link.href;
  }

  return block.textContent.trim();
}

/**
 * Checks horizontal overflow.
 *
 * @param {HTMLElement} list Category list
 * @returns {boolean}
 */
function hasOverflow(list) {
  return list.scrollWidth > list.clientWidth + 2;
}

/**
 * Sets disabled state on anchor-based Button.
 *
 * @param {HTMLAnchorElement} button Button
 * @param {boolean} disabled Disabled state
 */
function setDisabled(button, disabled) {
  button.setAttribute("aria-disabled", String(disabled));

  button.tabIndex = disabled ? -1 : 0;
}

/**
 * Updates previous/next state.
 *
 * @param {HTMLElement} list Category list
 * @param {Object} previous Previous control
 * @param {Object} next Next control
 */
function updateNavigation(list, previous, next) {
  const tolerance = 2;

  const maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);

  const overflowing = hasOverflow(list);

  const atStart = list.scrollLeft <= tolerance;

  const atEnd = list.scrollLeft >= maxScroll - tolerance;

  setDisabled(previous.button, !overflowing || atStart);

  setDisabled(next.button, !overflowing || atEnd);

  previous.wrapper.hidden = !overflowing;
  next.wrapper.hidden = !overflowing;
}

/**
 * Scrolls category list.
 *
 * @param {HTMLElement} list Category list
 * @param {'previous'|'next'} direction Direction
 */
function scrollCategories(list, direction) {
  const scrollAmount = Math.max(200, list.clientWidth * 0.75);

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  list.scrollBy({
    left: direction === "previous" ? -scrollAmount : scrollAmount,

    behavior: reducedMotion ? "auto" : "smooth",
  });
}

/**
 * Adds navigation action.
 *
 * @param {HTMLAnchorElement} button
 * @param {HTMLElement} list
 * @param {'previous'|'next'} direction
 */
function addNavigationAction(button, list, direction) {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    if (button.getAttribute("aria-disabled") === "true") {
      return;
    }

    scrollCategories(list, direction);
  });
}

/**
 * Renders empty state.
 *
 * @param {HTMLElement} block
 */
function renderEmptyState(block) {
  const message = document.createElement("p");

  message.textContent = "No categories available.";

  block.replaceChildren(message);
}

/**
 * Decorates Category block.
 *
 * @param {HTMLElement} block Category block
 */
export default async function decorate(block) {
  const dataUrl = getDataUrl(block);

  if (!dataUrl) {
    renderEmptyState(block);
    return;
  }

  const categories = await fetchCategories(dataUrl);
  console.log("categories: ", categories);

  if (!categories.length) {
    renderEmptyState(block);
    return;
  }

  const wrapper = document.createElement("nav");

  wrapper.className = "category-wrapper";

  wrapper.setAttribute("aria-label", "Product categories");

  /*
   * Existing Button structure.
   *
   * Change these icon names only if your
   * actual files have different names.
   */
  const previous = createNavigationButton(
    "previous",
    "Previous categories",
    "previous",
  );

  const next = createNavigationButton("next", "Next categories", "next");

  const list = document.createElement("ul");

  list.className = "category-list";

  categories.forEach((category) => {
    console.log("category: ", category);
    const item = createCategoryItem(category);

    if (item) {
      list.append(item);
    }
  });

  if (!list.children.length) {
    renderEmptyState(block);
    return;
  }

  addNavigationAction(previous.button, list, "previous");

  addNavigationAction(next.button, list, "next");

  wrapper.append(previous.wrapper, list, next.wrapper);

  block.replaceChildren(wrapper);

  let animationFrame;

  const update = () => {
    updateNavigation(list, previous, next);
  };

  list.addEventListener(
    "scroll",
    () => {
      window.cancelAnimationFrame(animationFrame);

      animationFrame = window.requestAnimationFrame(update);
    },
    {
      passive: true,
    },
  );

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(animationFrame);

      animationFrame = window.requestAnimationFrame(update);
    });

    resizeObserver.observe(wrapper);
  } else {
    window.addEventListener("resize", update, {
      passive: true,
    });
  }

  window.requestAnimationFrame(update);
}
