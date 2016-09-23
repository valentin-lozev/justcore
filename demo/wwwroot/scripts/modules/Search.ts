class Search implements spaMVP.Module {
    sandbox: spaMVP.Sandbox;
    domNode: HTMLElement;
    input: HTMLInputElement;

    constructor(sb: spaMVP.Sandbox) {
        this.sandbox = sb;
    }

    init() {
        this.domNode = <HTMLElement>document.querySelector(`div[data-module="${this.sandbox.moduleInstanceId}"]`);
        this.input = <HTMLInputElement>this.domNode.querySelector('#search_input');
        this.input.addEventListener('input', this.handleSearch.bind(this));
    }

    destroy() {
        this.domNode = this.input = null;
    }

    handleSearch() {
        let query = this.input.value;
        if (query) {
            this.sandbox.publish('perform-search', query);
        } else {
            this.sandbox.publish('reset-search', null);
        }
    }
}