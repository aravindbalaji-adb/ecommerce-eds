import { createButton } from '../button/button.js';
import { CLOSE_ICON } from '../../scripts/svg.js';
import toNumber from './product-utils.js';


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
 * Creates filters.
 *
 * @param {Object[]} products Products
 * @returns {{
 *   filters: HTMLFormElement,
 *   clearButton: HTMLButtonElement,
 *   closeButton: HTMLButtonElement
 * }}
 */
export function createFilters(products) {
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
    label: 'CLEAR ALL',
    color: 'secondary',
    variant: 'text',
    size: 'sm',
  });

  clearButton.addEventListener(
    'click',
    (event) => {
      event.preventDefault();

      filters
        .querySelectorAll('input:checked')
        .forEach((input) => {
          input.checked = false;
        });

      clearButtonWrapper.hidden = true;
    },
  );

  clearButtonWrapper.hidden = true;

  filters.addEventListener(
    'change',
    () => {
      clearButtonWrapper.hidden =
        !filters.querySelector('input:checked');
    },
  );

  const {
    wrapper: closeButtonWrapper,
    button: closeButton,
  } = createButton({
    href: '#',
    title: 'Close filters',
    iconSrc: CLOSE_ICON,
    iconName: 'close',
    iconOnly: true,
    color: 'secondary',
    variant: 'text',
    size: 'sm',
  });

  closeButtonWrapper.classList.add(
    'product-filter-close',
  );

  closeButton.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
    },
  );

  header.append(
    title,
    clearButtonWrapper,
    closeButtonWrapper,
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
    closeButton,
  };
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
export function filterProducts(
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
