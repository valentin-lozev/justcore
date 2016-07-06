var ProductsPanelView = ProductsPanelView || spaMVP.View.subclass(function () {

    function eachProduct(action) {
        var productElements = this.domNode.querySelectorAll('ul > li');
        for (var i = 0, len = productElements.length; i < len; i++) {
            action(productElements[i]);
        }
    };

    function ProductsPanelView(id, template) {
        ProductsPanelView.BaseClass.call(this, id, template);
    }

    ProductsPanelView.prototype.mapEvents = function () {
        return [{ type: 'click' }];
    };

    ProductsPanelView.prototype.addProduct = function (product) {
        var productElement = document.createElement('div');
        productElement.innerHTML = Templates.productItem(product);
        this.domNode.querySelector('ul').appendChild(productElement.firstElementChild);
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
        var product = {
            id: target.id,
            name: dataset.keyword,
            price: parseInt(target.id)
        };
        this.getPresenter().addToCart(product);
    };

    return ProductsPanelView;
});