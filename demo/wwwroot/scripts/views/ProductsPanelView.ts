class ProductsPanelView extends app.mvp.View {
    presenter: ProductsPresenter;

    constructor(presenter: ProductsPresenter, template?: (model: Product) => string) {
        super(document.createElement('ul'), template);

        this.presenter = presenter;
        this.map('click');
    }

    eachProduct(action) {
        let productElements = this.domNode.querySelectorAll('.product');
        for (let i = 0, len = productElements.length; i < len; i++) {
            action(productElements[i]);
        }
    }

    addProduct(product) {
        let productElement = document.createElement('div');
        productElement.innerHTML = templates.productItem(product);
        this.domNode.appendChild(productElement.firstElementChild);
        return this;
    }

    filter(name) {
        this.eachProduct(product => {
            if (name !== "ALL" && product.dataset.keyword.toLowerCase().indexOf(name.toLowerCase()) < 0) {
                product.style.opacity = '0.2';
            }
        });
        return this;
    }

    search(query: string) {
        query = query.toLowerCase();
        this.eachProduct(product => {
            if (product.getElementsByTagName('p')[0].innerHTML.toLowerCase().indexOf(query) < 0) {
                product.style.opacity = '0.2';
            }
        });
        return this;
    }

    reset() {
        this.eachProduct(product => product.style.opacity = '1');
        return this;
    }

    addToCart(dataset: any, target: Element, ev) {
        this.presenter.addToCart(parseInt(target.parentElement.id));
    }
}