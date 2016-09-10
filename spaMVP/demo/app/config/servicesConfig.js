function registerServices(app) {
    app.addService('products', function (sb) { return new ProductService(); });
}
var servicesConfig = {
    register: registerServices
};
//# sourceMappingURL=servicesConfig.js.map