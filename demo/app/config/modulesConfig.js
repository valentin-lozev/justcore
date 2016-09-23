function registerModules(app) {
    app.register('Filter', function (sb) { return new Filter(sb); })
        .register('ProductPanel', function (sb) { return new ProductPanel(sb); })
        .register('Search', function (sb) { return new Search(sb); })
        .register('ShoppingCart', function (sb) { return new ShoppingCart(sb); });
}
var modulesConfig = {
    register: registerModules
};
//# sourceMappingURL=modulesConfig.js.map