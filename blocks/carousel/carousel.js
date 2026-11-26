const CAROUSEL_KEY = {
  PREVIOUS: 'ArrowLeft',
  NEXT: 'ArrowRight',
  FIRST: 'Home',
  LAST: 'End',
};

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
  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');

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
  const columns = [...row.children];

  const picture = row.querySelector('picture');

  const imageColumn = picture?.closest(':scope > div')
    || picture?.parentElement;

  slide.className = 'carousel-slide';
  slide.id = `${carouselId}-slide-${index + 1}`;

  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  /*
   * Image
   */
  if (picture) {
    const imageWrapper = document.createElement('div');
    const image = picture.querySelector('img');

    imageWrapper.className = 'carousel-slide-image';

    if (image) {
      image.loading = index === 0 ? 'eager' : 'lazy';
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
    (column) => column.textContent.trim() || column.children.length,
  );

  if (hasContent) {
    const content = document.createElement('div');

    content.className = 'carousel-slide-content';

    const alignment = row.dataset.align
      || imageColumn?.nextElementSibling?.dataset.align
      || '';

    if (
      ['left', 'center', 'right', 'justify'].includes(alignment)
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

  slide.setAttribute('aria-label', label);

  return slide;
}

function createIndicator(slide, index) {
  const item = document.createElement('li');
  const button = document.createElement('button');

  const slideLabel = slide.getAttribute('aria-label');

  item.className = 'carousel-slide-indicator';

  button.type = 'button';

  button.setAttribute(
    'aria-label',
    `Show slide ${index + 1}: ${slideLabel}`,
  );

  button.setAttribute(
    'aria-controls',
    slide.id,
  );

  button.dataset.slideIndex = index;

  item.append(button);

  return item;
}

function getNearestSlideIndex(slidesContainer, slides) {
  const containerLeft = slidesContainer
    .getBoundingClientRect()
    .left;

  return slides.reduce((nearestIndex, slide, index) => {
    const currentDistance = Math.abs(
      slide.getBoundingClientRect().left - containerLeft,
    );

    const nearestDistance = Math.abs(
      slides[nearestIndex].getBoundingClientRect().left
        - containerLeft,
    );

    return currentDistance < nearestDistance
      ? index
      : nearestIndex;
  }, 0);
}

function setActiveSlide({
  activeIndex,
  slides,
  indicators,
  status,
}) {
  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;

    slide.setAttribute(
      'aria-hidden',
      String(!isActive),
    );
  });

  indicators.forEach((indicator, index) => {
    const button = indicator.querySelector('button');
    const isActive = index === activeIndex;

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
  });

  status.textContent = `Slide ${activeIndex + 1} of ${slides.length}`;
}

function scrollToSlide(
  slidesContainer,
  slides,
  index,
) {
  const normalizedIndex = (
    (index % slides.length) + slides.length
  ) % slides.length;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  slidesContainer.scrollTo({
    left: slides[normalizedIndex].offsetLeft,
    behavior: prefersReducedMotion
      ? 'auto'
      : 'smooth',
  });
}

/**
 * Decorates the Carousel block.
 *
 * Expected DA structure:
 *
 * Carousel
 * ---------------------------------
 * Image | Optional Content
 * Image | Optional Content
 * Image | Optional Content
 *
 * @param {HTMLElement} block Carousel block
 */
export default function decorate(block) {
  const rows = [...block.children];

  if (!rows.length) {
    return;
  }

  /*
   * Generate unique carousel ID.
   */
  const carouselId = `carousel-${crypto.randomUUID()}`;

  const regionLabel =
    block.dataset.label
    || 'Featured promotions';

  /*
   * Main carousel container
   */
  const carouselContainer =
    document.createElement('div');

  carouselContainer.className =
    'carousel-slides-container';

  /*
   * Scrollable slides container
   */
  const slidesContainer =
    document.createElement('div');

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
   * Semantic slide list
   */
  const slidesList =
    document.createElement('ul');

  slidesList.className =
    'carousel-slides-list';

  slidesList.setAttribute(
    'role',
    'list',
  );

  /*
   * Slide indicators
   */
  const indicatorsList =
    document.createElement('ol');

  indicatorsList.className =
    'carousel-slide-indicators';

  indicatorsList.setAttribute(
    'aria-label',
    'Choose a slide',
  );

  /*
   * Navigation container
   */
  const navigation =
    document.createElement('div');

  navigation.className =
    'carousel-navigation-buttons';

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
    const originalLabel =
      slide.getAttribute('aria-label');

    slide.setAttribute(
      'aria-label',
      `${index + 1} of ${slides.length}: ${originalLabel}`,
    );

    slidesList.append(slide);
  });

  slidesContainer.append(slidesList);

  /*
   * Build slide indicators
   */
  const indicators = slides.map(
    (slide, index) => {
      const indicator =
        createIndicator(
          slide,
          index,
        );

      indicatorsList.append(indicator);

      return indicator;
    },
  );

  /*
   * Navigation buttons
   */
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

  carouselContainer.append(
    slidesContainer,
  );

  /*
   * Hide navigation if only one slide exists.
   */
  if (slides.length > 1) {
    carouselContainer.append(
      navigation,
    );
  }

  /*
   * Replace original EDS block content.
   */
  block.replaceChildren(
    carouselContainer,
    indicatorsList,
    status,
  );

  /*
   * Single-slide carousel
   */
  if (slides.length === 1) {
    indicatorsList.hidden = true;

    setActiveSlide({
      activeIndex: 0,
      slides,
      indicators,
      status,
    });

    return;
  }

  let activeIndex = 0;
  let scrollFrame;

  /*
   * Update current slide state.
   */
  const updateActiveSlide = (index) => {
    activeIndex = index;

    setActiveSlide({
      activeIndex,
      slides,
      indicators,
      status,
    });
  };

  /*
   * Navigate to slide.
   */
  const goToSlide = (index) => {
    const normalizedIndex = (
      (index % slides.length)
      + slides.length
    ) % slides.length;

    updateActiveSlide(
      normalizedIndex,
    );

    scrollToSlide(
      slidesContainer,
      slides,
      normalizedIndex,
    );
  };

  /*
   * Previous arrow
   */
  previousButton.addEventListener(
    'click',
    () => {
      goToSlide(
        activeIndex - 1,
      );
    },
  );

  /*
   * Next arrow
   */
  nextButton.addEventListener(
    'click',
    () => {
      goToSlide(
        activeIndex + 1,
      );
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
      let targetIndex =
        activeIndex;

      switch (event.key) {
        case CAROUSEL_KEY.PREVIOUS:
          targetIndex =
            activeIndex - 1;
          break;

        case CAROUSEL_KEY.NEXT:
          targetIndex =
            activeIndex + 1;
          break;

        case CAROUSEL_KEY.FIRST:
          targetIndex = 0;
          break;

        case CAROUSEL_KEY.LAST:
          targetIndex =
            slides.length - 1;
          break;

        default:
          return;
      }

      event.preventDefault();

      goToSlide(
        targetIndex,
      );
    },
  );

  /*
   * Detect slide changes caused by
   * native swipe or trackpad scrolling.
   */
  slidesContainer.addEventListener(
    'scroll',
    () => {
      window.cancelAnimationFrame(
        scrollFrame,
      );

      scrollFrame =
        window.requestAnimationFrame(
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
   * Keep current slide aligned
   * when viewport size changes.
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
            slidesContainer.scrollLeft =
              slides[
                activeIndex
              ].offsetLeft;
          },
        );
    },
    {
      passive: true,
    },
  );

  /*
   * Initial state
   */
  updateActiveSlide(0);
}