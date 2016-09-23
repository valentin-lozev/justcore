/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("Services", () => {

    function getCore(): spaMVP.Core {
        let result = new spaMVP.Core();
        result.useServices();
        return result;
    }

    it("should throw when add with invalid id", () => {
        let core = getCore();
        let validId = "testService";
        let validCreator = (): Object => { return {}; };
        let tests = [
            function emptyString(): void { core.services.add("", validCreator); },
            function nullString(): void { core.services.add(null, validCreator); },
            function undefinedString(): void { core.services.add(undefined, validCreator); },
            function nullCreator(): void { core.services.add(validId, null); }
        ];

        tests.forEach(test => {
            expect(test).toThrow();
        });
    });

    it("should throw when add service twice", () => {
        let core = getCore();
        let creator = (): Object => Object.create({});
        core.services.add("asd", creator);

        expect(() => core.services.add("asd", creator)).toThrow();
    });

    it("should throw when service not found", () => {
        let core = getCore();

        expect(() => core.services.get("")).toThrow();
    });

    it("should add service", () => {
        let core = getCore();
        let id = "testService";
        interface Service {
            id: string;
        }
        let creator = (): Service => { return { id: id }; };

        core.services.add(id, creator);

        let service = core.services.get<Service>(id);
        expect(service).toBeDefined();
        expect(service.id).toEqual(id);
    });

    it("should delegate to core when call from sandbox", () => {
        let core = getCore();
        let id = "testService";
        interface Service {
            id: string;
        }
        let creator = (): Service => { return { id: id }; };
        core.services.add(id, creator);
        let sandbox = new core.Sandbox(core, "module");

        let service = sandbox.getService<Service>(id);

        expect(service).toBeDefined();
        expect(service.id).toEqual(id);
    });
});