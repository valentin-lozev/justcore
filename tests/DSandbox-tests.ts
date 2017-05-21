/// <reference path="../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("DSandbox", () => {

    const MODULE_ID = "testModule";

    function getOne(core: DCore, moduleId: string = MODULE_ID, moduleInstanceId: string = MODULE_ID): DSandbox {
        return new core.Sandbox(core, moduleId, moduleInstanceId);
    }

    it("should throw if core or module id are missing", () => {
        let core = dcore.createOne();

        expect(() => new core.Sandbox(null, MODULE_ID, MODULE_ID)).toThrow();
        expect(() => new core.Sandbox(core, null, MODULE_ID)).toThrow();
        expect(() => new core.Sandbox(core, MODULE_ID, null)).toThrow();
    });

    it("should know which module it is serving for", () => {
        let sb = getOne(dcore.createOne());

        expect(sb.moduleId).toEqual(MODULE_ID);
        expect(sb.moduleInstanceId).toEqual(MODULE_ID);
    });

    it("should subscribe by delegating to its core", () => {
        let core = dcore.createOne();
        spyOn(core, "subscribe");
        let sb = getOne(core);
        let topics = ["on", "off"];
        let handler = (topic: string, data: any) => true;

        sb.subscribe(topics, handler);

        expect(core.subscribe).toHaveBeenCalledWith(topics, handler);
    });

    it("should publish by delegating to its core", () => {
        let core = dcore.createOne();
        spyOn(core, "publish");
        let sb = getOne(core);
        let type = "on";
        let data = 8;

        sb.publish(type, data);

        expect(core.publish).toHaveBeenCalledWith(type, data);
    });

    it("should start a module by delegating to its core", () => {
        let core = dcore.createOne();
        spyOn(core, "start");
        let sb = getOne(core);
        let moduleId = "test-module";
        let options = { isTest: true };

        sb.start(moduleId, options);

        expect(core.start).toHaveBeenCalledWith(moduleId, options);
    });

    it("should stop a module by delegating to its core", () => {
        let core = dcore.createOne();
        spyOn(core, "stop");
        let sb = getOne(core);
        let moduleId = "test-module";
        let instanceId = "instanceID";

        sb.stop(moduleId, instanceId);

        expect(core.stop).toHaveBeenCalledWith(moduleId, instanceId);
    });
});