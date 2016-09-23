function handleMessage(type, message) {
    switch (type) {
        case 'change-filter': this.presenter.changeFilter(message); break;
        case 'perform-search': this.presenter.search(message); break;
        case 'reset-search': this.presenter.reset(); break;
    }
}

class ProductPanel implements spaMVP.Module {
    sandbox: spaMVP.Sandbox;
    presenter: ProductsPresenter = null;
    products: spaMVP.Collection<Product> = null;

    constructor(sb) {
        this.sandbox = sb;
    }

    init() {
        this.products = new spaMVP.Collection<Product>();
        this.presenter = new ProductsPresenter(this.sandbox);
        this.presenter.view = new ProductsPanelView(this.presenter);
        this.presenter.model = this.products;
        document.querySelector('div[data-module="ProductPanel"]').appendChild(this.presenter.render());

        this.sandbox
            .getService<ProductService>('products')
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