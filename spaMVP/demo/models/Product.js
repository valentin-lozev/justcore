var Product = Product || spaMVP.Model.subclass(function () {

    function Product(id, name, imgSource) {
        Product.BaseClass.call(this);

        this.id = id;
        this.name = name;
        this.price = id;
        this.imgSource = imgSource;
    }

    return Product;

});