var templates;
(function (templates) {
    function productsPage() {
        return '<div>' +
            '<div data-module="Search">' +
            '<input id="search_input" type="text" placeholder="Search..."/>' +
            '<button id="search_button">Search</button>' +
            '<button id="reset_search">Reset</button>' +
            '</div>' +
            '<div data-module="Filter">' +
            '<ul>' +
            '<li><a>Red</a></li>' +
            '<li><a>Blue</a></li>' +
            '<li><a>Mobile</a></li>' +
            '<li><a>Accessory</a></li>' +
            '</ul>' +
            '</div>' +
            '<div data-module="ProductPanel"></div>' +
            '<div data-module="ShoppingCart">' +
            '<ul></ul>' +
            '</div>' +
            '</div>';
    }
    templates.productsPage = productsPage;
    ;
})(templates || (templates = {}));
//# sourceMappingURL=productsPage.js.map