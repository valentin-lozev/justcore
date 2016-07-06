function getModules() {
    var result = [];
    var modules = document.querySelectorAll('#container [data-module]');
    for (var i = 0, len = modules.length; i < len; i++) {
        result.push(modules[i].dataset.module);
    }

    return result;
}

function handleRoute(templateName) {
    getModules().forEach(function (moduleId) { App.stop(moduleId); });
    document.getElementById('container').innerHTML = Templates[templateName]();
    getModules().forEach(function (moduleId) { App.start(moduleId); });
}

var App = spaMVP.createAppCore()
    .defaultUrl('/')
    .registerRoute('/', function (routeParams) {
        handleRoute('home');
    })
    .registerRoute('/products', function (routeParams) {
        handleRoute('products');
    })
    .registerRoute('/products/{id}', function (routeParams) {
        handleRoute('product');
        this.publish('route-params-changed', routeParams);
    })
    .run(function () {
        console.log('app is running...');
    });

// TODO: add namespace
// TODO: add enum for all events
// TODO: modules builder
// TODO: services builder