var ShoppingCart = ShoppingCart || (function () {

    function addItem(type, product) {
        var entry = document.querySelector('#cart-' + product.id + ' .quantity');
        if (entry) {
            entry.innerHTML = (parseInt(entry.innerHTML, 10) + 1);
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

    class ShoppingCart {
        constructor(sb) {
            this.sandbox = sb;
            this.cart = null;
            this.items = {};
        }

        init() {
            this.cart = document.querySelector('div[data-module="ShoppingCart"] ul');
            this.items = {};
            this.sandbox.subscribe(['add-item'], addItem, this);
        }

        destroy() {
            this.sandbox.unsubscribe(['add-item'], addItem, this);
            // remove listeners
        }
    }

    return ShoppingCart;

}());