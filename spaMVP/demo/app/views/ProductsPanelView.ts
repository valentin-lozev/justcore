function eachProduct(action) {
    let productElements = this.domNode.querySelectorAll('ul > li');
    for (let i = 0, len = productElements.length; i < len; i++) {
        action(productElements[i]);
    }
}

class ProductsPanelView extends spaMVP.View {
    presenter: ProductsPresenter;

    constructor(presenter: ProductsPresenter, template?: (model: Product) => string) {
        super(document.createElement('ul'), template);
        this.presenter = presenter;
        this.map('click');
    }

    addProduct(product) {
        let productElement = document.createElement('div');
        productElement.innerHTML = templates.productItem(product);
        this.domNode.appendChild(productElement.firstElementChild);
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

    addToCart(dataset: any, target: Element, ev) {
        this.presenter.addToCart(parseInt(target.id));
    }
}