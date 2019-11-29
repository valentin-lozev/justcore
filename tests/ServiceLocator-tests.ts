import { ServiceLocator } from "../src/components/ServiceLocator";

interface TestsContext {
    locator: jc.ServiceLocator;
}

describe("ServiceLocator", () => {

    beforeEach(function (this: TestsContext): void {
        this.locator = new ServiceLocator();
    });

    it("should throw when add service with invalid key", function (this: TestsContext): void {
        expect(() => this.locator.addService("", () => { return 1; })).toThrowError();
    });

    it("should throw when add with invalid service factory", function (this: TestsContext): void {
        expect(() => this.locator.addService("valid", null)).toThrowError();
    });

    it("should throw when add already added service", function (this: TestsContext): void {
        const service = function () { };
        const factory = () => service;

        this.locator.addService("service", factory);

        expect(() => this.locator.addService("service", factory)).toThrowError();
    });

    it("should throw when get not added service", function (this: TestsContext): void {
        expect(() => this.locator.getService("service")).toThrowError();
    });

    it("should throw when get service with circular dependencies", function (this: TestsContext): void {
        this.locator.addService("a", () => {
            this.locator.getService("b");
            return "a";
        });
        this.locator.addService("b", () => {
            this.locator.getService("a");
            return "b";
        });

        expect(() => this.locator.getService("a")).toThrowError("getService(): service circular dependency a -> b -> a");
        expect(() => this.locator.getService("b")).toThrowError("getService(): service circular dependency b -> a -> b");
    });

    it("should get service from its factory", function (this: TestsContext): void {
        const service = () => { };
        this.locator.addService("service", () => service);

        expect(this.locator.getService("service")).toBe(service);
    });

    it("should get service as singleton", function (this: TestsContext): void {
        this.locator.addService("service", () => ({ id: 1 }));

        const service = this.locator.getService("service");

        expect(service).toBe(this.locator.getService("service"));
    });
});