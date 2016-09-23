var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Product = (function (_super) {
    __extends(Product, _super);
    function Product(id, name, imgSource) {
        _super.call(this);
        this.id = id;
        this.name = name;
        this.price = id;
        this.imgSource = imgSource;
    }
    Product.prototype.equals = function (other) {
        return other && this.id === other.id;
    };
    Product.prototype.hash = function () {
        return this.id;
    };
    return Product;
}(spaMVP.Model));
//# sourceMappingURL=Product.js.map