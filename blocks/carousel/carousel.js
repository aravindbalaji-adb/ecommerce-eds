let carouselId = 0;

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
].join(',');

/**
 * Carousel accessibility labels.
 * Kept in this file so no placeholders.js dependency is required.
 */
async function fetchPlaceholders() {
  return {
    carousel: 'Carousel',
    carouselLabel: 'Featured promotions',
    carouselSlideControls: 'Carousel slide controls',
    slide: 'Slide',
    previousSlide: 'Previous slide',
    nextSlide: 'Next slide',
    showSlide: 'Show slide',
    of: 'of',
  };
}

/**
 * Returns true when the user prefers reduced animation.
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Updates keyboard accessibility for elements inside a slide.
 */
function updateFocusableElements(slide, isActive) {
  slide.querySelectorAll(FOCUSABLE_ELEMENTS).forEach((element) => {
    if (!isActive) {
      if (
        element.hasAttribute('tabindex')
        && element.getAttribute('tabindex') !== '-1'
      ) {
        element.dataset.originalTabindex = element.getAttribute('tabindex');
      }

      element.setAttribute('tabindex', '-1');
    } else if (element.dataset.originalTabindex !== undefined) {
      element.setAttribute(
        'tabindex',
        element.dataset.originalTabindex,
      );

      delete element.dataset.originalTabindex;
    } else {
      element.removeAttribute('tabindex');
    }
  });
}

/**
 * Updates active slide accessibility state.
 */
function updateActiveSlide(slide, announce = true) {
  const block = slide.closest('.carousel');

  if (!block) return;

  const slideIndex = Number.parseInt(
    slide.dataset.slideIndex,
    10,
  );

  const slides = [
    ...block.querySelectorAll('.carousel-slide'),
  ];

  const indicators = [
    ...block.querySelectorAll('.carousel-slide-indicator'),
  ];

  if (Number.isNaN(slideIndex)) return;

  block.dataset.activeSlide = String(slideIndex);

  slides.forEach((currentSlide, index) => {
    const isActive = index === slideIndex;

    currentSlide.setAttribute(
      'aria-hidden',
      String(!isActive),
    );

    currentSlide.toggleAttribute(
      'inert',
      !isActive,
    );

    updateFocusableElements(
      currentSlide,
      isActive,
    );
  });

  indicators.forEach((indicator, index) => {
    const button = indicator.querySelector('button');

    if (!button) return;

    const isActive = index === slideIndex;

    if (isActive) {
      button.setAttribute(
        'aria-current',
        'true',
      );
    } else {
      button.removeAttribute(
        'aria-current',
      );
    }

    button.classList.toggle(
      'is-active',
      isActive,
    );
  });

  if (announce) {
    const status = block.querySelector(
      '.carousel-status',
    );

    if (status) {
      status.textContent = `Slide ${slideIndex + 1} of ${slides.length}`;
    }
  }
}

/**
 * Shows requested carousel slide.
 */
function showSlide(
  block,
  requestedIndex = 0,
  options = {},
) {
  const {
    announce = true,
    focusIndicator = false,
  } = options;

  const slides = [
    ...block.querySelectorAll('.carousel-slide'),
  ];

  if (!slides.length) return;

  let slideIndex = requestedIndex;

  if (slideIndex < 0) {
    slideIndex = slides.length - 1;
  }

  if (slideIndex >= slides.length) {
    slideIndex = 0;
  }

  const activeSlide = slides[slideIndex];

  const slidesWrapper = block.querySelector(
    '.carousel-slides',
  );

  if (!activeSlide || !slidesWrapper) return;

  updateActiveSlide(
    activeSlide,
    announce,
  );

  slidesWrapper.scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: prefersReducedMotion()
      ? 'auto'
      : 'smooth',
  });

  if (focusIndicator) {
    const indicatorButton = block.querySelector(
      `.carousel-slide-indicator[data-target-slide="${slideIndex}"] button`,
    );

    indicatorButton?.focus();
  }
}

/**
 * Keyboard navigation for carousel indicators.
 */
function handleIndicatorKeydown(event, block) {
  const supportedKeys = [
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ];

  if (!supportedKeys.includes(event.key)) return;

  const indicatorButtons = [
    ...block.querySelectorAll(
      '.carousel-slide-indicator button',
    ),
  ];

  const currentIndex = indicatorButtons.indexOf(
    event.currentTarget,
  );

  if (currentIndex < 0) return;

  event.preventDefault();

  let targetIndex = currentIndex;

  switch (event.key) {
    case 'ArrowLeft':
      targetIndex = (
        currentIndex
        - 1
        + indicatorButtons.length
      ) % indicatorButtons.length;
      break;

    case 'ArrowRight':
      targetIndex = (
        currentIndex + 1
      ) % indicatorButtons.length;
      break;

    case 'Home':
      targetIndex = 0;
      break;

    case 'End':
      targetIndex = indicatorButtons.length - 1;
      break;

    default:
      return;
  }

  showSlide(
    block,
    targetIndex,
    {
      announce: true,
      focusIndicator: true,
    },
  );
}

/**
 * Binds carousel interactions.
 */
function bindEvents(block) {
  const slideIndicators = block.querySelector(
    '.carousel-slide-indicators',
  );

  if (!slideIndicators) return;

  slideIndicators
    .querySelectorAll('button')
    .forEach((button) => {
      button.addEventListener(
        'click',
        (event) => {
          const indicator = event.currentTarget.closest(
            '.carousel-slide-indicator',
          );

          if (!indicator) return;

          const targetSlide = Number.parseInt(
            indicator.dataset.targetSlide,
            10,
          );

          showSlide(
            block,
            targetSlide,
          );
        },
      );

      button.addEventListener(
        'keydown',
        (event) => {
          handleIndicatorKeydown(
            event,
            block,
          );
        },
      );
    });

  const previousButton = block.querySelector(
    '.slide-prev',
  );

  const nextButton = block.querySelector(
    '.slide-next',
  );

  previousButton?.addEventListener(
    'click',
    () => {
      const activeSlide = Number.parseInt(
        block.dataset.activeSlide || '0',
        10,
      );

      showSlide(
        block,
        activeSlide - 1,
      );
    },
  );

  nextButton?.addEventListener(
    'click',
    () => {
      const activeSlide = Number.parseInt(
        block.dataset.activeSlide || '0',
        10,
      );

      showSlide(
        block,
        activeSlide + 1,
      );
    },
  );

  /**
   * Keeps active slide synchronized when
   * users manually swipe or scroll.
   */
  const slidesWrapper = block.querySelector(
    '.carousel-slides',
  );

  const slideObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (firstEntry, secondEntry) => (
            secondEntry.intersectionRatio
            - firstEntry.intersectionRatio
          ),
        )[0];

      if (visibleEntry) {
        updateActiveSlide(
          visibleEntry.target,
          false,
        );
      }
    },
    {
      root: slidesWrapper,
      threshold: 0.6,
    },
  );

  block
    .querySelectorAll('.carousel-slide')
    .forEach((slide) => {
      slideObserver.observe(slide);
    });
}

/**
 * Creates one accessible carousel slide.
 */
function createSlide(
  row,
  slideIndex,
  currentCarouselId,
  totalSlides,
  placeholders,
) {
  const slide = document.createElement('li');

  const slideId = (
    `carousel-${currentCarouselId}-slide-${slideIndex + 1}`
  );

  slide.id = slideId;

  slide.dataset.slideIndex = String(
    slideIndex,
  );

  slide.classList.add(
    'carousel-slide',
  );

  slide.setAttribute(
    'role',
    'group',
  );

  slide.setAttribute(
    'aria-roledescription',
    placeholders.slide || 'Slide',
  );

  row
    .querySelectorAll(':scope > div')
    .forEach((column, columnIndex) => {
      column.classList.add(
        `carousel-slide-${
          columnIndex === 0
            ? 'image'
            : 'content'
        }`,
      );

      slide.append(column);
    });

  const heading = slide.querySelector(
    'h1, h2, h3, h4, h5, h6',
  );

  if (heading) {
    if (!heading.id) {
      heading.id = `${slideId}-heading`;
    }

    slide.setAttribute(
      'aria-labelledby',
      heading.id,
    );
  } else {
    slide.setAttribute(
      'aria-label',
      `${placeholders.slide || 'Slide'} `
      + `${slideIndex + 1} `
      + `${placeholders.of || 'of'} `
      + `${totalSlides}`,
    );
  }

  slide
    .querySelectorAll('img')
    .forEach((image) => {
      if (!image.hasAttribute('alt')) {
        image.setAttribute(
          'alt',
          '',
        );
      }

      image.setAttribute(
        'loading',
        slideIndex === 0
          ? 'eager'
          : 'lazy',
      );
    });

  return slide;
}

/**
 * AEM EDS Carousel decorate function.
 */
export default async function decorate(block) {
  carouselId += 1;

  const currentCarouselId = carouselId;

  const blockId = (
    `carousel-${currentCarouselId}`
  );

  const rows = [
    ...block.querySelectorAll(':scope > div'),
  ];

  if (!rows.length) return;

  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.id = blockId;

  block.dataset.activeSlide = '0';

  /*
   * Accessible carousel region.
   */
  block.setAttribute(
    'role',
    'region',
  );

  block.setAttribute(
    'aria-roledescription',
    placeholders.carousel || 'Carousel',
  );

  block.setAttribute(
    'aria-label',
    placeholders.carouselLabel
      || 'Featured promotions',
  );

  /*
   * Carousel container.
   */
  const container = document.createElement(
    'div',
  );

  container.classList.add(
    'carousel-slides-container',
  );

  /*
   * Slides list.
   */
  const slidesWrapper = document.createElement(
    'ul',
  );

  slidesWrapper.classList.add(
    'carousel-slides',
  );

  slidesWrapper.id = `${blockId}-slides`;

  let slideIndicators;

  /*
   * Navigation controls are only required
   * when more than one slide exists.
   */
  if (!isSingleSlide) {
    const previousLabel = (
      placeholders.previousSlide
      || 'Previous slide'
    );

    const nextLabel = (
      placeholders.nextSlide
      || 'Next slide'
    );

    /*
     * Previous / Next buttons.
     */
    const navigationButtons = document.createElement(
      'div',
    );

    navigationButtons.classList.add(
      'carousel-navigation-buttons',
    );

    const previousButton = document.createElement(
      'button',
    );

    previousButton.type = 'button';

    previousButton.classList.add(
      'slide-prev',
    );

    previousButton.setAttribute(
      'aria-label',
      previousLabel,
    );

    previousButton.setAttribute(
      'aria-controls',
      slidesWrapper.id,
    );

    const nextButton = document.createElement(
      'button',
    );

    nextButton.type = 'button';

    nextButton.classList.add(
      'slide-next',
    );

    nextButton.setAttribute(
      'aria-label',
      nextLabel,
    );

    nextButton.setAttribute(
      'aria-controls',
      slidesWrapper.id,
    );

    navigationButtons.append(
      previousButton,
      nextButton,
    );

    container.append(
      navigationButtons,
    );

    /*
     * Slide indicators.
     */
    const slideIndicatorsNav = document.createElement(
      'nav',
    );

    slideIndicatorsNav.classList.add(
      'carousel-slide-controls',
    );

    slideIndicatorsNav.setAttribute(
      'aria-label',
      placeholders.carouselSlideControls
        || 'Carousel slide controls',
    );

    slideIndicators = document.createElement(
      'ol',
    );

    slideIndicators.classList.add(
      'carousel-slide-indicators',
    );

    slideIndicatorsNav.append(
      slideIndicators,
    );

    block.append(
      slideIndicatorsNav,
    );
  }

  /*
   * Convert authored rows into slides.
   */
  rows.forEach((row, index) => {
    const slide = createSlide(
      row,
      index,
      currentCarouselId,
      rows.length,
      placeholders,
    );

    slidesWrapper.append(
      slide,
    );

    /*
     * Create slide indicator button.
     */
    if (slideIndicators) {
      const indicator = document.createElement(
        'li',
      );

      indicator.classList.add(
        'carousel-slide-indicator',
      );

      indicator.dataset.targetSlide = String(
        index,
      );

      const indicatorButton = document.createElement(
        'button',
      );

      indicatorButton.type = 'button';

      indicatorButton.setAttribute(
        'aria-label',
        `${placeholders.showSlide || 'Show slide'} `
        + `${index + 1} `
        + `${placeholders.of || 'of'} `
        + `${rows.length}`,
      );

      indicatorButton.setAttribute(
        'aria-controls',
        slide.id,
      );

      if (index === 0) {
        indicatorButton.setAttribute(
          'aria-current',
          'true',
        );
      }

      indicator.append(
        indicatorButton,
      );

      slideIndicators.append(
        indicator,
      );
    }

    row.remove();
  });

  /*
   * Screen reader live region.
   */
  const status = document.createElement(
    'p',
  );

  status.classList.add(
    'carousel-status',
    'visually-hidden',
  );

  status.setAttribute(
    'aria-live',
    'polite',
  );

  status.setAttribute(
    'aria-atomic',
    'true',
  );

  /*
   * Add generated carousel to block.
   */
  container.append(
    slidesWrapper,
  );

  block.prepend(
    container,
  );

  block.append(
    status,
  );

  /*
   * Set initial accessibility state.
   */
  const slides = block.querySelectorAll(
    '.carousel-slide',
  );

  slides.forEach((slide, index) => {
    const isActive = index === 0;

    slide.setAttribute(
      'aria-hidden',
      String(!isActive),
    );

    slide.toggleAttribute(
      'inert',
      !isActive,
    );

    updateFocusableElements(
      slide,
      isActive,
    );
  });

  /*
   * Bind controls only when multiple
   * slides are present.
   */
  if (!isSingleSlide) {
    bindEvents(block);
  }
}