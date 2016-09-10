function getModules() {
    var result = [];
    var modules = document.querySelectorAll('#container [data-module]');
    for (var i = 0, len = modules.length; i < len; i++) {
        result.push(modules[i].getAttribute('data-module'));
    }
    return result;
}
function onRouteChanged(templateName) {
    getModules().forEach(function (moduleId) { return App.stop(moduleId); });
    document.getElementById('container').innerHTML = templates[templateName]();
    getModules().forEach(function (moduleId) { return App.start(moduleId); });
}
var App = spaMVP.createAppCore()
    .defaultUrl('/')
    .registerRoute('/', function (routeParams) { return onRouteChanged('homePage'); })
    .registerRoute('/products', function (routeParams) { return onRouteChanged('productsPage'); })
    .registerRoute('/products/{id}', function (routeParams) { return alert('Product ' + routeParams.id + ' is selected.'); })
    .run(function () {
    modulesConfig.register(this);
    servicesConfig.register(this);
    console.info('app is up and running...');
});
//# sourceMappingURL=app.js.map