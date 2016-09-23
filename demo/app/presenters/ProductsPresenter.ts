class ProductsPresenter extends spaMVP.Presenter<ProductsPanelView, spaMVP.Collection<Product>> {

    private sandbox: spaMVP.Sandbox;

    constructor(sb) {
        super();

        this.sandbox = sb;
        this.onModel(spaMVP.CollectionEvents.AddedItems, this.onProductsAdded);
    }

    changeFilter(name) {
        this.view
            .reset()
            .filter(name);
    }

    search(query) {
        this.view
            .reset()
            .search(query);
    }

    addToCart(id: number) {
        let product = this.model.toArray().filter(p => p.id === id)[0];
        if (product) {
            this.sandbox.publish('add-item', product);
        }
    }

    reset() {
        this.view.reset();
    }

    onProductsAdded(data: Product[]) {
        data.forEach(product => this.view.addProduct(product));
    }
}