var Templates = Templates || {};
Templates.products = function () {
    return '<div>' +
                '<div data-module="SearchModule">' +
                    '<input id="search_input" type="text" placeholder="Search..."/>' +
                    '<button id="search_button">Search</button>' +
                    '<button id="reset_search">Reset</button>' +
                '</div>' +
                '<div data-module="FilterModule">' +
                    '<ul>' +
                        '<li><a>Red</a></li>' +
                        '<li><a>Blue</a></li>' +
                        '<li><a>Mobile</a></li>' +
                        '<li><a>Accessory</a></li>' +
                    '</ul>' +
                '</div>' +
                '<div data-module="ProductPanelModule"></div>' +
                '<div data-module="ShoppingCartModule">' +
                    '<ul></ul>' +
                '</div>' +
            '</div>';
};