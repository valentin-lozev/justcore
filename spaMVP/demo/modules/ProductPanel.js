var ProductPanel = ProductPanel || (function () {

    /**
     *  @type {spaMVP.Sandbox}
     */
    var sandbox = null,
        presenter = null,
        products = null;

    function ProductPanel(sb) {
        sandbox = sb;
    }

    ProductPanel.prototype.init = function () {
        products = new spaMVP.Collection();
        presenter = new ProductsPresenter(
            new ProductsPanelView('div[data-module="ProductPanelModule"]', Templates.productPanel),
            sandbox);
        presenter.setModel(products);

        sandbox
            .getService('products')
            .getAll(function (result) {
                products.addRange(result);
            });

        sandbox.subscribe([
         'change-filter',
         'perform-search',
         'reset-search'
        ], presenter.handleMessage, presenter);
    };

    ProductPanel.prototype.destroy = function () {
        sandbox.unsubscribe([
         'change-filter',
         'perform-search',
         'reset-search'
        ], presenter.handleMessage, presenter);
        presenter.destroy();
        products = null;
    };

    return ProductPanel;

}());

App.register('ProductPanelModule', function (sb) {
    return new ProductPanel(sb);
});