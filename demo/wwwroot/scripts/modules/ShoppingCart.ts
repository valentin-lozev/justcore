interface ShoppingCartItemList {
    [id: string]: number;
}

class ShoppingCart implements spaMVP.Module {
    sandbox: spaMVP.Sandbox;
    cart: HTMLElement;
    items: ShoppingCartItemList = {};

    constructor(sb) {
        this.sandbox = sb;
    }

    init() {
        this.cart = <HTMLElement>document.querySelector(`div[data-module="${this.sandbox.moduleInstanceId}"] ul`);
        this.sandbox.subscribe(['add-item'], this.addItem, this);
    }

    destroy() {
        this.sandbox.unsubscribe(['add-item'], this.addItem, this);
        this.cart.innerHTML = "";
        this.cart = null;
    }

    addItem(type: string, product: Product) {
        let entry = document.querySelector('#cart-' + product.id + ' .quantity');
        if (entry) {
            entry.innerHTML = (parseInt(entry.innerHTML) + 1).toString();
            this.items[product.id]++;
            return;
        }

        entry = document.createElement('li');
        entry.id = 'cart-' + product.id;
        entry.className = 'cart_entry';

        let name = document.createElement('span');
        name.className = 'product_name';
        name.textContent = product.name;
        let quantity = document.createElement('span');
        quantity.className = 'quantity';
        quantity.textContent = '1';
        let price = document.createElement('span');
        price.className = 'price';
        price.textContent = '$' + product.price.toFixed(2);

        entry.appendChild(name);
        entry.appendChild(quantity);
        entry.appendChild(price);
        this.cart.appendChild(entry);

        this.items[product.id] = 1;
    }
}