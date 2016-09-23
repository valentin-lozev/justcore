function addItem(type, product) {
    var entry = document.querySelector('#cart-' + product.id + ' .quantity');
    if (entry) {
        entry.innerHTML = (parseInt(entry.innerHTML) + 1).toString();
        this.items[product.id]++;
        return;
    }
    entry = document.createElement('li');
    entry.id = 'cart-' + product.id;
    entry.className = 'cart_entry';
    var name = document.createElement('span');
    name.className = 'product_name';
    name.textContent = product.name;
    var quantity = document.createElement('span');
    quantity.className = 'quantity';
    quantity.textContent = '1';
    var price = document.createElement('span');
    price.className = 'price';
    price.textContent = '$' + product.price.toFixed(2);
    entry.appendChild(name);
    entry.appendChild(quantity);
    entry.appendChild(price);
    this.cart.appendChild(entry);
    this.items[product.id] = 1;
}
var ShoppingCart = (function () {
    function ShoppingCart(sb) {
        this.cart = null;
        this.items = {};
        this.sandbox = sb;
    }
    ShoppingCart.prototype.init = function () {
        this.cart = document.querySelector('div[data-module="ShoppingCart"] ul');
        this.sandbox.subscribe(['add-item'], addItem, this);
    };
    ShoppingCart.prototype.destroy = function () {
        this.sandbox.unsubscribe(['add-item'], addItem, this);
        // remove listeners
    };
    return ShoppingCart;
}());
//# sourceMappingURL=ShoppingCart.js.map