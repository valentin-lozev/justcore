function filterProducts(ev) {
    this.sandbox.publish('change-filter', ev.currentTarget.innerHTML);
}

class Filter implements spaMVP.Module {
    sandbox: spaMVP.Sandbox;
    constructor(sb) {
        this.sandbox = sb;
    }

    init() {
        let filters = document.querySelectorAll('div[data-module="Filter"] ul li > a');
        for (let i = 0; i < filters.length; i++) {
            filters[i].addEventListener('click', filterProducts.bind(this));
        }
    }

    destroy() {
        // remove listeners
    }
}