// Save scroll before leaving page
window.addEventListener('beforeunload', function () {
    sessionStorage.setItem('globalScrollY', window.scrollY);
});

// Restore scroll after load
window.addEventListener('load', function () {
    const y = sessionStorage.getItem('globalScrollY');
    if (y !== null) {
        window.scrollTo(0, parseInt(y, 10));
        sessionStorage.removeItem('globalScrollY');
    }
});

const freedomScripts = () => {
    const body = document.body;
    const mainHeader = document.querySelector('.main-header');
    const mainHeaderTopBar = null;
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

    // AdvancedSearch / multi-select fix
    $(document).on('change', '#search-facets select.chosen-select', function (event) {
        event.stopImmediatePropagation();

        const facet = $(this);
        const selectValues = facet.val();

        const url = new URL(window.location.href);
        const selectName = facet.prop('name');

        const baseName = selectName.endsWith('[]')
            ? selectName.substring(0, selectName.length - 2)
            : selectName;

        // Remove old facet params
        Array.from(url.searchParams.keys()).forEach((key) => {
            if (
                key === baseName ||
                key === baseName + '[]' ||
                key.startsWith(baseName + '[')
            ) {
                url.searchParams.delete(key);
            }
        });

        // Re-add current values
        if (Array.isArray(selectValues)) {
            selectValues.forEach((value, index) => {
                url.searchParams.set(baseName + '[' + index + ']', value);
            });
        }
        saveScrollPosition();
        window.location.href = url.toString();
    });

    //for the search bar
    $(document).on('search', 'input[type="search"]', function () {
        const input = $(this);
        if (input.val() !== '') {
            return;
        }

        const form = input.closest('form');

        if (!form.length) {
            return;
        }

        saveScrollPosition();
        // Remove q parameter manually for clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete(input.attr('name') || 'q');
        url.searchParams.delete('page');
        window.location.href = url.toString();
    });

    //for firefox search clear button
    $(document).on('input', 'input[type="search"]', function () {
        const input = $(this);

        if (input.val() !== '') {
            return;
        }
        const form = input.closest('form');
        if (!form.length) {
            return;
        }
        saveScrollPosition();
        const url = new URL(window.location.href);
        url.searchParams.delete(input.attr('name') || 'q');
        url.searchParams.delete('page');
        window.location.href = url.toString();
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
        if (!mainHeader || !mainHeaderMainBar || !menuDrawer) {
            return;
        }

        const topBarHeight = mainHeaderTopBar ? mainHeaderTopBar.offsetHeight : 0;

        if (scrollPos > 60 && scrollDirection === 'down') {
            mainHeader.style.top = -userBarHeight + 'px';
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
