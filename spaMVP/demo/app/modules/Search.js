function handleSearch() {
    var query = this.input.value;
    if (query) {
        this.sandbox.publish('perform-search', query);
    }
}
function resetSearch() {
    this.input.value = "";
    this.sandbox.publish('reset-search', null);
}
var Search = (function () {
    function Search(sb) {
        this.sandbox = sb;
    }
    Search.prototype.init = function () {
        this.input = document.getElementById('search_input');
        this.button = document.getElementById('search_button');
        this.reset = document.getElementById('reset_search');
        this.button.addEventListener('click', handleSearch.bind(this));
        this.reset.addEventListener('click', resetSearch.bind(this));
    };
    Search.prototype.destroy = function () {
        // remove listeners
    };
    return Search;
}());
//# sourceMappingURL=Search.js.map