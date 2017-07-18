describe("DCore", () => {

    function getRunningCore(onStart?: Function): DCore {
        let isDebug = true;
        mockMediator = jasmine.createSpyObj("mockMediator", ["subscribe", "publish"]);
        let result = dcore.createOne(isDebug, mockMediator);
        result.run(onStart);
        return result;
    }

    function moduleFactory(sb: DSandbox): DModule<any> {
        mockModule.sb = sb;
        return mockModule;
    }

    const mockModule = {
        sb: <DSandbox>null,
        init: (options?: DModuleProps): void => undefined,
        destroy: (): void => undefined,
    };

    let mockMediator: DMediator;

    it("should be in debug mode by default", () => {
        expect(dcore.createOne().getState().isDebug).toBeTruthy();
    });

    it("should not be in running mode by default", () => {
        expect(dcore.createOne().getState().isRunning).toBeFalsy();
    });

    it("should be in running mode after run", () => {
        let core = getRunningCore();

        expect(core.getState().isRunning).toBeTruthy();
    });

    it("should be able to execute an action on DOMContentLoaded", () => {
        let spy = { action: function (): void { return; } };
        spyOn(spy, "action");
        let core = getRunningCore(spy.action);

        document.dispatchEvent(new Event("DOMContentLoaded"));

        expect(spy.action).toHaveBeenCalled();
    });

    it("should not run again when has already been started", () => {
        let spy = { action: function (): void { return; } };
        spyOn(spy, "action");
        let core = getRunningCore(spy.action);

        document.dispatchEvent(new Event("DOMContentLoaded"));
        core.run(spy.action);

        expect(spy.action).toHaveBeenCalledTimes(1);
    });

    it("should be initialized with default sandbox type", () => {
        expect(dcore.createOne().Sandbox).toBe(dcore._private.DefaultSandbox);
    });

    it("should be initialized with default mediator type", () => {
        let core = dcore.createOne();

        expect(() => core.publish("topic", "message")).not.toThrow();
        expect(() => core.subscribe(["topic"], function () { })).not.toThrow();
    });

    it("should return its state as immutable", () => {
        let core = getRunningCore();
        let state = core.getState();

        expect(state.isRunning).toBeTruthy();
        state.isRunning = false;

        expect(state.isRunning).toBeFalsy();
        expect(core.getState().isRunning).toBeTruthy();
    });

    it("should be able to update its state by merging the provided object", () => {
        let core = getRunningCore();
        let oldState = core.getState();
        let newPropName = "version";
        let update = {
            [newPropName]: 10
        };

        expect(oldState[newPropName]).toBeUndefined();
        core.setState(<any>update);
        let newState = core.getState();

        expect(newState[newPropName]).toEqual(update.version);
        expect(newState.isRunning).toEqual(oldState.isRunning);
        expect(newState.isDebug).toEqual(oldState.isDebug);
    });

    it("setState() should not be able to stop the core when it is already running", () => {
        let core = getRunningCore();
        let update = {
            isRunning: false
        };

        core.setState(<any>update);
        let newState = core.getState();

        expect(newState.isRunning).toBeTruthy();
    });

    it("setState() should not be able to change the debug mode after first initialization", () => {
        let core = getRunningCore();
        let update = {
            isDebug: false
        };

        core.setState(<any>update);
        let newState = core.getState();

        expect(newState.isDebug).toBeTruthy();
    });

    describe("Modules", () => {

        it("should haven't any registered modules by default", () => {
            let modules = dcore.createOne().listModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });

        it("should throw when register a module with invalid arguments", () => {
            let core = dcore.createOne();
            let validId = "testModule";
            let tests = [
                function emptyString(): void { core.register("", moduleFactory); },
                function nullString(): void { core.register(null, moduleFactory); },
                function undefinedString(): void { core.register(undefined, moduleFactory); },
                function nullCreator(): void { core.register(validId, null); },
                function undefinedCreator(): void { core.register(validId, undefined); }
            ];

            tests.forEach(test => expect(test).toThrow());
        });

        it("should be able to register a module", () => {
            let id = "testModule";
            let core = getRunningCore();

            core.register(id, moduleFactory);
            let modules = core.listModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });

        it("should throw when start not registered module", () => {
            expect(() => dcore.createOne().start("test")).toThrow();
        });

        it("should throw when register an already registered module", () => {
            let id = "testModule";
            let core = getRunningCore();

            core.register(id, moduleFactory);

            expect(() => core.register(id, moduleFactory)).toThrow();
            let modules = core.listModules();
            expect(modules.length).toEqual(1);
        });

        it("should be able to start a module", () => {
            let id = "testModule";
            let core = getRunningCore();
            core.register(id, moduleFactory);
            spyOn(mockModule, "init");

            core.start(id);
            let modules = core.listModules();

            expect(modules[0]).toEqual(id);
            expect(mockModule.init).toHaveBeenCalled();
        });

        it("should be able to start a module with properties", () => {
            let id = "testModule";
            let core = getRunningCore();
            core.register(id, moduleFactory);
            spyOn(mockModule, "init");

            let props = { count: 5 };
            core.start(id, props);

            expect(mockModule.init).toHaveBeenCalledWith(props);
        });

        it("should not start an already started module", () => {
            let id = "testModule";
            let core = getRunningCore();
            spyOn(mockModule, "init");
            core.register(id, moduleFactory);

            core.start(id)
            core.start(id);

            expect(mockModule.init).toHaveBeenCalledTimes(1);
        });

        it("should be able to start another module instance", () => {
            let id = "testModule";
            let core = getRunningCore();
            spyOn(mockModule, "init");
            core.register(id, moduleFactory);

            core.start(id);
            core.start(id, { instanceId: "test2" });

            expect(mockModule.init).toHaveBeenCalledTimes(2);
        });

        it("should provide a sandbox that has same moduleId and moduleInstanceId when start a single instance module", () => {
            let id = "testModule";
            let core = getRunningCore();
            core.register(id, moduleFactory);

            core.start(id);

            expect(mockModule.sb).toBeDefined();
            expect(mockModule.sb.getModuleId()).toEqual(id);
            expect(mockModule.sb.getModuleInstanceId()).toEqual(id);
        });

        it("should provide a sandbox that has different moduleId and moduleInstanceId when start a given instance of a module", () => {
            let id = "testModule";
            let instanceId = "test-instance";
            let core = getRunningCore();
            core.register(id, moduleFactory);

            core.start(id, { instanceId: instanceId });

            expect(mockModule.sb).toBeDefined();
            expect(mockModule.sb.getModuleId()).toEqual(id);
            expect(mockModule.sb.getModuleInstanceId()).toEqual(instanceId);
        });

        it("should not throw when stop not started module", () => {
            expect(() => dcore.createOne().stop("")).not.toThrow();
        });

        it("should be able to stop a module", () => {
            let id = "testModule";
            let core = getRunningCore();
            spyOn(mockModule, "destroy");
            core.register(id, moduleFactory);
            core.start(id);

            core.stop(id);

            expect(mockModule.destroy).toHaveBeenCalledTimes(1);
        });

        it("should be able to stop a given module instance", () => {
            let id = "testModule";
            let instanceId = "another";
            let core = getRunningCore()
            spyOn(mockModule, "destroy");
            core.register(id, moduleFactory);
            core.start(id);
            core.start(id, { instanceId: instanceId });

            core.stop(id);
            core.stop(id, instanceId);

            expect(mockModule.destroy).toHaveBeenCalledTimes(2);
        });
    });

    describe("Communication", () => {

        it("should delegate to its mediator when subscribe", () => {
            let topics = ["change", "destroy"];
            let subscriber = (data?: any): void => undefined;
            let core = getRunningCore();

            core.subscribe(topics, subscriber);

            expect(mockMediator.subscribe).toHaveBeenCalledTimes(1);
            expect(mockMediator.subscribe).toHaveBeenCalledWith(topics, subscriber);
        });

        it("should delegate to its mediator when publish", () => {
            let topic = "topic";
            let message = "message";
            let core = getRunningCore();

            core.publish(topic, message);

            expect(mockMediator.publish).toHaveBeenCalledTimes(1);
            expect(mockMediator.publish).toHaveBeenCalledWith(topic, message);
        });
    });
});