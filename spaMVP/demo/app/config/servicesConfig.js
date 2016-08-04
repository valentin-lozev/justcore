(function (global) {

    function registerServices(app) {
        app.addService('products', sb => new ProductService(sb));
    }

    global.servicesConfig = { 
        register: registerServices 
    };

})(window);