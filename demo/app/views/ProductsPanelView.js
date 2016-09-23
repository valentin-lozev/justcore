var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function eachProduct(action) {
    var productElements = this.domNode.querySelectorAll('ul > li');
    for (var i = 0, len = productElements.length; i < len; i++) {
        action(productElements[i]);
    }
}
var ProductsPanelView = (function (_super) {
    __extends(ProductsPanelView, _super);
    function ProductsPanelView(presenter, template) {
        _super.call(this, document.createElement('ul'), template);
        this.presenter = presenter;
        this.map('click');
    }
    ProductsPanelView.prototype.addProduct = function (product) {
        var productElement = document.createElement('div');
        productElement.innerHTML = templates.productItem(product);
        this.domNode.appendChild(productElement.firstElementChild);
        return this;
    };
    ProductsPanelView.prototype.filter = function (name) {
        eachProduct.call(this, function (product) {
            if (product.dataset.keyword.toLowerCase().indexOf(name.toLowerCase()) < 0) {
                product.style.opacity = '0.2';
            }
        });
        return this;
    };
    ProductsPanelView.prototype.search = function (query) {
        query = query.toLowerCase();
        eachProduct.call(this, function (product) {
            if (product.getElementsByTagName('p')[0].innerHTML.toLowerCase().indexOf(query) < 0) {
                product.style.opacity = '0.2';
            }
        });
        return this;
    };
    ProductsPanelView.prototype.reset = function () {
        eachProduct.call(this, function (product) {
            product.style.opacity = '1';
        });
        return this;
    };
    ProductsPanelView.prototype.addToCart = function (dataset, target, ev) {
        this.presenter.addToCart(parseInt(target.id));
    };
    return ProductsPanelView;
}(spaMVP.View));
//# sourceMappingURL=ProductsPanelView.js.map