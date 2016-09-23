class Filter implements spaMVP.Module {
    sandbox: spaMVP.Sandbox;
    domNode: HTMLElement;

    constructor(sb: spaMVP.Sandbox) {
        this.sandbox = sb;
    }

    init() {
        this.domNode = <HTMLElement>document.querySelector(`div[data-module="${this.sandbox.moduleInstanceId}"]`);
        let filters = this.domNode.querySelectorAll('div[data-module="Filter"] > button');
        for (let i = 0; i < filters.length; i++) {
            filters[i].addEventListener('click', this.filterProducts.bind(this));
        }
    }

    destroy() {
        this.domNode = null;
    }

    filterProducts(ev) {
        let current = <HTMLButtonElement>ev.currentTarget;
        this.sandbox.publish('change-filter', current.textContent);
    }
}