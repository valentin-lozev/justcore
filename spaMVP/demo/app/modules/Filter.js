var Filter = Filter || (function () {

    function filterProducts(ev) {
        this.sandbox.publish('change-filter', ev.currentTarget.innerHTML);
    }

    class Filter {
        constructor(sb) {
            this.sandbox = sb;
        }

        init() {
            var filters = document.querySelectorAll('div[data-module="Filter"] ul li > a');
            for (var i = 0; i < filters.length; i++) {
                filters[i].addEventListener('click', filterProducts.bind(this));
            }
        }

        destroy() {
            // remove listeners
        }
    }

    return Filter;

}());