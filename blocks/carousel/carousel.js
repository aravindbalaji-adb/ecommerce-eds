const CAROUSEL_KEY = {
  PREVIOUS: 'ArrowLeft',
  NEXT: 'ArrowRight',
  FIRST: 'Home',
  LAST: 'End',
};

const AUTOPLAY_INTERVAL = 5000;

function createNavigationIcon(direction) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  const path = document.createElementNS(namespace, 'path');

  svg.classList.add('carousel-navigation-icon');
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
  button.className = `carousel-navigation-button slide-${direction}`;
  button.setAttribute('aria-label', label);

  button.append(createNavigationIcon(direction));

  return button;
}

function getSlideLabel(slide, index) {
  const heading = slide.querySelector(
    'h1, h2, h3, h4, h5, h6',
  );

  if (heading?.textContent.trim()) {
    return heading.textContent.trim();
  }

  const image = slide.querySelector('img');

  if (image?.alt.trim()) {
    return image.alt.trim();
  }

  return `Slide ${index + 1}`;
}

function prepareSlide(row, index, carouselId) {
  const slide = document.createElement('li');

  slide.className = 'carousel-slide';
  slide.id = `${carouselId}-slide-${index + 1}`;

  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  const columns = [...row.children];

  const imageColumn = columns.find(
    (column) => column.querySelector('picture'),
  );

  const picture = imageColumn?.querySelector('picture');

  /*
   * Slide image
   */
  if (picture) {
    const imageWrapper = document.createElement('div');

    imageWrapper.className = 'carousel-slide-image';

    const image = picture.querySelector('img');

    if (image) {
      image.loading = index === 0
        ? 'eager'
        : 'lazy';

      image.decoding = 'async';

      if (index === 0) {
        image.fetchPriority = 'high';
      }
    }

    imageWrapper.append(picture);

    slide.append(imageWrapper);
  }

  /*
   * Optional slide content
   */
  const contentColumns = columns.filter(
    (column) => column !== imageColumn,
  );

  const hasContent = contentColumns.some(
    (column) => (
      column.textContent.trim()
      || column.querySelector('picture')
      || column.querySelector('a')
    ),
  );

  if (hasContent) {
    const content = document.createElement('div');

    content.className = 'carousel-slide-content';

    const alignment = row.dataset.align || '';

    if (
      ['left', 'center', 'right', 'justify']
        .includes(alignment)
    ) {
      content.dataset.align = alignment;
    }

    contentColumns.forEach((column) => {
      while (column.firstChild) {
        content.append(column.firstChild);
      }
    });

    slide.append(content);
  }

  const label = getSlideLabel(slide, index);

  slide.setAttribute(
    'aria-label',
    label,
  );

  return slide;
}

function createIndicator(slide, index) {
  const item = document.createElement('li');
  const button = document.createElement('button');

  item.className = 'carousel-slide-indicator';

  button.type = 'button';

  button.setAttribute(
    'aria-label',
    `Show slide ${index + 1}`,
  );

  button.setAttribute(
    'aria-controls',
    slide.id,
  );

  button.dataset.slideIndex = index;

  item.append(button);

  return item;
}

function setActiveSlide(
  activeIndex,
  slides,
  indicators,
  status,
) {
  slides.forEach((slide, index) => {
    slide.setAttribute(
      'aria-hidden',
      String(index !== activeIndex),
    );
  });

  indicators.forEach(
    (indicator, index) => {
      const button = indicator.querySelector('button');

      if (index === activeIndex) {
        button.setAttribute(
          'aria-current',
          'true',
        );
      } else {
        button.removeAttribute(
          'aria-current',
        );
      }
    },
  );

  status.textContent =
    `Slide ${activeIndex + 1} of ${slides.length}`;
}

function getNearestSlideIndex(
  slidesContainer,
  slides,
) {
  const containerLeft = slidesContainer
    .getBoundingClientRect()
    .left;

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  slides.forEach((slide, index) => {
    const distance = Math.abs(
      slide.getBoundingClientRect().left
        - containerLeft,
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function scrollToSlide(
  slidesContainer,
  slides,
  index,
) {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  slidesContainer.scrollTo({
    left: slides[index].offsetLeft,
    behavior: prefersReducedMotion
      ? 'auto'
      : 'smooth',
  });
}

/**
 * Decorates the Carousel block.
 *
 * Features:
 * - Previous / next navigation
 * - Slide indicators
 * - Keyboard navigation
 * - Touch / swipe scrolling
 * - Automatic scrolling
 * - Pause on hover
 * - Pause on keyboard focus
 * - Reduced-motion support
 *
 * @param {HTMLElement} block Carousel block
 */
export default function decorate(block) {
  const rows = [...block.children];

  if (!rows.length) {
    return;
  }

  const carouselId =
    `carousel-${crypto.randomUUID()}`;

  const regionLabel =
    block.dataset.label
    || 'Featured promotions';

  /*
   * Carousel accessibility
   */
  block.setAttribute(
    'role',
    'region',
  );

  block.setAttribute(
    'aria-roledescription',
    'carousel',
  );

  block.setAttribute(
    'aria-label',
    regionLabel,
  );

  /*
   * Main container
   */
  const container = document.createElement('div');

  container.className =
    'carousel-slides-container';

  /*
   * Slide list
   */
  const slidesContainer =
    document.createElement('ul');

  slidesContainer.className =
    'carousel-slides';

  slidesContainer.id =
    `${carouselId}-slides`;

  slidesContainer.tabIndex = 0;

  slidesContainer.setAttribute(
    'aria-label',
    `${regionLabel} slides`,
  );

  /*
   * Build slides
   */
  const slides = rows.map(
    (row, index) => prepareSlide(
      row,
      index,
      carouselId,
    ),
  );

  slides.forEach((slide, index) => {
    const label = slide.getAttribute(
      'aria-label',
    );

    slide.setAttribute(
      'aria-label',
      `${index + 1} of ${slides.length}: ${label}`,
    );

    slidesContainer.append(slide);
  });

  /*
   * Navigation
   */
  const navigation =
    document.createElement('div');

  navigation.className =
    'carousel-navigation-buttons';

  const previousButton =
    createNavigationButton(
      'previous',
      'Show previous slide',
    );

  const nextButton =
    createNavigationButton(
      'next',
      'Show next slide',
    );

  navigation.append(
    previousButton,
    nextButton,
  );

  container.append(slidesContainer);

  if (slides.length > 1) {
    container.append(navigation);
  }

  /*
   * Indicators
   */
  const indicatorsList =
    document.createElement('ol');

  indicatorsList.className =
    'carousel-slide-indicators';

  indicatorsList.setAttribute(
    'aria-label',
    'Choose a slide',
  );

  const indicators = slides.map(
    (slide, index) => {
      const indicator = createIndicator(
        slide,
        index,
      );

      indicatorsList.append(indicator);

      return indicator;
    },
  );

  /*
   * Screen-reader status
   */
  const status =
    document.createElement('p');

  status.className =
    'carousel-status';

  status.setAttribute(
    'aria-live',
    'polite',
  );

  status.setAttribute(
    'aria-atomic',
    'true',
  );

  /*
   * Replace original EDS block markup
   */
  block.replaceChildren(
    container,
    indicatorsList,
    status,
  );

  /*
   * Single slide
   */
  if (slides.length === 1) {
    indicatorsList.hidden = true;

    setActiveSlide(
      0,
      slides,
      indicators,
      status,
    );

    return;
  }

  let activeIndex = 0;
  let scrollFrame;
  let autoplayTimer = null;

  const reducedMotionQuery =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );

  /*
   * Update active slide
   */
  function updateActiveSlide(index) {
    activeIndex = index;

    setActiveSlide(
      activeIndex,
      slides,
      indicators,
      status,
    );
  }

  /*
   * Navigate to a slide
   */
  function goToSlide(index) {
    const normalizedIndex = (
      index + slides.length
    ) % slides.length;

    updateActiveSlide(
      normalizedIndex,
    );

    scrollToSlide(
      slidesContainer,
      slides,
      normalizedIndex,
    );
  }

  /*
   * Stop autoplay
   */
  function stopAutoplay() {
    if (autoplayTimer !== null) {
      window.clearInterval(
        autoplayTimer,
      );

      autoplayTimer = null;
    }
  }

  /*
   * Start autoplay
   */
  function startAutoplay() {
    stopAutoplay();

    if (
      reducedMotionQuery.matches
      || document.hidden
      || slides.length <= 1
    ) {
      return;
    }

    autoplayTimer = window.setInterval(
      () => {
        goToSlide(
          activeIndex + 1,
        );
      },
      AUTOPLAY_INTERVAL,
    );
  }

  /*
   * Restart autoplay countdown
   */
  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  /*
   * Previous button
   */
  previousButton.addEventListener(
    'click',
    () => {
      goToSlide(
        activeIndex - 1,
      );

      restartAutoplay();
    },
  );

  /*
   * Next button
   */
  nextButton.addEventListener(
    'click',
    () => {
      goToSlide(
        activeIndex + 1,
      );

      restartAutoplay();
    },
  );

  /*
   * Indicator navigation
   */
  indicators.forEach(
    (indicator, index) => {
      const button =
        indicator.querySelector('button');

      button.addEventListener(
        'click',
        () => {
          goToSlide(index);

          restartAutoplay();
        },
      );
    },
  );

  /*
   * Keyboard navigation
   */
  slidesContainer.addEventListener(
    'keydown',
    (event) => {
      switch (event.key) {
        case CAROUSEL_KEY.PREVIOUS:
          event.preventDefault();

          goToSlide(
            activeIndex - 1,
          );

          restartAutoplay();

          break;

        case CAROUSEL_KEY.NEXT:
          event.preventDefault();

          goToSlide(
            activeIndex + 1,
          );

          restartAutoplay();

          break;

        case CAROUSEL_KEY.FIRST:
          event.preventDefault();

          goToSlide(0);

          restartAutoplay();

          break;

        case CAROUSEL_KEY.LAST:
          event.preventDefault();

          goToSlide(
            slides.length - 1,
          );

          restartAutoplay();

          break;

        default:
          break;
      }
    },
  );

  /*
   * Detect native swipe / trackpad scrolling
   */
  slidesContainer.addEventListener(
    'scroll',
    () => {
      window.cancelAnimationFrame(
        scrollFrame,
      );

      scrollFrame = window.requestAnimationFrame(
        () => {
          const nearestIndex =
            getNearestSlideIndex(
              slidesContainer,
              slides,
            );

          if (
            nearestIndex
            !== activeIndex
          ) {
            updateActiveSlide(
              nearestIndex,
            );
          }
        },
      );
    },
    {
      passive: true,
    },
  );

  /*
   * Pause autoplay while mouse is over carousel
   */
  block.addEventListener(
    'mouseenter',
    stopAutoplay,
  );

  /*
   * Resume autoplay when mouse leaves
   */
  block.addEventListener(
    'mouseleave',
    startAutoplay,
  );

  /*
   * Pause autoplay while keyboard focus
   * is inside carousel
   */
  block.addEventListener(
    'focusin',
    stopAutoplay,
  );

  /*
   * Resume when keyboard focus leaves carousel
   */
  block.addEventListener(
    'focusout',
    (event) => {
      if (
        !block.contains(
          event.relatedTarget,
        )
      ) {
        startAutoplay();
      }
    },
  );

  /*
   * Pause when browser tab becomes hidden.
   */
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    },
  );

  /*
   * Respect reduced-motion changes
   */
  reducedMotionQuery.addEventListener(
    'change',
    () => {
      if (reducedMotionQuery.matches) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    },
  );

  /*
   * Keep current slide aligned
   * after screen resize.
   */
  window.addEventListener(
    'resize',
    () => {
      window.cancelAnimationFrame(
        scrollFrame,
      );

      scrollFrame = window.requestAnimationFrame(
        () => {
          slidesContainer.scrollLeft =
            slides[activeIndex].offsetLeft;
        },
      );
    },
    {
      passive: true,
    },
  );

  /*
   * Initial carousel state
   */
  updateActiveSlide(0);

  /*
   * Start automatic scrolling
   */
  startAutoplay();
}