/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("Sandbox", () => {

    let moduleID = "test";

    function getOne(core: spaMVP.Core): spaMVP.Sandbox {
        return new spaMVP.Sandbox(core, moduleID);
    }

    it("should throw if core or module id are missing", () => {
        expect(() => new spaMVP.Sandbox(null, "")).toThrow();
        expect(() => new spaMVP.Sandbox(new spaMVP.Core(), null)).toThrow();
    });

    it("should know which module is serving for", () => {
        let sb = getOne(new spaMVP.Core());

        expect(sb.moduleInstanceId).toEqual(moduleID);
    });

    it("should subscribe by delegating to its core", () => {
        let core = new spaMVP.Core();
        spyOn(core, "subscribe");
        let sb = getOne(core);
        let types = ["on", "off"];
        let handler = (type: string, data: any) => true;

        sb.subscribe(types, handler, {});

        expect(core.subscribe).toHaveBeenCalledWith(types, handler, {});
    });

    it("should unsubscribe by delegating to its core", () => {
        let core = new spaMVP.Core();
        spyOn(core, "unsubscribe");
        let sb = getOne(core);
        let types = ["on", "off"];
        let handler = (type: string, data: any) => true;

        sb.unsubscribe(types, handler, {});

        expect(core.unsubscribe).toHaveBeenCalledWith(types, handler, {});
    });

    it("should publish by delegating to its core", () => {
        let core = new spaMVP.Core();
        spyOn(core, "publish");
        let sb = getOne(core);
        let type = "on";
        let data = 8;

        sb.publish(type, data);

        expect(core.publish).toHaveBeenCalledWith(type, data);
    });
});