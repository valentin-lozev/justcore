var ProductsPresenter = ProductsPresenter || spaMVP.Presenter.subclass(function () {
    var sandbox = null;

    function ProductsPresenter(view, sb) {
        ProductsPresenter.BaseClass.call(this, view);
        sandbox = sb;
    }

    ProductsPresenter.prototype.onModelChange = function (ev) {
        ev.addedTargets.forEach(function (product) {
            this.getView().addProduct(product);
        }, this);
    };

    ProductsPresenter.prototype.handleMessage = function (type, data) {
        switch (type) {
            case 'change-filter': this.changeFilter(data); break;
            case 'perform-search': this.search(data); break;
            case 'reset-search': this.getView().reset(); break;
        }
    };

    ProductsPresenter.prototype.changeFilter = function (name) {
        this.getView()
            .reset()
            .filter(name);
    };

    ProductsPresenter.prototype.search = function (query) {
        this.getView()
            .reset()
            .search(query);
    };

    ProductsPresenter.prototype.addToCart = function (product) {
        sandbox.publish('add-item', product);
    };

    return ProductsPresenter;

});