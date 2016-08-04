class ProductsPresenter extends spaMVP.Presenter {
    constructor(view, sb) {
        super(view)
        this.sandbox = sb;
    }

    onModelChange(ev) {
        ev.addedTargets.forEach(function (product) {
            this.getView().addProduct(product);
        }, this);
    }

    changeFilter(name) {
        this.getView()
            .reset()
            .filter(name);
    }

    search(query) {
        this.getView()
            .reset()
            .search(query);
    }

    addToCart(product) {
        this.sandbox.publish('add-item', product);
    }

    reset() {
        this.getView().reset();
    }
}