import throttle from 'lodash/throttle';

const HOME_PAGE_ID = `top`;
const STORY_SCREEN_ID = `story`;
const DELAY_TO_BE_ACTIVATED = 100;
const DELAY_FOR_STORY_CLOSING = 400;

export default class FullPageScroll {
  constructor() {
    this.THROTTLE_TIMEOUT = 1000;
    this.scrollFlag = true;
    this.timeout = null;

    this.screenElements = document.querySelectorAll(`.screen:not(.screen--result)`);
    this.menuElements = document.querySelectorAll(`.page-header__menu .js-menu-link`);
    this.homeScreen = document.getElementById(HOME_PAGE_ID);
    this.storyScreen = document.getElementById(STORY_SCREEN_ID);

    this.activeScreen = null;
    this.onScrollHandler = this.onScroll.bind(this);
    this.onUrlHashChengedHandler = this.onUrlHashChanged.bind(this);
    this.onNavigationMenuClickedHandler = (event) => {
      if (!event.target.classList.contains(`js-menu-link`)) {
        return;
      }
      this.activateScreen(event.target.dataset.href);
    };
  }

  init() {
    document.addEventListener(`wheel`, throttle(this.onScrollHandler, this.THROTTLE_TIMEOUT, {trailing: true}));
    window.addEventListener(`popstate`, this.onUrlHashChengedHandler);
    document.addEventListener(`click`, this.onNavigationMenuClickedHandler, true);

    this.activateScreen();
    this.onUrlHashChanged();
  }

  onScroll(evt) {
    if (this.scrollFlag) {
      this.reCalculateActiveScreenPosition(evt.deltaY);
      const currentPosition = this.activeScreen;
      if (currentPosition !== this.activeScreen) {
        this.changeActiveMenuItem();
        this.emitChangeDisplayEvent();
      }
    }
    this.scrollFlag = false;
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.scrollFlag = true;
    }, this.THROTTLE_TIMEOUT);
  }

  activateScreen(id) {
    let previousScreen;
    let screenNavigateTo;
    if (id) {
      previousScreen = this.activeScreen;
      screenNavigateTo = this.findScreenById(id);
    } else {
      previousScreen = null;
      screenNavigateTo = this.homeScreen;
    }

    this.activeScreen = screenNavigateTo;
    if (previousScreen === this.storyScreen) {
      this.hideStoryScreenForBackgroundFilledScreens();
    } else {
      this.hideScreen(previousScreen);
    }
  }

  onUrlHashChanged() {
    this.changeActiveMenuItem();
    this.emitChangeDisplayEvent();
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find((item) => item.dataset.href === this.activeScreen.id);
    this.menuElements.forEach((item) => item.classList.remove(`active`));
    activeItem.classList.add(`active`);
  }

  emitChangeDisplayEvent() {
    const event = new CustomEvent(`screenChanged`, {
      detail: {
        'screenName': this.activeScreen.id,
        'screenElement': this.activeScreen,
      },
    });

    document.body.dispatchEvent(event);
  }

  reCalculateActiveScreenPosition(delta) {
    if (delta > 0) {
      this.activeScreen = Math.min(this.screenElements.length - 1, ++this.activeScreen);
    } else {
      this.activeScreen = Math.max(0, --this.activeScreen);
    }
  }

  hideScreen(previousScreen) {
    if (previousScreen) {
      previousScreen.classList.add(`screen--hidden`);
      previousScreen.classList.remove(`active`);
    }

    this.navigateToActivatedScreen();
    this.activeScreen.classList.remove(`screen--hidden`);
    setTimeout(() => {
      this.activeScreen.classList.add(`active`);
    }, DELAY_TO_BE_ACTIVATED);
  }

  hideStoryScreenForBackgroundFilledScreens() {
    this.storyScreen.classList.add(`js-story-closing`);
    setTimeout(() => {
      this.storyScreen.classList.add(`screen--hidden`);
      this.storyScreen.classList.remove(`active`);
      this.storyScreen.classList.remove(`js-story-closing`);

      this.navigateToActivatedScreen();
      this.activeScreen.classList.remove(`screen--hidden`);
      setTimeout(() => {
        this.activeScreen.classList.add(`active`);
      }, DELAY_TO_BE_ACTIVATED);
    }, DELAY_FOR_STORY_CLOSING);
  }

  navigateToActivatedScreen() {
    window.location.href = `#${this.activeScreen.id}`;
  }

  findScreenById(id) {
    return Array.from(this.screenElements).find((screen) => screen.id === id);
  }
}
