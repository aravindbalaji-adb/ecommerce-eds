import { createButton } from '../button/button.js';
import { createSelect } from '../form-control/form-control.js';
import {
  EMPTY_ICON,
  FILTER_ICON,
  PRODUCT_FALLBACK_IMAGE,
  STAR_ICON,
} from '../../scripts/svg.js';
import { loadCSS } from '../../scripts/aem.js';
import { createPagination } from './pagination.js';
import toNumber from './product-utils.js';
import { createFilters, filterProducts } from './filters.js';

const PRODUCT_TYPE = 'product';

const SORT_OPTIONS = [
  {
    value: 'featured',
    label: 'Recommended',
  },
  {
    value: 'price-low-high',
    label: 'Price: Low to High',
  },
  {
    value: 'price-high-low',
    label: 'Price: High to Low',
  },
  {
    value: 'rating',
    label: 'Customer Rating',
  },
  {
    value: 'discount',
    label: 'Discount',
  },
];

/**
 * Converts different boolean representations
 * into a Boolean value.
 *
 * @param {*} value Value
 * @param {boolean} fallback Fallback
 * @returns {boolean}
 */
function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized =
      value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return fallback;
}

/**
 * Formats a price based on its currency.
 *
 * @param {*} value Price
 * @param {string} currency Currency code
 * @returns {string}
 */
function formatPrice(
  value,
  currency = 'INR',
) {
  const price = toNumber(value);

  try {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      },
    ).format(price);
  } catch (error) {
    return `â‚¹${price.toLocaleString('en-IN')}`;
  }
}

/**
 * Normalizes values for URL and data matching.
 *
 * Examples:
 *
 * Mobiles -> mobiles
 * Small Appliances -> small-appliances
 * Air Conditioners -> air-conditioners
 *
 * @param {*} value Value
 * @returns {string}
 */
function normalizeValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Creates a human-readable label from a slug.
 *
 * @param {string} value Slug
 * @returns {string}
 */
function formatLabel(value) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map((part) => (
      part.charAt(0).toUpperCase()
      + part.slice(1)
    ))
    .join(' ');
}

/**
 * Fetches product JSON.
 *
 * @param {string} url JSON endpoint
 * @returns {Promise<Object[]>}
 */
async function fetchProducts(url) {
  if (!url) {
    return [];
  }

  try {
    const response = await fetch(
      url,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Product request failed: ${response.status}`,
      );
    }

    const json =
      await response.json();

    if (!Array.isArray(json.data)) {
      throw new Error(
        'Product response does not contain a data array.',
      );
    }

    return json.data.filter(
      (item) => (
        normalizeValue(item.type)
        === PRODUCT_TYPE
        && item.enabled !== 'false'
      ),
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      'Unable to load products.',
      error,
    );

    return [];
  }
}

/**
 * Reads Product List block configuration.
 *
 * Block example:
 *
 * Product List
 * /products.json
 * mobiles
 *
 * The page URL category has priority:
 *
 * /products?category=mobiles
 *
 * @param {HTMLElement} block Product List block
 * @returns {{
 *   jsonUrl: string,
 *   category: string
 * }}
 */
function getBlockConfig(block) {
  const rows =
    [...block.children];

  const authoredLink =
    rows[0]?.querySelector('a[href]');

  const jsonUrl =
    authoredLink?.href
    || rows[0]?.textContent.trim()
    || '';

  const authoredCategory =
    normalizeValue(
      rows[1]?.textContent,
    );

  const searchParams =
    new URLSearchParams(
      window.location.search,
    );

  const queryCategory =
    normalizeValue(
      searchParams.get('category'),
    );

  return {
    jsonUrl,
    category:
      queryCategory
      || authoredCategory,
  };
}

/**
 * Creates an accessible icon-only button.
 *
 * @param {string} label Accessible label
 * @param {string} symbol Visible symbol
 * @returns {HTMLButtonElement}
 */
function createIconButton(label, symbol) {
  const button =
    document.createElement('button');

  button.type = 'button';
  button.setAttribute(
    'aria-label',
    label,
  );

  const icon =
    document.createElement('span');

  icon.setAttribute(
    'aria-hidden',
    'true',
  );

  icon.textContent = symbol;

  button.append(icon);

  return button;
}

/**
 * Creates sorting control.
 *
 * @returns {{
 *   wrapper: HTMLLabelElement,
 *   select: HTMLSelectElement
 * }}
 */
function createSort() {
  const wrapper =
    document.createElement('div');

  wrapper.className =
    'product-sort';

  const text =
    document.createElement('span');

  text.textContent =
    'Sort by';

  const {
    wrapper: selectWrapper,
    select,
  } = createSelect({
    id: 'product-sort',
    name: 'product-sort',
    ariaLabel: 'Sort products',
    options: SORT_OPTIONS,
    value: 'featured',
    size: 'sm',
  });

  wrapper.append(
    text,
    selectWrapper,
  );

  return {
    wrapper,
    select,
  };
}

/**
 * Creates product image.
 *
 * @param {Object} product Product
 * @returns {HTMLImageElement|null}
 */
function createProductImageFallback(label) {
  const fallback = document.createElement('span');

  fallback.className = 'product-card-image-fallback';
  fallback.setAttribute('role', 'img');
  fallback.setAttribute('aria-label', label);
  fallback.style.setProperty(
    '--product-fallback-icon',
    `url("${PRODUCT_FALLBACK_IMAGE}")`,
  );

  return fallback;
}

function createProductImage(product) {
  const label = product['image-alt']
    || product.title
    || product.brand
    || 'Product image';

  const imageUrl = String(product['image-url'] || '').trim();

  if (!imageUrl) {
    return createProductImageFallback(label);
  }

  const image = document.createElement('img');

  image.src = imageUrl;
  image.alt = label;
  image.loading = 'lazy';
  image.decoding = 'async';

  image.addEventListener('error', () => {
    image.replaceWith(createProductImageFallback(label));
  }, { once: true });

  return image;
}
/**
 * Creates a product link.
 *
 * @param {Object} product Product
 * @returns {HTMLAnchorElement}
 */
function createProductLink(product) {
  const link =
    document.createElement('a');

  // Build /{category}/p/{id} from category-url and id, e.g. /mobiles/p/PRD-001
  let categorySlug = '';
  const categoryUrl = product['category-url'];

  if (categoryUrl) {
    try {
      const url = new URL(categoryUrl, window.location.origin);
      categorySlug = url.searchParams.get('category')
        || url.pathname.split('/').filter(Boolean).pop()
        || '';
    } catch (e) {
      categorySlug = '';
    }
  }

  link.href = (categorySlug && product.id)
    ? `/${categorySlug}/p/${encodeURIComponent(product.id)}`
    : (product['product-url'] || '#');

  return link;
}

/**
 * Creates product rating.
 *
 * @param {Object} product Product
 * @returns {HTMLElement|null}
 */
function createRating(product) {
  if (!product.rating) {
    return null;
  }

  const rating =
    document.createElement('p');

  rating.className =
    'product-card-rating';

  const ratingValue =
    toNumber(product.rating);

  rating.setAttribute(
    'aria-label',
    `${ratingValue} out of 5 stars${product.reviews
      ? `, ${product.reviews} reviews`
      : ''
    }`,
  );

  const star =
    document.createElement('span');

  star.setAttribute(
    'aria-hidden',
    'true',
  );

  star.className = 'product-card-rating-star';
  star.style.setProperty(
    '--product-star-icon',
    `url("${STAR_ICON}")`,
  );

  const value =
    document.createElement('span');

  value.textContent =
    String(product.rating);

  rating.append(
    value,
    star,
  );

  if (product.reviews) {
    const reviews =
      document.createElement('span');

    reviews.className = 'product-card-rating-count';
    reviews.textContent =
      String(product.reviews);

    rating.append(reviews);
  }

  return rating;
}

/**
 * Creates product pricing.
 *
 * @param {Object} product Product
 * @returns {HTMLElement|null}
 */
function createPricing(product) {
  if (!product.price) {
    return null;
  }

  const pricing =
    document.createElement('div');

  pricing.className =
    'product-card-pricing';

  const price =
    document.createElement('span');

  price.className =
    'product-card-price';

  price.textContent =
    formatPrice(
      product.price,
      product.currency || 'INR',
    );

  pricing.append(price);

  if (product['original-price']) {
    const original =
      document.createElement('del');

    original.textContent =
      formatPrice(
        product['original-price'],
        product.currency || 'INR',
      );

    pricing.append(original);
  }

  if (product.discount) {
    const discount =
      document.createElement('span');

    discount.className =
      'product-card-discount';

    discount.textContent =
      `(${product.discount}% OFF)`;

    pricing.append(discount);
  }

  return pricing;
}

/**
 * Creates wishlist button.
 *
 * @param {Object} product Product
 * @returns {HTMLButtonElement|null}
 */
function createWishlistButton(product) {
  if (
    !toBoolean(
      product['wishlist-enabled'],
    )
  ) {
    return null;
  }

  const button =
    createIconButton(
      `Add ${product.title || 'product'} to wishlist`,
      'â™¡',
    );

  button.className =
    'product-card-wishlist';

  button.setAttribute(
    'aria-pressed',
    'false',
  );

  button.addEventListener(
    'click',
    () => {
      const isActive =
        button.getAttribute(
          'aria-pressed',
        ) === 'true';

      const nextState =
        !isActive;

      button.setAttribute(
        'aria-pressed',
        String(nextState),
      );

      button.setAttribute(
        'aria-label',
        nextState
          ? `Remove ${product.title || 'product'} from wishlist`
          : `Add ${product.title || 'product'} to wishlist`,
      );

      button.textContent =
        nextState ? 'â™¥' : 'â™¡';
    },
  );

  return button;
}

/**
 * Creates one product card.
 *
 * @param {Object} product Product
 * @returns {HTMLLIElement}
 */
function createProductCard(product) {
  const item =
    document.createElement('li');

  item.dataset.productId =
    String(product.id || '');

  const article =
    document.createElement('article');

  article.className =
    'product-card';

  /*
   * Product link wraps the complete
   * navigational card content.
   */
  const cardLink =
    createProductLink(product);

  cardLink.className =
    'product-card-link';

  cardLink.setAttribute(
    'aria-label',
    `View ${product.title || 'product'}`,
  );

  /*
   * Media
   */
  const media =
    document.createElement('div');

  media.className =
    'product-card-media';

  const image =
    createProductImage(product);

  if (image) {
    media.append(image);
  }

  if (product.badge) {
    const badge =
      document.createElement('span');

    badge.className =
      'product-card-badge';

    badge.textContent =
      product.badge;

    media.append(badge);
  }

  /*
   * Content
   */
  const content =
    document.createElement('div');

  content.className =
    'product-card-content';

  const rating =
    createRating(product);

  if (rating) {
    content.append(rating);
  }

  if (product.brand) {
    const brand =
      document.createElement('p');

    brand.className =
      'product-card-brand';

    brand.textContent =
      product.brand;

    content.append(brand);
  }

  if (product.title) {
    const title =
      document.createElement('h3');

    title.className =
      'product-card-title';

    title.textContent =
      product.title;

    content.append(title);
  }

  if (product.subtitle) {
    const subtitle =
      document.createElement('p');

    subtitle.className =
      'product-card-subtitle';

    subtitle.textContent =
      product.subtitle;

    content.append(subtitle);
  }

  const pricing =
    createPricing(product);

  if (pricing) {
    content.append(pricing);
  }

  if (
    product['in-stock'] === 'false'
  ) {
    const stock =
      document.createElement('p');

    stock.className =
      'product-card-stock';

    stock.textContent =
      'Out of stock';

    content.append(stock);
  }

  /*
   * Image + content are both
   * inside the navigation link.
   */
  cardLink.append(
    media,
    content,
  );

  article.append(cardLink);

  /*
   * Wishlist MUST stay outside
   * the product link.
   */
  const wishlist =
    createWishlistButton(product);

  if (wishlist) {
    article.append(wishlist);
  }

  item.append(article);

  return item;
}

/**
 * Sorts products.
 *
 * @param {Object[]} products Products
 * @param {string} option Option
 * @returns {Object[]}
 */
function sortProducts(
  products,
  option,
) {
  const items =
    [...products];

  switch (option) {
    case 'price-low-high':
      return items.sort(
        (a, b) => (
          toNumber(a.price)
          - toNumber(b.price)
        ),
      );

    case 'price-high-low':
      return items.sort(
        (a, b) => (
          toNumber(b.price)
          - toNumber(a.price)
        ),
      );

    case 'rating':
      return items.sort(
        (a, b) => (
          toNumber(b.rating)
          - toNumber(a.rating)
        ),
      );

    case 'discount':
      return items.sort(
        (a, b) => (
          toNumber(b.discount)
          - toNumber(a.discount)
        ),
      );

    default:
      return items.sort(
        (a, b) => (
          toNumber(a['sort-order'])
          - toNumber(b['sort-order'])
        ),
      );
  }
}

/**
 * Creates empty result.
 *
 * @returns {HTMLElement}
 */
function createEmptyResult(onClear) {
  const wrapper =
    document.createElement('div');

  wrapper.className =
    'product-empty';

  const icon =
    document.createElement('span');

  icon.className = 'product-empty-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.style.setProperty(
    '--product-empty-icon',
    `url("${EMPTY_ICON}")`,
  );

  const heading =
    document.createElement('h4');
  heading.className = "empty-title"
  heading.textContent =
    'No products found';

  const message =
    document.createElement('p');

  message.textContent =
    'Try clearing or changing the selected filters.';

  message.className = 'empty-description'
  wrapper.append(
    icon,
    heading,
    message,
  );

  if (onClear) {
    const {
      wrapper: clearWrapper,
      button: clear,
    } = createButton({
      href: '#',
      title: 'Clear all filters',
      label: 'Clear all filters',
      color: 'accent',
      size: 'sm',
      variant: 'outlined',
    });

    clear.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        onClear();
      },
    );

    wrapper.append(clearWrapper);
  }

  return wrapper;
}

/**
 * Renders product collection.
 *
 * @param {HTMLElement} list List
 * @param {Object[]} products Products
 * @param {Function} onClear Clears filters
 */
function renderProducts(list, products, onClear) {
  list.replaceChildren();

  if (!products.length) {
    const item =
      document.createElement('li');

    item.className = 'product-empty-item';

    item.append(
      createEmptyResult(onClear),
    );

    list.append(item);

    return;
  }

  const fragment =
    document.createDocumentFragment();

  products.forEach((product) => {
    fragment.append(
      createProductCard(product),
    );
  });

  list.append(fragment);
}

/**
 * Creates active filter chips.
 *
 * @param {HTMLElement} filters Filters
 * @param {Function} update Update callback
 * @returns {HTMLElement}
 */
function createFilterChips(
  filters,
  update,
) {
  const container =
    document.createElement('div');

  container.className =
    'product-filter-chips';

  container.setAttribute(
    'aria-label',
    'Applied filters',
  );

  function render() {
    container.replaceChildren();

    const checked = [
      ...filters.querySelectorAll(
        'input:checked',
      ),
    ];

    container.hidden =
      checked.length === 0;

    checked.forEach((input) => {
      const button =
        document.createElement('button');

      button.type = 'button';
      button.className =
        'product-filter-chip';

      const label =
        input
          .closest('label')
          ?.querySelector('span')
          ?.textContent
        || input.value;

      button.textContent =
        `${label}`;

      button.setAttribute(
        'aria-label',
        `Remove ${label} filter`,
      );

      button.addEventListener(
        'click',
        () => {
          input.checked = false;
          update();
        },
      );

      container.append(button);
    });
  }

  return {
    container,
    render,
  };
}

/**
 * Creates mobile action controls.
 *
 * @returns {{
 *   wrapper: HTMLElement,
 *   filterButton: HTMLButtonElement,
 *   sortSelect: HTMLSelectElement
 * }}
 */
function createMobileActions() {
  const wrapper =
    document.createElement('div');

  wrapper.className =
    'product-mobile-actions';

  const {
    wrapper: filterButtonWrapper,
    button: filterButton,
  } = createButton({
    href: '#',
    title: 'Filter products',
    label: 'Filter',
    iconSrc: FILTER_ICON,
    color: 'accent',
    variant: 'outlined',
    fullWidth: true,
  });

  filterButton.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
    },
  );

  const {
    wrapper: sortWrapper,
    select: sortSelect,
  } = createSelect({
    ariaLabel: 'Sort by',
    options: SORT_OPTIONS,
    fullWidth: true,
  });

  wrapper.append(
    filterButtonWrapper,
    sortWrapper,
  );

  return {
    wrapper,
    filterButton,
    sortSelect,
  };
}

/**
 * Updates the page query parameter.
 *
 * @param {string} name Name
 * @param {string} value Value
 */
function updateQueryParameter(
  name,
  value,
) {
  const url =
    new URL(window.location.href);

  if (value) {
    url.searchParams.set(
      name,
      value,
    );
  } else {
    url.searchParams.delete(name);
  }

  window.history.replaceState(
    {},
    '',
    url,
  );
}

/**
 * Renders block-level error.
 *
 * @param {HTMLElement} block Block
 * @param {string} message Message
 */
function renderBlockError(
  block,
  message,
) {
  const empty =
    document.createElement('div');

  empty.className =
    'product-empty';

  const heading =
    document.createElement('h4');

  heading.textContent =
    'Products unavailable';

  const description =
    document.createElement('p');

  description.textContent =
    message;

  empty.append(
    heading,
    description,
  );

  block.replaceChildren(empty);
}

/**
 * Product List block.
 *
 * Supports:
 *
 * /products
 * /products?category=mobiles
 * /products?category=laptops
 * /products?category=small-appliances
 *
 * @param {HTMLElement} block Product List block
 */
export default async function decorate(block) {
  const {
    jsonUrl,
    category,
  } = getBlockConfig(block);

  if (!jsonUrl) {
    renderBlockError(
      block,
      'Product data URL is missing.',
    );

    return;
  }

  const allProducts =
    await fetchProducts(jsonUrl);

  console.log("allProducts: ", allProducts);
  if (!allProducts.length) {
    renderBlockError(
      block,
      'No product data is available.',
    );

    return;
  }

  const products =
    allProducts.filter((product) => (
      !category
      || normalizeValue(
        product.category,
      ) === category
    ));

  if (!products.length) {
    renderBlockError(
      block,
      category
        ? `No products are available for ${formatLabel(category)}.`
        : 'No products are available.',
    );

    return;
  }

  const wrapper =
    document.createElement('div');

  wrapper.className =
    'product-list-wrapper';

  /*
   * Left filters.
   */
  const left =
    document.createElement('aside');

  left.className =
    'product-left';

  left.setAttribute(
    'aria-label',
    'Product filters',
  );

  const {
    filters,
    clearButton,
    closeButton,
  } = createFilters(products);

  const {
    wrapper: applyButtonWrapper,
    button: applyButton,
  } = createButton({
    href: '#',
    title: 'Show results',
    label: 'Show products',
    color: 'primary',
    fullWidth: true,
  });

  const applyLabel =
    applyButton.querySelector(
      '.button-label',
    );

  const filterFooter =
    document.createElement('div');

  filterFooter.className =
    'product-filter-footer';

  filterFooter.append(applyButtonWrapper);

  left.append(
    filters,
    filterFooter,
  );

  /*
   * Right content.
   */
  const right =
    document.createElement('div');

  right.className =
    'product-right';

  const header =
    document.createElement('header');

  header.className =
    'product-header';

  const headingWrapper =
    document.createElement('div');

  headingWrapper.className =
    'product-header-content';

  const heading =
    document.createElement('h1');

  heading.id =
    `product-list-title-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

  heading.textContent =
    products[0]?.['category-title']
    || formatLabel(category)
    || 'Products';

  block.setAttribute(
    'aria-labelledby',
    heading.id,
  );

  const count =
    document.createElement('p');

  count.setAttribute(
    'aria-live',
    'polite',
  );

  const {
    wrapper: sortWrapper,
    select: sortSelect,
  } = createSort();

  headingWrapper.append(
    heading,
    count,
  );

  header.append(
    headingWrapper,
    sortWrapper,
  );

  const {
    wrapper: mobileActions,
    filterButton,
    sortSelect: mobileSortSelect,
  } = createMobileActions();

  const filterLabel =
    filterButton.querySelector(
      '.button-label',
    );

  const productList =
    document.createElement('div');

  productList.className =
    'product-list-content';

  const productItems =
    document.createElement('ul');

  productItems.className =
    'product-items';

  loadCSS(
    `${window.hlx?.codeBasePath || ''}/blocks/product-list/pagination.css`,
  );

  const pagination = createPagination({
    pageSize: 5,
    onChange: () => {
      update({ keepPage: true });
      productList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });

  productList.append(productItems, pagination.element);

  right.append(
    header,
    mobileActions,
  );

  wrapper.append(
    left,
    right,
  );

  block.replaceChildren(wrapper);

  let filterChips;

  function update(options) {
    if (options?.keepPage !== true) {
      pagination.setPage(1);
    }

    mobileSortSelect.value =
      sortSelect.value;
    let result =
      filterProducts(
        products,
        filters,
      );

    result =
      sortProducts(
        result,
        sortSelect.value,
      );

    count.textContent =
      `${result.length} ${result.length === 1
        ? 'product'
        : 'products'
      }`;

    applyLabel.textContent =
      result.length
        ? `Show ${result.length} ${result.length === 1
          ? 'product'
          : 'products'
        }`
        : 'No products found';

    applyButton.setAttribute(
      'aria-disabled',
      String(!result.length),
    );

    const activeCount =
      filters.querySelectorAll(
        'input:checked',
      ).length;

    filterLabel.textContent =
      activeCount
        ? `Filter (${activeCount})`
        : 'Filter';

    pagination.update(result.length);

    renderProducts(
      productItems,
      pagination.slice(result),
      () => clearButton.click(),
    );

    filterChips?.render();

    updateQueryParameter(
      'page',
      pagination.getPage() > 1
        ? String(pagination.getPage())
        : '',
    );

    updateQueryParameter(
      'sort',
      sortSelect.value === 'featured'
        ? ''
        : sortSelect.value,
    );
  }

  filterChips =
    createFilterChips(
      filters,
      update,
    );

  right.append(
    filterChips.container,
    productList,
  );

  /*
   * Restore sort from URL.
   */
  const searchParams =
    new URLSearchParams(
      window.location.search,
    );

  const querySort =
    searchParams.get('sort');

  if (
    SORT_OPTIONS.some(
      (option) => (
        option.value === querySort
      ),
    )
  ) {
    sortSelect.value =
      querySort;
  }

  filters.addEventListener(
    'change',
    update,
  );

  sortSelect.addEventListener(
    'change',
    update,
  );

  clearButton.addEventListener(
    'click',
    () => {
      filters
        .querySelectorAll('input')
        .forEach((input) => {
          input.checked = false;
        });

      sortSelect.value =
        'featured';

      update();
    },
  );

  /*
   * Mobile filter access.
   *
   * This temporarily exposes the left
   * filter area as an overlay controlled
   * with a class on the block.
   */
  filterButton.setAttribute(
    'aria-expanded',
    'false',
  );

  function setFiltersOpen(open) {
    block.classList.toggle(
      'filters-open',
      open,
    );

    document.body.style.overflow =
      open ? 'hidden' : '';

    filterButton.setAttribute(
      'aria-expanded',
      String(open),
    );

    if (open) {
      closeButton.focus();
    } else {
      filterButton.focus();
    }
  }

  filterButton.addEventListener(
    'click',
    () => {
      setFiltersOpen(
        !block.classList.contains(
          'filters-open',
        ),
      );
    },
  );

  closeButton.addEventListener(
    'click',
    () => setFiltersOpen(false),
  );

  applyButton.addEventListener(
    'click',
    (event) => {
      event.preventDefault();

      if (
        applyButton.getAttribute(
          'aria-disabled',
        ) !== 'true'
      ) {
        setFiltersOpen(false);
      }
    },
  );

  // The backdrop is the block's ::before, so clicks land on the block.
  block.addEventListener(
    'click',
    (event) => {
      if (
        event.target === block
        && block.classList.contains(
          'filters-open',
        )
      ) {
        setFiltersOpen(false);
      }
    },
  );

  // Mobile and desktop selects share state through update().
  mobileSortSelect.addEventListener(
    'change',
    () => {
      sortSelect.value =
        mobileSortSelect.value;

      update();
    },
  );

  /*
   * Close mobile filters with Escape.
   */
  block.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape'
        && block.classList.contains(
          'filters-open',
        )
      ) {
        setFiltersOpen(false);
      }
    },
  );

  const queryPage = Number(searchParams.get('page'));

  if (queryPage > 1) {
    pagination.setPage(queryPage);
  }

  update({ keepPage: true });
}


