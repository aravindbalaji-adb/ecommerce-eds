import { createButton } from '../button/button.js';

const PRODUCT_TYPE = 'product';

const SORT_OPTIONS = [
  {
    value: 'featured',
    label: 'Featured',
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
 * Converts value to number safely.
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
 * Formats INR currency.
 *
 * @param {*} value Price value
 * @returns {string}
 */
function formatPrice(value) {
  const price = toNumber(value);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Returns unique non-empty values.
 *
 * @param {Object[]} products Products
 * @param {string} property Property
 * @returns {string[]}
 */
function getUniqueValues(products, property) {
  return [
    ...new Set(
      products
        .map((product) => product[property])
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

/**
 * Fetches product JSON.
 *
 * @param {string} url JSON URL
 * @returns {Promise<Object[]>}
 */
async function fetchProducts(url) {
  if (!url) {
    return [];
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Product request failed: ${response.status}`,
      );
    }

    const json = await response.json();

    if (!Array.isArray(json.data)) {
      return [];
    }

    return json.data.filter((item) => (
      item.type === PRODUCT_TYPE
      && item.enabled !== 'false'
    ));
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
 * Reads Product Listing block configuration.
 *
 * Expected:
 *
 * Product List
 * /products.json
 * mobiles
 *
 * @param {HTMLElement} block Product List block
 * @returns {{ jsonUrl: string, category: string }}
 */
function getBlockConfig(block) {
  const rows = [...block.children];

  const jsonUrl =
    rows[0]?.querySelector('a[href]')?.href
    || rows[0]?.textContent.trim()
    || '';

  const category =
    rows[1]?.textContent.trim().toLowerCase()
    || '';

  return {
    jsonUrl,
    category,
  };
}

/**
 * Creates checkbox/radio input.
 *
 * @param {Object} config Input configuration
 * @returns {HTMLLabelElement}
 */
function createFilterOption({
  type = 'checkbox',
  name,
  value,
  label,
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

  return wrapper;
}

/**
 * Creates filter fieldset.
 *
 * @param {string} title Filter title
 * @returns {HTMLFieldSetElement}
 */
function createFilterGroup(title) {
  const fieldset =
    document.createElement('fieldset');

  fieldset.className =
    'product-filter';

  const legend =
    document.createElement('legend');

  legend.textContent = title;

  fieldset.append(legend);

  return fieldset;
}

/**
 * Creates Brand filters.
 *
 * @param {Object[]} products Products
 * @returns {HTMLFieldSetElement|null}
 */
function createBrandFilter(products) {
  const brands =
    getUniqueValues(products, 'brand');

  if (!brands.length) {
    return null;
  }

  const fieldset =
    createFilterGroup('Brand');

  brands.forEach((brand) => {
    fieldset.append(
      createFilterOption({
        name: 'brand',
        value: brand,
        label: brand,
      }),
    );
  });

  return fieldset;
}

/**
 * Creates Storage filters.
 *
 * Only rendered when products contain storage.
 *
 * @param {Object[]} products Products
 * @returns {HTMLFieldSetElement|null}
 */
function createStorageFilter(products) {
  const storage =
    getUniqueValues(products, 'storage');

  if (!storage.length) {
    return null;
  }

  const fieldset =
    createFilterGroup('Storage');

  storage.forEach((value) => {
    fieldset.append(
      createFilterOption({
        name: 'storage',
        value,
        label: value,
      }),
    );
  });

  return fieldset;
}

/**
 * Creates RAM filters.
 *
 * @param {Object[]} products Products
 * @returns {HTMLFieldSetElement|null}
 */
function createRamFilter(products) {
  const values =
    getUniqueValues(products, 'ram');

  if (!values.length) {
    return null;
  }

  const fieldset =
    createFilterGroup('RAM');

  values.forEach((value) => {
    fieldset.append(
      createFilterOption({
        name: 'ram',
        value,
        label: value,
      }),
    );
  });

  return fieldset;
}

/**
 * Creates Color filters.
 *
 * @param {Object[]} products Products
 * @returns {HTMLFieldSetElement|null}
 */
function createColorFilter(products) {
  const colors =
    getUniqueValues(products, 'color');

  if (!colors.length) {
    return null;
  }

  const fieldset =
    createFilterGroup('Color');

  colors.forEach((color) => {
    fieldset.append(
      createFilterOption({
        name: 'color',
        value: color,
        label: color,
      }),
    );
  });

  return fieldset;
}

/**
 * Creates Network filters.
 *
 * @param {Object[]} products Products
 * @returns {HTMLFieldSetElement|null}
 */
function createNetworkFilter(products) {
  const values =
    getUniqueValues(products, 'network');

  if (!values.length) {
    return null;
  }

  const fieldset =
    createFilterGroup('Network');

  values.forEach((value) => {
    fieldset.append(
      createFilterOption({
        name: 'network',
        value,
        label: value,
      }),
    );
  });

  return fieldset;
}

/**
 * Creates Price filter.
 *
 * @returns {HTMLFieldSetElement}
 */
function createPriceFilter() {
  const fieldset =
    createFilterGroup('Price');

  const options = [
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

  options.forEach((option) => {
    fieldset.append(
      createFilterOption({
        type: 'radio',
        name: 'price',
        value: option.value,
        label: option.label,
      }),
    );
  });

  return fieldset;
}

/**
 * Creates filter sidebar.
 *
 * @param {Object[]} products Products
 * @returns {HTMLElement}
 */
function createFilters(products) {
  const filters =
    document.createElement('div');

  filters.className =
    'product-filters';

  const header =
    document.createElement('div');

  header.className =
    'product-filter-header';

  const title =
    document.createElement('h2');

  title.textContent = 'Filters';

  const clearButton =
    document.createElement('button');

  clearButton.type = 'button';
  clearButton.textContent = 'Clear all';

  header.append(
    title,
    clearButton,
  );

  filters.append(header);

  const groups = [
    createBrandFilter(products),
    createPriceFilter(),
    createStorageFilter(products),
    createRamFilter(products),
    createNetworkFilter(products),
    createColorFilter(products),
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
 * @returns {{ wrapper: HTMLLabelElement, select: HTMLSelectElement }}
 */
function createSort() {
  const wrapper =
    document.createElement('label');

  wrapper.className =
    'product-sort';

  const text =
    document.createElement('span');

  text.textContent = 'Sort by';

  const select =
    document.createElement('select');

  select.setAttribute(
    'aria-label',
    'Sort products',
  );

  SORT_OPTIONS.forEach((option) => {
    const element =
      document.createElement('option');

    element.value = option.value;
    element.textContent = option.label;

    select.append(element);
  });

  wrapper.append(
    text,
    select,
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
function createProductImage(product) {
  const imageUrl =
    product['image-url'];

  if (!imageUrl) {
    return null;
  }

  const image =
    document.createElement('img');

  image.src = imageUrl;

  image.alt =
    product.title || product.brand || '';

  image.loading = 'lazy';
  image.decoding = 'async';

  return image;
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

  const article =
    document.createElement('article');

  article.className =
    'product-card';

  /*
   * Image area.
   */
  const media =
    document.createElement('div');

  media.className =
    'product-card-media';

  const image =
    createProductImage(product);

  if (image) {
    const link =
      document.createElement('a');

    link.href =
      product['product-url'] || '#';

    link.append(image);

    media.append(link);
  }

  /*
   * Badge.
   */
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
   * Wishlist.
   */
  if (
    product['wishlist-enabled']
    === 'true'
  ) {
    const wishlist =
      document.createElement('button');

    wishlist.type = 'button';

    wishlist.className =
      'product-card-wishlist';

    wishlist.setAttribute(
      'aria-label',
      `Add ${product.title} to wishlist`,
    );

    wishlist.textContent = '♡';

    media.append(wishlist);
  }

  article.append(media);

  /*
   * Product content.
   */
  const content =
    document.createElement('div');

  content.className =
    'product-card-content';

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

    const link =
      document.createElement('a');

    title.className =
      'product-card-title';

    link.href =
      product['product-url'] || '#';

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

  /*
   * Price.
   */
  if (product.price) {
    const pricing =
      document.createElement('div');

    pricing.className =
      'product-card-pricing';

    const price =
      document.createElement('span');

    price.className =
      'product-card-price';

    price.textContent =
      formatPrice(product.price);

    pricing.append(price);

    if (product['original-price']) {
      const original =
        document.createElement('del');

      original.textContent =
        formatPrice(
          product['original-price'],
        );

      pricing.append(original);
    }

    if (product.discount) {
      const discount =
        document.createElement('span');

      discount.className =
        'product-card-discount';

      discount.textContent =
        `${product.discount}% off`;

      pricing.append(discount);
    }

    content.append(pricing);
  }

  /*
   * Rating.
   */
  if (product.rating) {
    const rating =
      document.createElement('p');

    rating.className =
      'product-card-rating';

    rating.setAttribute(
      'aria-label',
      `${product.rating} out of 5 stars${
        product.reviews
          ? `, ${product.reviews} reviews`
          : ''
      }`,
    );

    rating.textContent =
      `★ ${product.rating}`;

    if (product.reviews) {
      const reviews =
        document.createElement('span');

      reviews.textContent =
        ` (${product.reviews})`;

      rating.append(reviews);
    }

    content.append(rating);
  }

  article.append(content);

  item.append(article);

  return item;
}

/**
 * Applies active filters.
 *
 * @param {Object[]} products Original products
 * @param {HTMLElement} filters Filter container
 * @returns {Object[]}
 */
function filterProducts(products, filters) {
  const checked =
    [...filters.querySelectorAll(
      'input:checked',
    )];

  const selected = checked.reduce(
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

  return products.filter((product) => {
    if (
      selected.brand?.length
      && !selected.brand.includes(
        product.brand,
      )
    ) {
      return false;
    }

    if (
      selected.storage?.length
      && !selected.storage.includes(
        product.storage,
      )
    ) {
      return false;
    }

    if (
      selected.ram?.length
      && !selected.ram.includes(
        product.ram,
      )
    ) {
      return false;
    }

    if (
      selected.network?.length
      && !selected.network.includes(
        product.network,
      )
    ) {
      return false;
    }

    if (
      selected.color?.length
      && !selected.color.includes(
        product.color,
      )
    ) {
      return false;
    }

    const priceFilter =
      selected.price?.[0];

    if (priceFilter) {
      const price =
        toNumber(product.price);

      if (
        priceFilter === '0-15000'
        && price >= 15000
      ) {
        return false;
      }

      if (
        priceFilter === '15000-30000'
        && (
          price < 15000
          || price >= 30000
        )
      ) {
        return false;
      }

      if (
        priceFilter === '30000-50000'
        && (
          price < 30000
          || price >= 50000
        )
      ) {
        return false;
      }

      if (
        priceFilter === '50000+'
        && price < 50000
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sorts products.
 *
 * @param {Object[]} products Products
 * @param {string} option Sort option
 * @returns {Object[]}
 */
function sortProducts(products, option) {
  const items =
    [...products];

  switch (option) {
    case 'price-low-high':
      return items.sort(
        (a, b) =>
          toNumber(a.price)
          - toNumber(b.price),
      );

    case 'price-high-low':
      return items.sort(
        (a, b) =>
          toNumber(b.price)
          - toNumber(a.price),
      );

    case 'rating':
      return items.sort(
        (a, b) =>
          toNumber(b.rating)
          - toNumber(a.rating),
      );

    case 'discount':
      return items.sort(
        (a, b) =>
          toNumber(b.discount)
          - toNumber(a.discount),
      );

    default:
      return items.sort(
        (a, b) =>
          toNumber(a['sort-order'])
          - toNumber(b['sort-order']),
      );
  }
}

/**
 * Renders product collection.
 *
 * @param {HTMLElement} list List element
 * @param {Object[]} products Products
 */
function renderProducts(list, products) {
  list.replaceChildren();

  products.forEach((product) => {
    list.append(
      createProductCard(product),
    );
  });
}

/**
 * Product List block.
 *
 * @param {HTMLElement} block Product List block
 */
export default async function decorate(block) {
  const {
    jsonUrl,
    category,
  } = getBlockConfig(block);

  if (!jsonUrl) {
    return;
  }

  const allProducts =
    await fetchProducts(jsonUrl);

  const products =
    allProducts.filter((product) => (
      !category
      || product.category === category
    ));

  /*
   * Main wrapper.
   */
  const wrapper =
    document.createElement('div');

  wrapper.className =
    'product-list-wrapper';

  /*
   * LEFT
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
   * RIGHT
   */
  const right =
    document.createElement('div');

  right.className =
    'product-right';

  /*
   * Header
   */
  const header =
    document.createElement('div');

  header.className =
    'product-header';

  const headingWrapper =
    document.createElement('div');

  const heading =
    document.createElement('h1');

  heading.textContent =
    products[0]?.['category-title']
    || category
    || 'Products';

  const count =
    document.createElement('p');

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

  /*
   * Product list
   */
  const productList =
    document.createElement('div');

  productList.className =
    'product-list-content';

  const productItems =
    document.createElement('ul');

  productItems.className =
    'product-items';

  productList.append(
    productItems,
  );

  right.append(
    header,
    productList,
  );

  wrapper.append(
    left,
    right,
  );

  block.replaceChildren(wrapper);

  /*
   * Central render state.
   */
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
      `${result.length} ${
        result.length === 1
          ? 'product'
          : 'products'
      }`;

    renderProducts(
      productItems,
      result,
    );
  }

  /*
   * Filter changes.
   */
  filters.addEventListener(
    'change',
    update,
  );

  /*
   * Sort changes.
   */
  sortSelect.addEventListener(
    'change',
    update,
  );

  /*
   * Clear all.
   */
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
   * Initial render.
   */
  update();
}