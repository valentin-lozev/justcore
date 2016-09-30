let app = spaMVP.createCore();
app.useRouting();
app.useMVP();
app.useServices();
app.useConsoleLogging();

app.run(() => {

    app.routing
        .register('/', routeParams => onRouteChanged("home"))
        .register('/products', routeParams => onRouteChanged("products"))
        .register('/products/{id}', routeParams => {
            alert('Product ' + routeParams.id + ' is selected.');
        })
        .defaultUrl = "/";

    app.register('Filter', sb => new Filter(sb))
        .register('ProductPanel', sb => new ProductPanel(sb))
        .register('Search', sb => new Search(sb))
        .register('ShoppingCart', sb => new ShoppingCart(sb))
        .services.add<ProductsData>('products', () => new ProductsData());

    console.info('app is up and running...');
});

function onRouteChanged(page: string) {
    if (page === "home") {
        document.getElementById('container').innerHTML = "<h1>Welcome!</h1>";
        getModulesToStart().forEach(module => {
            let moduleId = module.getAttribute('data-module');
            app.stop(moduleId);
            module.style.display = "none";
        });
    }
    else if (page === "products") {
        document.getElementById('container').innerHTML = "";
        getModulesToStart().forEach(module => {
            let moduleId = module.getAttribute('data-module');
            app.start(moduleId);
            module.style.display = null;
        });
    }
}

function getModulesToStart(): HTMLElement[] {
    let result = [];
    let modules = document.querySelectorAll('[data-module]');
    for (let i = 0, len = modules.length; i < len; i++) {
        result.push(<HTMLElement>modules[i]);
    }

    return result;
}