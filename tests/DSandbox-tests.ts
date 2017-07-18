describe("DSandbox", () => {

    const MODULE_ID = "testModule";

    function getOne(core: DCore, moduleId: string = MODULE_ID, moduleInstanceId: string = MODULE_ID): DSandbox {
        return new core.Sandbox(core, moduleId, moduleInstanceId);
    }

    it("should throw when created with invalid arguments", () => {
        let core = dcore.createOne();

        expect(() => new dcore._private.DefaultSandbox(null, MODULE_ID, MODULE_ID)).toThrow();
        expect(() => new dcore._private.DefaultSandbox(core, null, MODULE_ID)).toThrow();
        expect(() => new dcore._private.DefaultSandbox(core, MODULE_ID, null)).toThrow();
    });

    it("should know which module it is serving for", () => {
        let sb = getOne(dcore.createOne());

        expect(sb.getModuleId()).toEqual(MODULE_ID);
        expect(sb.getModuleInstanceId()).toEqual(MODULE_ID);
    });

    it("should subscribe by delegating a single topic to its core", () => {
        let core = dcore.createOne();
        spyOn(core, "subscribe");
        let sb = getOne(core);
        let topic = "on";
        let handler = (topic: string, data: any) => true;

        sb.subscribe(topic, handler);

        expect(core.subscribe).toHaveBeenCalledWith([topic], handler);
    });

    it("should be able to get its core's current state", () => {
        let core = dcore.createOne();
        spyOn(core, "getState");
        let sb = getOne(core);

        sb.getAppState();

        expect(core.getState).toHaveBeenCalledWith();
    });

    it("should be able to update its core's current state", () => {
        let core = dcore.createOne();
        spyOn(core, "setState");
        let sb = getOne(core);

        let newState = {};
        sb.setAppState(newState);

        expect(core.setState).toHaveBeenCalledWith(newState);
    });

    it("should subscribe by delegating array of topics to its core", () => {
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
        let topic = "on";
        let message = 8;

        sb.publish(topic, message);

        expect(core.publish).toHaveBeenCalledWith(topic, message);
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