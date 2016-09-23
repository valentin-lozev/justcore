function registerServices(app) {
    app.addService('products', sb => new ProductService());
}

let servicesConfig = {
    register: registerServices
};