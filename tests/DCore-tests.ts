interface DCoreTestsContext {
    mockModule: {
        sb: DSandbox;
        init(options?: DModuleProps): void;
        destroy(): void;
    };
    getRunningCore(onStart?: Function): DCore;
    moduleFactory(sb: DSandbox): DModule<any>;
}

describe("DCore", () => {

    beforeEach(function (this: DCoreTestsContext): void {
        this.mockModule = {
            sb: null,
            init: (options?: DModuleProps): void => undefined,
            destroy: (): void => undefined,
        };

        this.moduleFactory = (sb: DSandbox): DModule<any> => {
            this.mockModule.sb = sb;
            return this.mockModule;
        };

        this.getRunningCore = (onStart?: Function) => {
            let result = new dcore.Application();
            result.run(onStart);
            return result;
        };
    });

    it("should be in debug mode by default", function (this: DCoreTestsContext) {
        expect(new dcore.Application().getState().isDebug).toBeTruthy();
    });

    it("should not be in running mode by default", function (this: DCoreTestsContext) {
        expect(new dcore.Application().getState().isRunning).toBeFalsy();
    });

    it("should be in running mode after run", function (this: DCoreTestsContext) {
        let core = this.getRunningCore();

        expect(core.getState().isRunning).toBeTruthy();
    });

    it("should be able to execute an action on DOMContentLoaded", function (this: DCoreTestsContext) {
        let spy = { action: function (): void { return; } };
        spyOn(spy, "action");
        let core = this.getRunningCore(spy.action);

        document.dispatchEvent(new Event("DOMContentLoaded"));

        expect(spy.action).toHaveBeenCalled();
    });

    it("should not run again when has already been started", function (this: DCoreTestsContext) {
        let spy = { action: function (): void { return; } };
        spyOn(spy, "action");
        let core = this.getRunningCore(spy.action);

        document.dispatchEvent(new Event("DOMContentLoaded"));
        core.run(spy.action);

        expect(spy.action).toHaveBeenCalledTimes(1);
    });

    it("should be initialized with default sandbox type", function (this: DCoreTestsContext) {
        expect(new dcore.Application().Sandbox).toBe(dcore.Sandbox);
    });

    it("should be initialized with default messages aggregator type", function (this: DCoreTestsContext) {
        let core = new dcore.Application();

        expect(() => core.publish("topic", "message")).not.toThrow();
        expect(() => core.subscribe(["topic"], function () { })).not.toThrow();
    });

    it("should return its state as immutable", function (this: DCoreTestsContext) {
        let core = this.getRunningCore();
        let state = core.getState();

        expect(state.isRunning).toBeTruthy();
        Object.keys(state).forEach(key => {
            state[key] = false;
        });

        expect(state.isRunning).toBeFalsy();
        expect(core.getState().isRunning).toBeTruthy();
    });

    it("should be able to update its state by merging the provided object", function (this: DCoreTestsContext) {
        let core = this.getRunningCore();
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

    it("setState() should not be able to stop the core when it is already running", function (this: DCoreTestsContext) {
        let core = this.getRunningCore();
        let update = {
            isRunning: false
        };

        core.setState(<any>update);
        let newState = core.getState();

        expect(newState.isRunning).toBeTruthy();
    });

    it("setState() should not be able to change the debug mode after first initialization", function (this: DCoreTestsContext) {
        let core = this.getRunningCore();
        let update = {
            isDebug: false
        };

        core.setState(<any>update);
        let newState = core.getState();

        expect(newState.isDebug).toBeTruthy();
    });

    describe("Modules", () => {

        it("should haven't any registered modules by default", function (this: DCoreTestsContext) {
            let modules = new dcore.Application().listModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });

        it("should throw when register a module with invalid arguments", function (this: DCoreTestsContext) {
            let core = new dcore.Application();
            let validId = "testModule";
            let tests = [
                function emptyString(): void { core.register("", this.moduleFactory); },
                function nullString(): void { core.register(null, this.moduleFactory); },
                function undefinedString(): void { core.register(undefined, this.moduleFactory); },
                function nullCreator(): void { core.register(validId, null); },
                function undefinedCreator(): void { core.register(validId, undefined); }
            ];

            tests.forEach(test => expect(test).toThrow());
        });

        it("should be able to register a module", function (this: DCoreTestsContext) {
            let id = "testModule";
            let core = this.getRunningCore();

            core.register(id, this.moduleFactory);
            let modules = core.listModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });

        it("should throw when start not registered module", function (this: DCoreTestsContext) {
            expect(() => new dcore.Application().start("test")).toThrow();
        });

        it("should throw when register an already registered module", function (this: DCoreTestsContext) {
            let id = "testModule";
            let core = this.getRunningCore();

            core.register(id, this.moduleFactory);

            expect(() => core.register(id, this.moduleFactory)).toThrow();
            let modules = core.listModules();
            expect(modules.length).toEqual(1);
        });

        it("should be able to start a module", function (this: DCoreTestsContext) {
            let id = "testModule";
            let core = this.getRunningCore();
            core.register(id, this.moduleFactory);
            spyOn(this.mockModule, "init");

            core.start(id);
            let modules = core.listModules();

            expect(modules[0]).toEqual(id);
            expect(this.mockModule.init).toHaveBeenCalled();
        });

        it("should be able to start a module with properties", function (this: DCoreTestsContext) {
            let id = "testModule";
            let core = this.getRunningCore();
            core.register(id, this.moduleFactory);
            spyOn(this.mockModule, "init");

            let props = { count: 5 };
            core.start(id, props);

            expect(this.mockModule.init).toHaveBeenCalledWith(props);
        });

        it("should not start an already started module", function (this: DCoreTestsContext) {
            let id = "testModule";
            let core = this.getRunningCore();
            spyOn(this.mockModule, "init");
            core.register(id, this.moduleFactory);

            core.start(id)
            core.start(id);

            expect(this.mockModule.init).toHaveBeenCalledTimes(1);
        });

        it("should be able to start another module instance", function (this: DCoreTestsContext) {
            let id = "testModule";
            let core = this.getRunningCore();
            spyOn(this.mockModule, "init");
            core.register(id, this.moduleFactory);

            core.start(id);
            core.start(id, { instanceId: "test2" });

            expect(this.mockModule.init).toHaveBeenCalledTimes(2);
        });

        it("should provide a sandbox that has same moduleId and moduleInstanceId when start a single instance module", function (this: DCoreTestsContext) {
            let id = "testModule";
            let core = this.getRunningCore();
            core.register(id, this.moduleFactory);

            core.start(id);

            expect(this.mockModule.sb).toBeDefined();
            expect(this.mockModule.sb.getModuleId()).toEqual(id);
            expect(this.mockModule.sb.getModuleInstanceId()).toEqual(id);
        });

        it("should provide a sandbox that has different moduleId and moduleInstanceId when start a given instance of a module", function (this: DCoreTestsContext) {
            let id = "testModule";
            let instanceId = "test-instance";
            let core = this.getRunningCore();
            core.register(id, this.moduleFactory);

            core.start(id, { instanceId: instanceId });

            expect(this.mockModule.sb).toBeDefined();
            expect(this.mockModule.sb.getModuleId()).toEqual(id);
            expect(this.mockModule.sb.getModuleInstanceId()).toEqual(instanceId);
        });

        it("should not throw when stop not started module", function (this: DCoreTestsContext) {
            expect(() => new dcore.Application().stop("")).not.toThrow();
        });

        it("should be able to stop a module", function (this: DCoreTestsContext) {
            let id = "testModule";
            let core = this.getRunningCore();
            spyOn(this.mockModule, "destroy");
            core.register(id, this.moduleFactory);
            core.start(id);

            core.stop(id);

            expect(this.mockModule.destroy).toHaveBeenCalledTimes(1);
        });

        it("should be able to stop a given module instance", function (this: DCoreTestsContext) {
            let id = "testModule";
            let instanceId = "another";
            let core = this.getRunningCore()
            spyOn(this.mockModule, "destroy");
            core.register(id, this.moduleFactory);
            core.start(id);
            core.start(id, { instanceId: instanceId });

            core.stop(id);
            core.stop(id, instanceId);

            expect(this.mockModule.destroy).toHaveBeenCalledTimes(2);
        });
    });
});