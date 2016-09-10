function filterProducts(ev) {
    this.sandbox.publish('change-filter', ev.currentTarget.innerHTML);
}
var Filter = (function () {
    function Filter(sb) {
        this.sandbox = sb;
    }
    Filter.prototype.init = function () {
        var filters = document.querySelectorAll('div[data-module="Filter"] ul li > a');
        for (var i = 0; i < filters.length; i++) {
            filters[i].addEventListener('click', filterProducts.bind(this));
        }
    };
    Filter.prototype.destroy = function () {
        // remove listeners
    };
    return Filter;
}());
//# sourceMappingURL=Filter.js.map