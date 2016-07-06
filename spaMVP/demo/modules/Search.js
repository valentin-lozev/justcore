var Search = Search || (function () {

    /**
     *  @type {spaMVP.Sandbox}
     */
    var sandbox = null;

    function handleSearch() {
        var query = this.input.value;
        if (query) {
            sandbox.publish('perform-search', query);
        }
    }

    function resetSearch() {
        this.input.value = "";
        sandbox.publish('reset-search', null);
    }

    function Search(sb) {
        sandbox = sb;
        this.input = null;
        this.button = null;
        this.reset = null;
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
        this.input = this.button = this.reset = null;
    };

    return Search;

}());

App.register('SearchModule', function (sb) {
    return new Search(sb);
});