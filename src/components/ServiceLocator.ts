import { guard, hasOwnProperty } from "../utils";

export class ServiceLocator implements jc.ServiceLocator {

    private readonly container: Record<string, { instance: any; factory: () => any; }>;
    private instantiationsStack: string[];

    constructor() {
        this.container = Object.create(null);
        this.instantiationsStack = [];
    }

    public addService<S>(key: string, factory: () => S): void {
        guard.nonEmptyString(key, "m24")
            .false(hasOwnProperty.call(this.container, key), "m25", key)
            .function(factory, "m26", key);

        this.container[key] = {
            factory: factory,
            instance: null
        };
    }

    public getService<S>(key: string): S {
        const serviceData = this.container[key];
        guard.true(!!serviceData, "m27", key);

        if (serviceData.instance) {
            return serviceData.instance;
        }

        if (this.isServiceBeingInstantiated(key)) {
            throw new Error(`getService(): service circular dependency ${this.instantiationsStack.join(" -> ")} -> ${key}`);
        }

        this.instantiationsStack.push(key);

        try {
            serviceData.instance = serviceData.factory();
        } finally {
            this.instantiationsStack.pop();
        }

        return serviceData.instance;
    }

    private isServiceBeingInstantiated(key: string): boolean {
        return this.instantiationsStack.indexOf(key) > -1;
    }
}