function handleMessage(type, message) {
    switch (type) {
        case 'change-filter':
            this.presenter.changeFilter(message);
            break;
        case 'perform-search':
            this.presenter.search(message);
            break;
        case 'reset-search':
            this.presenter.reset();
            break;
    }
}
var ProductPanel = (function () {
    function ProductPanel(sb) {
        this.presenter = null;
        this.products = null;
        this.sandbox = sb;
    }
    ProductPanel.prototype.init = function () {
        var _this = this;
        this.products = new spaMVP.Collection();
        this.presenter = new ProductsPresenter(this.sandbox);
        this.presenter.view = new ProductsPanelView(this.presenter);
        this.presenter.model = this.products;
        document.querySelector('div[data-module="ProductPanel"]').appendChild(this.presenter.render());
        this.sandbox
            .getService('products')
            .getAll(function (result) { return _this.products.addRange(result); });
        this.sandbox.subscribe([
            'change-filter',
            'perform-search',
            'reset-search'
        ], handleMessage, this);
    };
    ProductPanel.prototype.destroy = function () {
        this.sandbox.unsubscribe([
            'change-filter',
            'perform-search',
            'reset-search'
        ], handleMessage, this);
        this.presenter.destroy();
    };
    return ProductPanel;
}());
//# sourceMappingURL=ProductPanel.js.map