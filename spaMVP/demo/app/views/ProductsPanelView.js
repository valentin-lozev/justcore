var ProductsPanelView = (function () {

    function eachProduct(action) {
        var productElements = this.domNode.querySelectorAll('ul > li');
        for (var i = 0, len = productElements.length; i < len; i++) {
            action(productElements[i]);
        }
    }

    class ProductsPanelView extends spaMVP.View {
        constructor(id, template) {
            super(id, template)
        }

        mapEvents() {
            return [{ type: 'click' }];
        }

        addProduct(product) {
            var productElement = document.createElement('div');
            productElement.innerHTML = Templates.productItem(product);
            this.domNode.querySelector('ul').appendChild(productElement.firstElementChild);
            return this;
        }

        filter(name) {
            eachProduct.call(this, function (product) {
                if (product.dataset.keyword.toLowerCase().indexOf(name.toLowerCase()) < 0) {
                    product.style.opacity = '0.2';
                }
            });
            return this;
        }

        search(query) {
            query = query.toLowerCase();
            eachProduct.call(this, function (product) {
                if (product.getElementsByTagName('p')[0].innerHTML.toLowerCase().indexOf(query) < 0) {
                    product.style.opacity = '0.2';
                }
            });
            return this;
        }

        reset() {
            eachProduct.call(this, function (product) {
                product.style.opacity = '1';
            });
            return this;
        }

        addToCart(dataset, target, ev) {
            var product = {
                id: target.id,
                name: dataset.keyword,
                price: parseInt(target.id)
            };
            this.getPresenter().addToCart(product);
        }
    }

    return ProductsPanelView;
}());