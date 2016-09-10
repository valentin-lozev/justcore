function getModules() : Array<string> {
    let result = [];
    let modules = document.querySelectorAll('#container [data-module]');
    for (let i = 0, len = modules.length; i < len; i++) {
        result.push(modules[i].getAttribute('data-module'));
    }

    return result;
}

function onRouteChanged(templateName: string) {
    getModules().forEach(moduleId => App.stop(moduleId));

    document.getElementById('container').innerHTML = templates[templateName]();

    getModules().forEach(moduleId => App.start(moduleId));
}

let App = spaMVP.createAppCore()
    .defaultUrl('/')
    .registerRoute('/', routeParams => onRouteChanged('homePage'))
    .registerRoute('/products', routeParams => onRouteChanged('productsPage'))
    .registerRoute('/products/{id}', routeParams => alert('Product ' + routeParams.id + ' is selected.'))
    .run(function () {
        modulesConfig.register(this);
        servicesConfig.register(this);

        console.info('app is up and running...');
    });