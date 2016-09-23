class ProductPanel implements spaMVP.Module {
    sandbox: spaMVP.Sandbox;
    presenter: ProductsPresenter = null;
    products: ProductList = null;
    subscriptions: string[] = [
        'change-filter',
        'perform-search',
        'reset-search',
    ];

    constructor(sb) {
        this.sandbox = sb;
    }

    init() {
        this.products = new ProductList();
        this.presenter = new ProductsPresenter(this.sandbox);
        this.presenter.view = new ProductsPanelView(this.presenter);
        this.presenter.model = this.products;
        document.querySelector('div[data-module="ProductPanel"]').appendChild(this.presenter.render());

        this.sandbox
            .getService<ProductsData>('products')
            .getAll(result => this.products.addRange(result));

        this.sandbox.subscribe(this.subscriptions, this.handleMessage, this);
    }

    destroy() {
        this.sandbox.unsubscribe(this.subscriptions, this.handleMessage, this);
        this.presenter.destroy();
    }

    handleMessage(type: string, message: any) {
        switch (type) {
            case 'change-filter': this.presenter.changeFilter(message); break;
            case 'perform-search': this.presenter.search(message); break;
            case 'reset-search': this.presenter.reset(); break;
        }
    }
}