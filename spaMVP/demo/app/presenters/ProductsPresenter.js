var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ProductsPresenter = (function (_super) {
    __extends(ProductsPresenter, _super);
    function ProductsPresenter(sb) {
        _super.call(this);
        this.sandbox = sb;
        this.onModel(spaMVP.CollectionEvents.AddedItems, this.onProductsAdded);
    }
    ProductsPresenter.prototype.changeFilter = function (name) {
        this.view
            .reset()
            .filter(name);
    };
    ProductsPresenter.prototype.search = function (query) {
        this.view
            .reset()
            .search(query);
    };
    ProductsPresenter.prototype.addToCart = function (id) {
        var product = this.model.toArray().filter(function (p) { return p.id === id; })[0];
        if (product) {
            this.sandbox.publish('add-item', product);
        }
    };
    ProductsPresenter.prototype.reset = function () {
        this.view.reset();
    };
    ProductsPresenter.prototype.onProductsAdded = function (data) {
        var _this = this;
        data.forEach(function (product) { return _this.view.addProduct(product); });
    };
    return ProductsPresenter;
}(spaMVP.Presenter));
//# sourceMappingURL=ProductsPresenter.js.map