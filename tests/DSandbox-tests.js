/// <reference path="../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
describe("DSandbox", function () {
    var MODULE_ID = "testModule";
    function getOne(core, moduleId, moduleInstanceId) {
        if (moduleId === void 0) { moduleId = MODULE_ID; }
        if (moduleInstanceId === void 0) { moduleInstanceId = MODULE_ID; }
        return new core.Sandbox(core, moduleId, moduleInstanceId);
    }
    it("should throw if core or module id are missing", function () {
        var core = dcore.createOne();
        expect(function () { return new core.Sandbox(null, MODULE_ID, MODULE_ID); }).toThrow();
        expect(function () { return new core.Sandbox(core, null, MODULE_ID); }).toThrow();
        expect(function () { return new core.Sandbox(core, MODULE_ID, null); }).toThrow();
    });
    it("should know which module it is serving for", function () {
        var sb = getOne(dcore.createOne());
        expect(sb.moduleId).toEqual(MODULE_ID);
        expect(sb.moduleInstanceId).toEqual(MODULE_ID);
    });
    it("should subscribe by delegating to its core", function () {
        var core = dcore.createOne();
        spyOn(core, "subscribe");
        var sb = getOne(core);
        var topics = ["on", "off"];
        var handler = function (topic, data) { return true; };
        sb.subscribe(topics, handler);
        expect(core.subscribe).toHaveBeenCalledWith(topics, handler);
    });
    it("should publish by delegating to its core", function () {
        var core = dcore.createOne();
        spyOn(core, "publish");
        var sb = getOne(core);
        var type = "on";
        var data = 8;
        sb.publish(type, data);
        expect(core.publish).toHaveBeenCalledWith(type, data);
    });
    it("should start a module by delegating to its core", function () {
        var core = dcore.createOne();
        spyOn(core, "start");
        var sb = getOne(core);
        var moduleId = "test-module";
        var options = { isTest: true };
        sb.start(moduleId, options);
        expect(core.start).toHaveBeenCalledWith(moduleId, options);
    });
    it("should stop a module by delegating to its core", function () {
        var core = dcore.createOne();
        spyOn(core, "stop");
        var sb = getOne(core);
        var moduleId = "test-module";
        var instanceId = "instanceID";
        sb.stop(moduleId, instanceId);
        expect(core.stop).toHaveBeenCalledWith(moduleId, instanceId);
    });
});
//# sourceMappingURL=DSandbox-tests.js.map