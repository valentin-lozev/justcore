/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
describe("Sandbox", function () {
    var moduleID = "test";
    function getOne(core) {
        return new spaMVP.Sandbox(core, moduleID);
    }
    it("should throw if core or module id are missing", function () {
        expect(function () { return new spaMVP.Sandbox(null, ""); }).toThrow();
        expect(function () { return new spaMVP.Sandbox(new spaMVP.Core(), null); }).toThrow();
    });
    it("should know which module is serving for", function () {
        var sb = getOne(new spaMVP.Core());
        expect(sb.moduleInstanceId).toEqual(moduleID);
    });
    it("should subscribe by delegating to its core", function () {
        var core = new spaMVP.Core();
        spyOn(core, "subscribe");
        var sb = getOne(core);
        var types = ["on", "off"];
        var handler = function (type, data) { return true; };
        sb.subscribe(types, handler, {});
        expect(core.subscribe).toHaveBeenCalledWith(types, handler, {});
    });
    it("should unsubscribe by delegating to its core", function () {
        var core = new spaMVP.Core();
        spyOn(core, "unsubscribe");
        var sb = getOne(core);
        var types = ["on", "off"];
        var handler = function (type, data) { return true; };
        sb.unsubscribe(types, handler, {});
        expect(core.unsubscribe).toHaveBeenCalledWith(types, handler, {});
    });
    it("should publish by delegating to its core", function () {
        var core = new spaMVP.Core();
        spyOn(core, "publish");
        var sb = getOne(core);
        var type = "on";
        var data = 8;
        sb.publish(type, data);
        expect(core.publish).toHaveBeenCalledWith(type, data);
    });
});
//# sourceMappingURL=Sandbox-tests.js.map