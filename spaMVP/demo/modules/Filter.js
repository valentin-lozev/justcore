var Filter = Filter || (function () {

    /**
     *  @type {spaMVP.Sandbox}
     */
    var sandbox = null;

    function filterProducts(ev) {
        sandbox.publish('change-filter', ev.currentTarget.innerHTML);
    }

    function Filter(sb) {
        sandbox = sb;
    }

    Filter.prototype.init = function () {
        var filters = document.querySelectorAll('div[data-module="FilterModule"] ul li > a');
        for (var i = 0; i < filters.length; i++) {
            filters[i].addEventListener('click', filterProducts); 
        }
    };

    Filter.prototype.destroy = function () {
        // remove listeners
    };

    return Filter;

}());

App.register('FilterModule', function (sb) {
    return new Filter(sb);
});