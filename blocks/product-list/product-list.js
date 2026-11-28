import { createButton } from '../button/button.js';
import { createSelect } from '../form-control/form-control.js';
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

const PRICE_OPTIONS = [
  {
    value: '0-15000',
    label: 'Under ₹15,000',
  },
  {
    value: '15000-30000',
    label: '₹15,000 - ₹30,000',
  },
  {
    value: '30000-50000',
    label: '₹30,000 - ₹50,000',
  },
  {
    value: '50000+',
    label: 'Above ₹50,000',
  },
];

/**
 * Safely converts a value to a number.
 *
 * @param {*} value Value
 * @param {number} fallback Fallback value
 * @returns {number}
 */
function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

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
    return `₹${price.toLocaleString('en-IN')}`;
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
 * Gets unique non-empty product values.
 *
 * @param {Object[]} products Products
 * @param {string} property Property
 * @returns {string[]}
 */
function getUniqueValues(
  products,
  property,
) {
  return [
    ...new Set(
      products
        .map((product) => (
          String(
            product[property] || '',
          ).trim()
        ))
        .filter(Boolean),
    ),
  ].sort(
    (a, b) => (
      a.localeCompare(
        b,
        undefined,
        {
          numeric: true,
          sensitivity: 'base',
        },
      )
    ),
  );
}

/**
 * Counts products having a property value.
 *
 * @param {Object[]} products Products
 * @param {string} property Property
 * @param {string} value Value
 * @returns {number}
 */
function getValueCount(
  products,
  property,
  value,
) {
  return products.filter(
    (product) => (
      String(product[property] || '')
      === String(value)
    ),
  ).length;
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
 * Creates one filter option.
 *
 * @param {Object} config Configuration
 * @returns {HTMLLabelElement}
 */
function createFilterOption({
  type = 'checkbox',
  name,
  value,
  label,
  count,
}) {
  const wrapper =
    document.createElement('label');

  const input =
    document.createElement('input');

  const text =
    document.createElement('span');

  input.type = type;
  input.name = name;
  input.value = value;

  text.textContent = label;

  wrapper.append(
    input,
    text,
  );

  if (count) {
    const countElement =
      document.createElement('span');

    countElement.className =
      'product-filter-count';

    countElement.textContent =
      `(${count})`;

    wrapper.append(countElement);
  }

  return wrapper;
}

/**
 * Creates filter fieldset.
 *
 * @param {string} title Title
 * @param {string} name Filter name
 * @returns {HTMLFieldSetElement}
 */
function createFilterGroup(
  title,
  name,
) {
  const fieldset =
    document.createElement('fieldset');

  fieldset.className =
    'product-filter';

  fieldset.dataset.filterGroup =
    name;

  const legend =
    document.createElement('legend');

  legend.textContent = title;

  fieldset.append(legend);

  return fieldset;
}

/**
 * Creates a filter from a product property.
 *
 * @param {Object[]} products Products
 * @param {Object} config Configuration
 * @returns {HTMLFieldSetElement|null}
 */
function createPropertyFilter(
  products,
  {
    title,
    name,
    property = name,
    type = 'checkbox',
  },
) {
  const values =
    getUniqueValues(
      products,
      property,
    );

  if (!values.length) {
    return null;
  }

  const fieldset =
    createFilterGroup(
      title,
      name,
    );

  values.forEach((value) => {
    fieldset.append(
      createFilterOption({
        type,
        name,
        value,
        label: value,
        count: getValueCount(
          products,
          property,
          value,
        ),
      }),
    );
  });

  return fieldset;
}

/**
 * Creates price filter.
 *
 * @param {Object[]} products Products
 * @returns {HTMLFieldSetElement}
 */
function createPriceFilter(products) {
  const fieldset =
    createFilterGroup(
      'Price',
      'price',
    );

  PRICE_OPTIONS.forEach((option) => {
    const count =
      products.filter((product) => (
        matchesPrice(
          product,
          option.value,
        )
      )).length;

    fieldset.append(
      createFilterOption({
        type: 'radio',
        name: 'price',
        value: option.value,
        label: option.label,
        count,
      }),
    );
  });

  return fieldset;
}

/**
 * Checks whether a product matches a price range.
 *
 * @param {Object} product Product
 * @param {string} priceFilter Price filter
 * @returns {boolean}
 */
function matchesPrice(
  product,
  priceFilter,
) {
  if (!priceFilter) {
    return true;
  }

  const price =
    toNumber(product.price);

  switch (priceFilter) {
    case '0-15000':
      return price < 15000;

    case '15000-30000':
      return (
        price >= 15000
        && price < 30000
      );

    case '30000-50000':
      return (
        price >= 30000
        && price < 50000
      );

    case '50000+':
      return price >= 50000;

    default:
      return true;
  }
}

/**
 * Creates filters.
 *
 * @param {Object[]} products Products
 * @returns {{
 *   filters: HTMLFormElement,
 *   clearButton: HTMLButtonElement
 * }}
 */
function createFilters(products) {
  const filters = document.createElement('form');

  filters.className = 'product-filters';

  filters.setAttribute(
    'aria-label',
    'Product filters',
  );

  filters.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
    },
  );

  const header = document.createElement('div');

  header.className = 'product-filter-header';

  const title = document.createElement('h6');

  title.textContent = 'Filters';

  /*
   * Reuse existing shared Button component.
   */
  const {
    wrapper: clearButtonWrapper,
    button: clearButton,
  } = createButton({
    href: '#',
    title: 'Clear all filters',
    label: 'Clear all',
    color: 'secondary',
    variant: 'text',
    size: 'sm',
  });

  /*
   * This is an action, not real navigation.
   * Prevent href="#" behavior.
   */
  clearButton.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
    },
  );

  header.append(
    title,
    clearButtonWrapper,
  );

  filters.append(header);

  const groups = [
    createPropertyFilter(
      products,
      {
        title: 'Brand',
        name: 'brand',
      },
    ),

    createPriceFilter(products),

    createPropertyFilter(
      products,
      {
        title: 'Storage',
        name: 'storage',
      },
    ),

    createPropertyFilter(
      products,
      {
        title: 'RAM',
        name: 'ram',
      },
    ),

    createPropertyFilter(
      products,
      {
        title: 'Network',
        name: 'network',
      },
    ),

    createPropertyFilter(
      products,
      {
        title: 'Color',
        name: 'color',
      },
    ),
  ];

  groups
    .filter(Boolean)
    .forEach((group) => {
      filters.append(group);
    });

  return {
    filters,
    clearButton,
  };
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
const PRODUCT_FALLBACK_IMAGE =
  '/assets/product-fallback.webp';

function createProductImage(product) {
  const image =
    document.createElement('img');

  const imageUrl =
    String(
      product['image-url'] || '',
    ).trim();

  const useFallback = !imageUrl;

  image.src =
    imageUrl
    || PRODUCT_FALLBACK_IMAGE;

  image.alt =
    product['image-alt']
    || product.title
    || product.brand
    || 'Product image';

  image.loading = 'lazy';
  image.decoding = 'async';

  if (useFallback) {
    image.classList.add(
      'product-card-image-fallback',
    );
  }

  image.addEventListener(
    'error',
    () => {
      if (
        image.classList.contains(
          'product-card-image-fallback',
        )
      ) {
        return;
      }

      image.src =
        PRODUCT_FALLBACK_IMAGE;

      image.classList.add(
        'product-card-image-fallback',
      );
    },
  );

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

  link.href =
    product['product-url']
    || '#';

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

  star.textContent = '★';

  const value =
    document.createElement('span');

  value.textContent =
    String(product.rating);

  rating.append(
    star,
    value,
  );

  if (product.reviews) {
    const reviews =
      document.createElement('span');

    reviews.textContent =
      `(${product.reviews})`;

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
      '♡',
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
        nextState ? '♥' : '♡';
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
   * Media.
   */
  const media =
    document.createElement('div');

  media.className =
    'product-card-media';

  const image =
    createProductImage(product);

  if (image) {
    const link =
      createProductLink(product);

    link.setAttribute(
      'aria-label',
      `View ${product.title || 'product'}`,
    );

    link.append(image);
    media.append(link);
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

  const wishlist =
    createWishlistButton(product);

  if (wishlist) {
    media.append(wishlist);
  }

  article.append(media);

  /*
   * Content.
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

    const link =
      createProductLink(product);

    link.textContent =
      product.title;

    title.append(link);
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

  article.append(content);
  item.append(article);

  return item;
}

/**
 * Collects selected filter values.
 *
 * @param {HTMLElement} filters Filters
 * @returns {Object}
 */
function getSelectedFilters(filters) {
  return [
    ...filters.querySelectorAll(
      'input:checked',
    ),
  ].reduce(
    (state, input) => {
      if (!state[input.name]) {
        state[input.name] = [];
      }

      state[input.name].push(
        input.value,
      );

      return state;
    },
    {},
  );
}

/**
 * Applies selected filters.
 *
 * @param {Object[]} products Products
 * @param {HTMLElement} filters Filters
 * @returns {Object[]}
 */
function filterProducts(
  products,
  filters,
) {
  const selected =
    getSelectedFilters(filters);

  const properties = [
    'brand',
    'storage',
    'ram',
    'network',
    'color',
  ];

  return products.filter((product) => {
    const matchesProperties =
      properties.every((property) => {
        const values =
          selected[property];

        return (
          !values?.length
          || values.includes(
            String(
              product[property] || '',
            ),
          )
        );
      });

    if (!matchesProperties) {
      return false;
    }

    return matchesPrice(
      product,
      selected.price?.[0],
    );
  });
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
function createEmptyResult() {
  const wrapper =
    document.createElement('div');

  wrapper.className =
    'product-empty';

  const heading =
    document.createElement('h4');

  heading.textContent =
    'No products found';

  const message =
    document.createElement('p');

  message.textContent =
    'Try clearing or changing the selected filters.';

  wrapper.append(
    heading,
    message,
  );

  return wrapper;
}

/**
 * Renders product collection.
 *
 * @param {HTMLElement} list List
 * @param {Object[]} products Products
 */
function renderProducts(list, products) {
  list.replaceChildren();

  if (!products.length) {
    const item =
      document.createElement('li');

    item.append(
      createEmptyResult(),
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
        `${label} ×`;

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
 *   sortButton: HTMLButtonElement
 * }}
 */
function createMobileActions() {
  const wrapper =
    document.createElement('div');

  wrapper.className =
    'product-mobile-actions';

  const filterButton =
    document.createElement('button');

  filterButton.type = 'button';
  filterButton.className =
    'product-mobile-action';

  filterButton.textContent =
    'Filter';

  const sortButton =
    document.createElement('button');

  sortButton.type = 'button';
  sortButton.className =
    'product-mobile-action';

  sortButton.textContent =
    'Sort';

  wrapper.append(
    filterButton,
    sortButton,
  );

  return {
    wrapper,
    filterButton,
    sortButton,
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
  } = createFilters(products);

  left.append(filters);

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
    sortButton,
  } = createMobileActions();

  const productList =
    document.createElement('div');

  productList.className =
    'product-list-content';

  const productItems =
    document.createElement('ul');

  productItems.className =
    'product-items';

  productList.append(productItems);

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

  function update() {
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

    renderProducts(
      productItems,
      result,
    );

    filterChips?.render();

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

  filterButton.addEventListener(
    'click',
    () => {
      const open =
        block.classList.toggle(
          'filters-open',
        );

      filterButton.setAttribute(
        'aria-expanded',
        String(open),
      );

      if (open) {
        left
          .querySelector(
            'input, button',
          )
          ?.focus();
      }
    },
  );

  /*
   * Mobile sort cycles through options.
   * It avoids creating a second select
   * with duplicated state.
   */
  sortButton.addEventListener(
    'click',
    () => {
      const currentIndex =
        SORT_OPTIONS.findIndex(
          (option) => (
            option.value
            === sortSelect.value
          ),
        );

      const nextIndex =
        (
          currentIndex + 1
        ) % SORT_OPTIONS.length;

      sortSelect.value =
        SORT_OPTIONS[nextIndex].value;

      sortButton.textContent =
        `Sort: ${SORT_OPTIONS[nextIndex].label
        }`;

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
        block.classList.remove(
          'filters-open',
        );

        filterButton.setAttribute(
          'aria-expanded',
          'false',
        );

        filterButton.focus();
      }
    },
  );

  update();
}