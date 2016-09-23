/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
describe("Services", function () {
    function getCore() {
        var result = new spaMVP.Core();
        result.useServices();
        return result;
    }
    it("should throw when add with invalid id", function () {
        var core = getCore();
        var validId = "testService";
        var validCreator = function () { return {}; };
        var tests = [
            function emptyString() { core.services.add("", validCreator); },
            function nullString() { core.services.add(null, validCreator); },
            function undefinedString() { core.services.add(undefined, validCreator); },
            function nullCreator() { core.services.add(validId, null); }
        ];
        tests.forEach(function (test) {
            expect(test).toThrow();
        });
    });
    it("should throw when add service twice", function () {
        var core = getCore();
        var creator = function () { return Object.create({}); };
        core.services.add("asd", creator);
        expect(function () { return core.services.add("asd", creator); }).toThrow();
    });
    it("should throw when service not found", function () {
        var core = getCore();
        expect(function () { return core.services.get(""); }).toThrow();
    });
    it("should add service", function () {
        var core = getCore();
        var id = "testService";
        var creator = function () { return { id: id }; };
        core.services.add(id, creator);
        var service = core.services.get(id);
        expect(service).toBeDefined();
        expect(service.id).toEqual(id);
    });
    it("should delegate to core when call from sandbox", function () {
        var core = getCore();
        var id = "testService";
        var creator = function () { return { id: id }; };
        core.services.add(id, creator);
        var sandbox = new core.Sandbox(core, "module");
        var service = sandbox.getService(id);
        expect(service).toBeDefined();
        expect(service.id).toEqual(id);
    });
});
//# sourceMappingURL=services-tests.js.map