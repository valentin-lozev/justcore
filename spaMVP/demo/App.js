(function () {

    function getModules() {
        var result = [];
        var modules = document.querySelectorAll('#container [data-module]');
        for (var i = 0, len = modules.length; i < len; i++) {
            result.push(modules[i].dataset.module);
        }

        return result;
    }

    function onRouteChanged(templateName) {
        getModules().forEach(moduleId => App.stop(moduleId));

        document.getElementById('container').innerHTML = Templates[templateName]();

        getModules().forEach(moduleId => App.start(moduleId));
    }

    var App = spaMVP.createAppCore()
        .defaultUrl('/')
        .registerRoute('/', routeParams => onRouteChanged('homePage'))
        .registerRoute('/products', routeParams => onRouteChanged('productsPage'))
        .registerRoute('/products/{id}', routeParams => alert('Product ' + routeParams.id + ' is selected.'))
        .run(function () {
            modulesConfig.register(this);
            servicesConfig.register(this);

            console.log('app is running...');
        });
}());