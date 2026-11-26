import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Creates wishlist button.
 *
 * @param {string} productName Product name
 * @returns {HTMLButtonElement}
 */
function createWishlistButton(productName) {
  const button = document.createElement('button');

  button.type = 'button';
  button.className = 'cards-wishlist-button';
  button.setAttribute('aria-pressed', 'false');

  button.setAttribute(
    'aria-label',
    productName
      ? `Add ${productName} to wishlist`
      : 'Add to wishlist',
  );

  button.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67
        l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78
        L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
      />
    </svg>
  `;

  button.addEventListener('click', () => {
    const isActive = button.classList.toggle('is-active');

    button.setAttribute(
      'aria-pressed',
      String(isActive),
    );

    button.setAttribute(
      'aria-label',
      productName
        ? (
          isActive
            ? `Remove ${productName} from wishlist`
            : `Add ${productName} to wishlist`
        )
        : (
          isActive
            ? 'Remove from wishlist'
            : 'Add to wishlist'
        ),
    );
  });

  return button;
}

/**
 * Optimizes product image using AEM helper.
 *
 * @param {HTMLElement} container Image container
 */
function optimizeImage(container) {
  const image = container.querySelector('picture > img');

  if (!image) {
    return;
  }

  const picture = image.closest('picture');

  if (!picture) {
    return;
  }

  const optimizedPicture = createOptimizedPicture(
    image.src,
    image.alt || '',
    false,
    [
      {
        media: '(min-width: 900px)',
        width: '500',
      },
      {
        media: '(min-width: 600px)',
        width: '400',
      },
      {
        width: '300',
      },
    ],
  );

  picture.replaceWith(optimizedPicture);
}

/**
 * Creates product pricing.
 *
 * Only creates the wrapper when at least
 * one pricing value exists.
 *
 * @param {string} price Current price
 * @param {string} originalPrice Original price
 * @param {string} discount Discount
 * @returns {HTMLElement|null}
 */
function createPricing(
  price,
  originalPrice,
  discount,
) {
  if (!price && !originalPrice && !discount) {
    return null;
  }

  const pricing = document.createElement('div');

  pricing.className = 'cards-card-pricing';

  if (price) {
    const currentPrice = document.createElement('span');

    currentPrice.className = 'cards-card-price';
    currentPrice.textContent = price;

    pricing.append(currentPrice);
  }

  if (originalPrice) {
    const oldPrice = document.createElement('del');

    oldPrice.className = 'cards-card-original-price';
    oldPrice.textContent = originalPrice;

    pricing.append(oldPrice);
  }

  if (discount) {
    const discountText = document.createElement('span');

    discountText.className = 'cards-card-discount';
    discountText.textContent = discount;

    pricing.append(discountText);
  }

  return pricing;
}

/**
 * Creates product rating.
 *
 * Only creates rating-related HTML when
 * rating or review content exists.
 *
 * @param {string} rating Product rating
 * @param {string} reviews Review count
 * @returns {HTMLElement|null}
 */
function createRating(rating, reviews) {
  if (!rating && !reviews) {
    return null;
  }

  const ratingWrapper = document.createElement('div');

  ratingWrapper.className = 'cards-card-rating';

  if (rating) {
    const star = document.createElement('span');

    star.className = 'cards-card-rating-star';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '★';

    const ratingText = document.createElement('span');

    ratingText.className = 'cards-card-rating-value';
    ratingText.textContent = rating;

    ratingWrapper.append(
      star,
      ratingText,
    );
  }

  if (reviews) {
    const reviewText = document.createElement('span');

    reviewText.className = 'cards-card-reviews';
    reviewText.textContent = reviews;

    ratingWrapper.append(reviewText);
  }

  if (rating) {
    const accessibleLabel = reviews
      ? `${rating} out of 5 stars, ${reviews} reviews`
      : `${rating} out of 5 stars`;

    ratingWrapper.setAttribute(
      'aria-label',
      accessibleLabel,
    );
  }

  return ratingWrapper;
}

/**
 * Creates product body.
 *
 * No body wrapper is returned when all
 * product information is empty.
 *
 * @param {HTMLElement[]} columns Card columns
 * @returns {{ body: HTMLElement|null, productName: string }}
 */
function createProductDetails(columns) {
  const productName =
    columns[1]?.textContent.trim() || '';

  const price =
    columns[2]?.textContent.trim() || '';

  const originalPrice =
    columns[3]?.textContent.trim() || '';

  const discount =
    columns[4]?.textContent.trim() || '';

  const rating =
    columns[5]?.textContent.trim() || '';

  const reviews =
    columns[6]?.textContent.trim() || '';

  const body = document.createElement('div');

  body.className = 'cards-card-body';

  /*
   * Product title
   */
  if (productName) {
    const title = document.createElement('h3');

    title.className = 'cards-card-title';
    title.textContent = productName;

    body.append(title);
  }

  /*
   * Product pricing
   */
  const pricing = createPricing(
    price,
    originalPrice,
    discount,
  );

  if (pricing) {
    body.append(pricing);
  }

  /*
   * Product rating
   */
  const ratingElement = createRating(
    rating,
    reviews,
  );

  if (ratingElement) {
    body.append(ratingElement);
  }

  /*
   * Don't render empty body wrapper.
   */
  if (!body.children.length) {
    return {
      body: null,
      productName,
    };
  }

  return {
    body,
    productName,
  };
}

/**
 * Creates image section.
 *
 * @param {HTMLElement|null} imageColumn Image column
 * @param {string} productName Product name
 * @returns {HTMLElement|null}
 */
function createImageSection(
  imageColumn,
  productName,
) {
  const picture =
    imageColumn?.querySelector('picture');

  if (!picture) {
    return null;
  }

  const imageWrapper =
    document.createElement('div');

  imageWrapper.className =
    'cards-card-image';

  imageWrapper.append(picture);

  optimizeImage(imageWrapper);

  const wishlistButton =
    createWishlistButton(productName);

  imageWrapper.append(wishlistButton);

  return imageWrapper;
}

/**
 * Decorates Cards block.
 *
 * Expected columns:
 *
 * 0 - Image
 * 1 - Product name
 * 2 - Current price
 * 3 - Original price
 * 4 - Discount
 * 5 - Rating
 * 6 - Reviews
 *
 * @param {HTMLElement} block Cards block
 */
export default function decorate(block) {
  console.log("block: Cards ----->>>>> ", block);
  const list = document.createElement('ul');

  [...block.children].forEach((row) => {
    const columns = [...row.children];

    if (!columns.length) {
      return;
    }

    const imageColumn = columns[0];

    const {
      body,
      productName,
    } = createProductDetails(columns);

    const imageSection = createImageSection(
      imageColumn,
      productName,
    );

    /*
     * Don't generate an empty card.
     */
    if (!imageSection && !body) {
      return;
    }

    const item = document.createElement('li');

    item.className = 'cards-card';

    /*
     * Image exists:
     * render image section.
     */
    if (imageSection) {
      item.append(imageSection);
    }

    /*
     * Body content exists:
     * render body section.
     */
    if (body) {
      item.append(body);
    }

    list.append(item);
  });

  /*
   * Don't leave an empty list.
   */
  if (!list.children.length) {
    block.replaceChildren();
    return;
  }

  block.replaceChildren(list);
}