import { decorateIcons, loadCSS } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

function itemClassUpdation(items, newIndex, visibleItems) {
  const stopAt = newIndex + visibleItems;
  items.forEach((item, i) => {
    item.classList.remove('selected');
    if (i >= newIndex && i < stopAt && !item.classList.contains('viewed')) {
      item.classList.add('viewed');
    }
  });
}

class Carousel {
  constructor(block, data, config) {
    // Set defaults
    this.cssFiles = [];
    this.defaultStyling = true;
    this.navButtons = true;
    this.fullPageScroll = false;
    this.currentIndex = 0;
    this.currentPage = 0;
    this.cardRenderer = this;
    this.visibleItems = [
      { items: 1, condition: () => window.innerWidth < 431 },
      { items: 2, condition: () => window.innerWidth < 768 },
      { items: 4 }, // default
    ];

    // Set information
    this.block = block;
    this.data = data || [...block.children];

    // Will be replaced after rendering, if available
    this.navButtonLeft = null;
    this.navButtonRight = null;

    // Apply overwrites
    Object.assign(this, config);

    // Derive step size from visible items (keeps step equal to visible count)
    this.stepSize = this.getCurrentVisibleItems();

    // Resize debounce state
    this.resizeDebounceMs = 120;
    this.resizeTimeout = null;

    if (this.getCurrentVisibleItems() >= this.data.length) {
      this.navButtons = false;
      this.block.classList.add('fully-visible');
    }

    if (this.defaultStyling) {
      this.cssFiles.push(`/blocks/carousel/carousel.css`);
    }
  }

  getBlockPadding() {
    if (!this.blockStyle) {
      this.blockStyle = window.getComputedStyle(this.block);
    }
    return +this.blockStyle.getPropertyValue('padding-left').replace('px', '');
  }

  getScrollPosition(item) {
    const targetPosition = item.offsetLeft - this.getBlockPadding() - this.block.offsetLeft;
    return { left: targetPosition, top: 0 };
  }

  /**
   * Scroll the carousel to the next item
   */
  nextItem() {
    const items = this.block.querySelectorAll('.carousel-item:not(.clone)');
    const selectedItem = this.block.querySelector('.carousel-item.selected');

    let index = [...items].indexOf(selectedItem);
    index = index !== -1 ? index : 0;

    const visible = this.getCurrentVisibleItems();
    const lastIndex = Math.max(0, items.length - visible);

    let newIndex;
    if (this.infiniteScroll) {
      // wrap around
      newIndex = (index + this.stepSize) % items.length;
    } else {
      // clamp to last page
      newIndex = Math.min(index + this.stepSize, lastIndex);
    }

    const newSelectedItem = items[newIndex] || items[lastIndex];

    // update classes
    itemClassUpdation(items, newIndex, visible);

    newSelectedItem.parentNode.scrollTo({
      ...this.getScrollPosition(newSelectedItem),
      behavior: 'smooth',
    });

    newSelectedItem.classList.add('selected');
    this.updateGlobalState(newIndex);
  }

  getCurrentVisibleItems() {
    return this.visibleItems.filter((e) => !e.condition || e.condition())[0].items;
  }

  handleResize() {
    // Debounced resize handler. Recompute visible items & step size, clamp index, update UI.
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      const prevVisible = this.getCurrentVisibleItems();
      this.stepSize = prevVisible;

      // Clamp currentIndex so it doesn't point past the last page
      const items = this.block.querySelectorAll('.carousel-item:not(.clone)');
      const lastIndex = Math.max(0, items.length - prevVisible);
      if (this.currentIndex > lastIndex) this.currentIndex = lastIndex;

      // Update nav state and viewed/selected classes
      this.updateGlobalState(this.currentIndex);
      itemClassUpdation(items, this.currentIndex, prevVisible);

      // Optionally expose visible count to CSS
      try {
        this.block.style.setProperty('--visible-items', String(prevVisible));
      } catch (e) {
        // ignore if styling not available
      }
    }, this.resizeDebounceMs);
  }

  /**
   * Scroll the carousel to the previous item
   */
  prevItem() {
    const items = this.block.querySelectorAll('.carousel-item:not(.clone)');
    const selectedItem = this.block.querySelector('.carousel-item.selected');

    let index = [...items].indexOf(selectedItem);
    index = index !== -1 ? index : 0;
    const visible = this.getCurrentVisibleItems();

    let newIndex;
    if (this.infiniteScroll) {
      newIndex = index - this.stepSize;
      if (newIndex < 0) newIndex = ((newIndex % items.length) + items.length) % items.length;
    } else {
      newIndex = Math.max(0, index - this.stepSize);
    }

    const newSelectedItem = items[newIndex] || items[0];

    // update classes
    itemClassUpdation(items, newIndex, visible);

    newSelectedItem.parentNode.scrollTo({
      ...this.getScrollPosition(newSelectedItem),
      behavior: 'smooth',
    });

    newSelectedItem.classList.add('selected');
    this.updateGlobalState(newIndex);
  }

  updateGlobalState(newIndex = this.currentIndex) {
    this.currentIndex = newIndex;
    this.currentPage = Math.floor(newIndex / this.stepSize);
    if (this.dotButtons) {
      const dotButtonEls = this.block.parentNode.querySelectorAll('.carousel-dot-button');
      dotButtonEls.forEach((r) => r.classList.remove('selected'));
      dotButtonEls[this.currentPage]?.classList.add('selected');
    }

    // If not infinite scrolling, enable/disable nav buttons based on position
    if (!this.infiniteScroll && this.navButtons) {
      const items = this.block.querySelectorAll('.carousel-item:not(.clone)');
      const lastIndex = Math.max(0, items.length - this.getCurrentVisibleItems());
      if (this.navButtonLeft) {
        if (this.currentIndex <= 0) this.navButtonLeft.classList.add('disabled');
        else this.navButtonLeft.classList.remove('disabled');
      }
      if (this.navButtonRight) {
        if (this.currentIndex >= lastIndex) this.navButtonRight.classList.add('disabled');
        else this.navButtonRight.classList.remove('disabled');
      }
    }
  }

  /**
   * Create left and right arrow navigation buttons
   */
  createNavButtons(parentElement) {
    const buttonLeft = document.createElement('button');
    buttonLeft.classList.add('carousel-nav-left');
    buttonLeft.ariaLabel = 'Scroll to previous item';
    const navIconLeft = document.createElement('span');
    navIconLeft.classList.add('icon', 'icon-chevron-left');
    buttonLeft.append(navIconLeft);
    buttonLeft.addEventListener('click', () => {
      this.prevItem();
    });

    const buttonRight = document.createElement('button');
    buttonRight.classList.add('carousel-nav-right');
    buttonRight.ariaLabel = 'Scroll to next item';
    const navIconRight = document.createElement('span');
    navIconRight.classList.add('icon', 'icon-chevron-right');
    buttonRight.append(navIconRight);
    buttonRight.addEventListener('click', () => {
      this.nextItem();
    });

    [buttonLeft, buttonRight].forEach((navButton) => {
      navButton.classList.add('carousel-nav-button');
      parentElement.append(navButton);
    });

    // Set initial disabled state based on current index and visible items
    if (!this.infiniteScroll) {
      const items = this.block.querySelectorAll('.carousel-item:not(.clone)');
      const lastIndex = Math.max(0, items.length - this.getCurrentVisibleItems());
      if (this.currentIndex <= 0) buttonLeft.classList.add('disabled');
      if (this.currentIndex >= lastIndex) buttonRight.classList.add('disabled');
    }

    decorateIcons(buttonLeft);
    decorateIcons(buttonRight);
    this.navButtonLeft = buttonLeft;
    this.navButtonRight = buttonRight;
  }

  /**
   * Adds event listeners for touch UI swiping
   */
  addSwipeCapability() {
    if (this.block.swipeCapabilityAdded) {
      return;
    }

    let touchstartX = 0;
    let touchstartY = 0;
    let touchendX = 0;
    let touchendY = 0;
    let touchmoveX = 0;
    let touchmoveY = 0;
    let carouselStartPosition = 0;
    let isScrolled = false;

    this.block.addEventListener(
      'touchstart',
      (e) => {
        carouselStartPosition = this.block.scrollLeft;
        touchstartX = e.changedTouches[0].clientX;
        touchstartY = e.changedTouches[0].clientY;
        touchmoveX = touchstartX;
        touchmoveY = touchstartY;
      },
      { passive: false } // Allow prevention of default behavior
    );

    this.block.addEventListener(
      'touchmove',
      (e) => {
        this.block.style.scrollBehavior = 'auto';
        touchendX = e.changedTouches[0].clientX;
        touchendY = e.changedTouches[0].clientY;
        const diffX = touchendX - touchmoveX;
        const diffY = touchendY - touchmoveY;

        if (Math.abs(diffY) > Math.abs(diffX)) {
          // Allow vertical scrolling
          isScrolled = false;
        } else if (Math.abs(diffX) > 10) {
          // Lock vertical scrolling while swiping horizontally
          e.preventDefault(); // Prevent page scroll
          this.block.scrollLeft -= diffX;
          touchmoveX = touchendX;
          touchmoveY = touchendY;
          isScrolled = true;
        }
      },
      { passive: false } // Required to use preventDefault
    );

    this.block.addEventListener(
      'touchend',
      (e) => {
        touchendX = e.changedTouches[0].clientX;
        touchendY = e.changedTouches[0].clientY;
        const diffX = touchendX - touchstartX;
        const diffY = touchendY - touchstartY;

        if (isScrolled) {
          if (Math.abs(diffX) < Math.abs(diffY) || Math.abs(diffX) < 30) {
            this.block.scrollLeft = carouselStartPosition;
            return;
          }

          if (touchendX < touchstartX) {
            clearInterval(this.intervalId);
            this.nextItem();
          }

          if (touchendX > touchstartX) {
            clearInterval(this.intervalId);
            this.prevItem();
          }
        } else if (Math.abs(diffY) >= 30 || Math.abs(diffX) <= 10) {
          this.block.scrollLeft = carouselStartPosition;
        }
      },
      { passive: false }
    );
    this.block.swipeCapabilityAdded = true;
  }

  /*
   * Changing the default rendering may break carousels that rely on it
   * (e.g. CSS might not match anymore)
   */
  // Default renderItem behavior removed — items are appended directly in render()

  async render() {
    // copy carousel styles to the wrapper too
    this.block.parentElement.classList.add(
      ...[...this.block.classList].filter((item, idx) => idx !== 0 && item !== 'block')
    );

    let defaultCSSPromise;
    if (Array.isArray(this.cssFiles) && this.cssFiles.length > 0) {
      // add default carousel classes to apply default CSS
      defaultCSSPromise = Promise.all(this.cssFiles.map(loadCSS));
      this.block.parentElement.classList.add('carousel-wrapper');
      this.block.classList.add('carousel');
    }

    this.block.innerHTML = '';
    await this.data.reduce(async (promise, item, index) => {
      await promise;
      const itemContainer = document.createElement('div');
      const itemClass = item?.classList ? [...item.classList] : [];
      itemContainer.classList.add('carousel-item', `carousel-item-${index + 1}`, ...itemClass);
      itemContainer.setAttribute('data-index', `${index + 1}`);
      // Items are already rendered DOM nodes; append them directly
      const renderedElements = Array.isArray(item) ? item : [item];
      renderedElements.forEach((renderedItemElement) => {
        itemContainer.appendChild(renderedItemElement);
      });
      this.block.appendChild(itemContainer);
      return Promise.resolve();
    }, Promise.resolve());
    // set initial selected carousel item
    const activeItems = this.block.querySelectorAll('.carousel-item:not(.clone)');
    activeItems[this.currentIndex]?.classList.add('selected');

    // create autoscrolling animation
    if (this.navButtons) {
      this.createNavButtons(this.block.parentElement);
    }
    this.addSwipeCapability();

    // Add resize event listener for responsive behavior
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);

    if (this.cssFiles) {
      await defaultCSSPromise;
    }
    itemClassUpdation(activeItems, this.currentIndex, this.getCurrentVisibleItems());
  }
}

export async function createCarousel(block, data, config) {
  const carousel = new Carousel(block, data, config);
  await carousel.render();
  return carousel;
}

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) updateActiveSlide(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders('en');

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute(
      'aria-label',
      placeholders.carouselSlideControls || 'Carousel Slide Controls'
    );
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
