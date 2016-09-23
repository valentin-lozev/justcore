function addItem(type, product) {
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

class ShoppingCart implements spaMVP.Module {
    sandbox: spaMVP.Sandbox;
    cart: Element = null;
    items: Object = {};

    constructor(sb) {
        this.sandbox = sb;
    }

    init() {
        this.cart = document.querySelector('div[data-module="ShoppingCart"] ul');
        this.sandbox.subscribe(['add-item'], addItem, this);
    }

    destroy() {
        this.sandbox.unsubscribe(['add-item'], addItem, this);
        // remove listeners
    }
}