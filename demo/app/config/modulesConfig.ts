function registerModules(app) {
    app.register('Filter', sb => new Filter(sb))
        .register('ProductPanel', sb => new ProductPanel(sb))
        .register('Search', sb => new Search(sb))
        .register('ShoppingCart', sb => new ShoppingCart(sb));
}

let modulesConfig = {
    register: registerModules
};