var ProductPanel = ProductPanel || (function () {

    function handleMessage(type, message) {
        switch (type) {
            case 'change-filter': this.presenter.changeFilter(message); break;
            case 'perform-search': this.presenter.search(message); break;
            case 'reset-search': this.presenter.reset(); break;
        }
    }

    class ProductPanel {
        constructor(sb) {
            this.sandbox = sb;
            this.presenter = null;
            this.products = null;
        }

        init() {
            this.products = new spaMVP.Collection();
            this.presenter = new ProductsPresenter(new ProductsPanelView('div[data-module="ProductPanel"]'), this.sandbox);
            this.presenter.setModel(this.products);

            this.sandbox
                .getService('products')
                .getAll(result => this.products.addRange(result));

            this.sandbox.subscribe([
             'change-filter',
             'perform-search',
             'reset-search'
            ], handleMessage, this);
        }

        destroy() {
            this.sandbox.unsubscribe([
             'change-filter',
             'perform-search',
             'reset-search'
            ], handleMessage, this);
            this.presenter.destroy();
        }
    }

    return ProductPanel;

}());