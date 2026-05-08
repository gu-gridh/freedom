const freedomScripts = () => {
    const body = document.body;
    const mainHeader = document.querySelector('.main-header');
    const mainHeaderTopBar = document.querySelector('.main-header__top-bar');
    const mainHeaderMainBar = document.querySelector('.main-header__main-bar');
    const menuDrawer = document.getElementById('menu-drawer');
    const userBar = document.getElementById('user-bar');

    // Restore scroll position after reload
    const savedScroll = sessionStorage.getItem('scrollY');

    if (savedScroll !== null) {
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedScroll, 10));
            sessionStorage.removeItem('scrollY');
        }, 100);
    }

    function saveScrollPosition() {
        sessionStorage.setItem('scrollY', window.scrollY);
        console.log('Saved scroll position:', window.scrollY);
    }

    // AdvancedSearch: preserve scroll on form submit
    document.addEventListener('submit', function (e) {
        saveScrollPosition();
    }, true);

    // AdvancedSearch: clear normal search input with native "x"
    function handleSearchClear(target) {
        console.log('Input event on:', target);
        if (!target.matches('input[type="search"], input[name="q"], input.search-query')) {
            return;
        }

        if (target.value !== '') {
            return;
        }

        const form = target.closest('form');

        if (form && form.classList.contains('facets-form')) {
            saveScrollPosition();
            form.submit();
        }
    }

    document.addEventListener('input', function (e) {
        handleSearchClear(e.target);
    });

    document.addEventListener('search', function (e) {
        handleSearchClear(e.target);
    });

    // AdvancedSearch / Chosen: submit when a select filter is cleared or changed
    document.addEventListener('change', function (e) {
        const target = e.target;

        if (!target.matches('select')) {
            return;
        }

        const form = target.closest('form');

        if (form) {
            saveScrollPosition();
            form.submit();
        }
    });

    // Resize Events
    let userBarHeight = 0;
    let timeout = false;
    const delay = 250;

    onResize();

    function onResize() {
        getUserBarHeight();
        refreshBodyPaddingTop();
    }

    window.addEventListener('resize', function () {
        clearTimeout(timeout);
        timeout = setTimeout(onResize, delay);
    });

    function refreshBodyPaddingTop() {
        if (!mainHeader || !mainHeaderMainBar) {
            return;
        }

        body.style.paddingTop = mainHeader.offsetHeight + 'px';
        document.documentElement.style.scrollPaddingTop = (mainHeaderMainBar.offsetHeight + 20) + 'px';
    }

    function getUserBarHeight() {
        if (userBar) {
            userBarHeight = userBar.offsetHeight;
        }
    }

    // Scrolling Events
    let lastKnownScrollPosition = 0;
    let ticking = false;
    let scrollDirection = 'up';

    onScroll();

    function onScroll(scrollPos = window.scrollY) {
        if (!mainHeader || !mainHeaderTopBar || !mainHeaderMainBar || !menuDrawer) {
            return;
        }

        if (scrollPos > 60 && scrollDirection === 'down') {
            mainHeader.style.top = -(userBarHeight + mainHeaderTopBar.offsetHeight) + 'px';
            menuDrawer.style.top = mainHeaderMainBar.offsetHeight + 'px';
            menuDrawer.style.height = 'calc(100% - ' + mainHeaderMainBar.offsetHeight + 'px)';
        } else {
            mainHeader.style.top = 0;
            menuDrawer.style.top = mainHeader.offsetHeight + 'px';
            menuDrawer.style.height = 'calc(100% - ' + mainHeader.offsetHeight + 'px)';
        }
    }

    document.addEventListener('scroll', () => {
        scrollDirection = Math.max(lastKnownScrollPosition, window.scrollY) === lastKnownScrollPosition ? 'up' : 'down';
        lastKnownScrollPosition = window.scrollY;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                onScroll(lastKnownScrollPosition);
                ticking = false;
            });

            ticking = true;
        }
    });

    // Annotations tooltip position
    const annotationBtns = document.querySelectorAll('.annotation-btn');

    annotationBtns.forEach((annotationBtn) => {
        const annotationTooltip = annotationBtn.querySelector('.annotation-tooltip');

        if (!annotationTooltip || !mainHeader) {
            return;
        }

        const annotationTooltipWrapper = annotationTooltip.querySelector('.annotation-tooltip__wrapper');

        if (!annotationTooltipWrapper) {
            return;
        }

        ['click', 'mouseover'].forEach((event) => {
            annotationBtn.addEventListener(event, setAnnotationTooltipPos);
        });

        function setAnnotationTooltipPos() {
            const annotationBtnOffset = annotationBtn.getBoundingClientRect();
            const { top, left } = annotationBtnOffset;
            const distanceToRightEdge = window.innerWidth - (left + annotationBtn.offsetWidth);

            if (distanceToRightEdge < annotationTooltipWrapper.offsetWidth + 15) {
                annotationTooltip.style.left = distanceToRightEdge - annotationTooltipWrapper.offsetWidth - 15 + 'px';
            } else {
                annotationTooltip.style.left = '0px';
            }

            if (top - mainHeader.offsetHeight - mainHeader.offsetTop < annotationTooltipWrapper.offsetHeight + 15) {
                annotationTooltip.style.bottom = -annotationTooltipWrapper.offsetHeight - 20 + 'px';
                annotationTooltipWrapper.classList.add('below-button');
            } else {
                annotationTooltip.style.bottom = '10px';
                annotationTooltipWrapper.classList.remove('below-button');

                if (annotationTooltip.style.left === '0px') {
                    annotationTooltip.style.bottom = '5px';
                }
            }
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', freedomScripts);
} else {
    freedomScripts();
}
