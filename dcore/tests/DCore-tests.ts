/// <reference path="../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("DCore", () => {

    function getModule(sb: DSandbox): DModule {
        return {
            init: (options?: Object): void => undefined,
            destroy: (): void => undefined
        };
    }

    describe("Initialization", () => {
        it("should be in debug mode by default", () => {
            expect(dcore.createOne().state.isDebug).toBeTruthy();
        });

        it("should not be in running mode by default", () => {
            expect(dcore.createOne().state.isRunning).toBeFalsy();
        });

        it("should throw when run plugins before it is being started", () => {
            expect(() => dcore.createOne().subscribe(["topic"], function (): void { return; }))
                .toThrow();
        });

        it("should be in running mode after run", () => {
            expect(dcore.createOne().run().state.isRunning).toBeTruthy();
        });

        it("should execute an action on DOMContentLoaded", () => {
            let spy = { action: function (): void { return; } };
            spyOn(spy, "action");

            dcore.createOne().run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));

            expect(spy.action).toHaveBeenCalled();
        });

        it("should not run again when is already being started", () => {
            let core = dcore.createOne();
            let spy = { action: function (): void { return; } };
            spyOn(spy, "action");

            core.run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));
            core.run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));

            expect(spy.action).toHaveBeenCalledTimes(1);
        });

        it("should initialize with default sandbox type when such is not provided", () => {
            expect(dcore.createOne().Sandbox).toBeDefined();
        });

        it("should initialize with custom sandbox type when such is provided", () => {
            class CustomSandbox implements DSandbox {

                constructor(public core: DCore, public moduleId: string, public moduleInstanceId: string) {
                }

                subscribe(topics: string[], handler: (topic: string, data: any) => void): DSubscriptionToken {
                    return { destroy: (topic?: string): void => undefined };
                }

                publish(topic: string, data: any): this {
                    return this;
                }

                start(moduleId: string, options?: Object): this {
                    return this;
                }

                stop(moduleId: string, instanceId?: string): this {
                    return this;
                }
            }

            expect(dcore.createOne(CustomSandbox).Sandbox).toBe(CustomSandbox);
        });
    });

    describe("Modules", () => {
        it("should havent any registered modules by default", () => {
            let modules = dcore.createOne().listModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });

        it("should have validation when register", () => {
            let core = dcore.createOne();
            let validId = "testModule";
            let tests = [
                function emptyString(): void { core.register("", getModule); },
                function nullString(): void { core.register(null, getModule); },
                function undefinedString(): void { core.register(undefined, getModule); },
                function nullCreator(): void { core.register(validId, null); },
                function undefinedCreator(): void { core.register(validId, undefined); }
            ];

            tests.forEach(test => expect(test).toThrow());
        });

        it("should register a module", () => {
            let id = "testModule";

            let modules = dcore.createOne()
                .run()
                .register(id, getModule)
                .listModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });

        it("should throw if when module not found", () => {
            expect(() => dcore.createOne().start("test")).toThrow();
        });

        it("should throw when register an already registered module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";

            core.register(id, getModule);

            expect(() => core.register(id, getModule)).toThrow();
            let modules = core.listModules();
            expect(modules.length).toEqual(1);
        });

        it("should start a module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "init");

            let modules = core
                .register(id, (sb: DSandbox): DModule => module)
                .start(id)
                .listModules();

            expect(modules[0]).toEqual(id);
            expect(module.init).toHaveBeenCalledWith({});
        });

        it("should start a module with options", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "init");

            let options = { count: 5 };
            core.register(id, (sb: DSandbox): DModule => module)
                .start(id, options);

            expect(module.init).toHaveBeenCalledWith(options);
        });

        it("should not start an already started module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "init");

            core.register(id, (sb: DSandbox): DModule => module)
                .start(id)
                .start(id);

            expect(module.init).toHaveBeenCalledTimes(1);
        });

        // TODO: Sandbox tests for moduleId and moduleInstanceId

        it("should start a module with another instance", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "init");

            core.register(id, (sb: DSandbox): DModule => module)
                .start(id)
                .start(id, { instanceId: "test2" });

            expect(module.init).toHaveBeenCalledTimes(2);
        });

        it("should give sandbox that has same moduleId and moduleInstanceId when start a single instance module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let actualSandbox: DSandbox;

            core
                .register(id, (sb: DSandbox): DModule => {
                    actualSandbox = sb;
                    return getModule(sb);
                })
                .start(id);

            expect(actualSandbox).toBeDefined();
            expect(actualSandbox.moduleId).toEqual(id);
            expect(actualSandbox.moduleInstanceId).toEqual(id);
        });

        it("should give sandbox that has different moduleId and moduleInstanceId when start a given instance of a module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let instanceId = "testModuleInstance";
            let actualSandbox: DSandbox;

            core
                .register(id, (sb: DSandbox): DModule => {
                    actualSandbox = sb;
                    return getModule(sb);
                })
                .start(id, { instanceId: instanceId });

            expect(actualSandbox).toBeDefined();
            expect(actualSandbox.moduleId).toEqual(id);
            expect(actualSandbox.moduleInstanceId).toEqual(instanceId);
        });

        it("should not throw when stop not started module", () => {
            expect(() => dcore.createOne().stop("")).not.toThrow();
        });

        it("should stop a module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "destroy");

            core.register(id, (sb: DSandbox): DModule => module)
                .start(id)
                .stop(id);

            expect(module.destroy).toHaveBeenCalledTimes(1);
        });

        it("should stop a module having multiple instances", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "destroy");

            core.register(id, (sb: DSandbox): DModule => module)
                .start(id)
                .start(id, { instanceId: "another" })
                .stop(id)
                .stop(id, "another");

            expect(module.destroy).toHaveBeenCalledTimes(2);
        });
    });

    describe("Communication", () => {
        it("should add subscriber", (done: DoneFn) => {
            let core = dcore.createOne().run();
            let subscriber = {
                onPublish: (data?: any): void => undefined
            };
            spyOn(subscriber, "onPublish");
            let topics = ["change", "destroy"];

            core.subscribe(topics, subscriber.onPublish);

            topics.forEach(topic => core.publish(topic, 1));
            setTimeout(() => {
                expect(subscriber.onPublish).toHaveBeenCalledTimes(2);
                expect(subscriber.onPublish).toHaveBeenCalledWith(topics[0], 1);
                expect(subscriber.onPublish).toHaveBeenCalledWith(topics[1], 1);
                done();
            }, 100);
        });

        it("should remove subscriber", () => {
            let core = dcore.createOne().run();
            let subscriber = {
                onPublish: (data?: any): void => undefined
            };
            spyOn(subscriber, "onPublish");
            let topics = ["change", "destroy"];

            let token = core.subscribe(topics, subscriber.onPublish);
            token.destroy();
            topics.forEach(topic => core.publish(topic, 1));

            expect(subscriber.onPublish).not.toHaveBeenCalled();
        });

        it("should remove subscriber per topic", (done: DoneFn) => {
            let core = dcore.createOne().run();
            let subscriber = {
                onPublish: (data?: any): void => undefined
            };
            spyOn(subscriber, "onPublish");
            let topics = ["change", "destroy"];

            let token = core.subscribe(topics, subscriber.onPublish);
            token.destroy("change");
            topics.forEach(topic => core.publish(topic, 1));
            setTimeout(() => {
                expect(subscriber.onPublish).toHaveBeenCalledTimes(1);
                expect(subscriber.onPublish).toHaveBeenCalledWith("destroy", 1);
                done();
            }, 100);
        });
    });

    describe("Hooks", () => {
        it("should throw when hook with null type", () => {
            let hook = () => {
                dcore.createOne().hook(null, (): boolean => { return true; });
            };

            expect(hook).toThrow();
        });

        it("should throw when hook with null plugin", () => {
            let hook = () => {
                dcore.createOne().hook(dcore.HOOK_DOM_READY, null);
            };

            expect(hook).toThrow();
        });

        it("should run plugin when hook into DOMReady", () => {
            let mock = jasmine.createSpyObj("mock", ["plugin"]);

            dcore.createOne()
                .hook(dcore.HOOK_DOM_READY, mock.plugin)
                .run();
            document.dispatchEvent(new Event("DOMContentLoaded"));

            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });

        it("should run plugin when hook into module destroy", () => {
            let moduleID = "module";
            let core = dcore.createOne().run();
            let module = getModule(new core.Sandbox(core, moduleID, moduleID));
            let mock = jasmine.createSpyObj("mock", ["plugin"]);

            core.register(moduleID, (sb: DSandbox): DModule => module)
                .hook(dcore.HOOK_MODULE_DESTROY, mock.plugin)
                .start(moduleID)
                .stop(moduleID);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, undefined);
        });

        it("should run plugin when hook into module init", () => {
            let moduleID = "module";
            let core = dcore.createOne().run();
            let module = getModule(new core.Sandbox(core, moduleID, moduleID));
            let spy = {
                plugin: function (): boolean {
                    return true;
                }
            };
            spyOn(spy, "plugin").and.returnValue(true);

            core.register(moduleID, (sb: DSandbox): DModule => module)
                .hook(dcore.HOOK_MODULE_INITIALIZE, spy.plugin)
                .start(moduleID)
                .start(moduleID);

            expect(spy.plugin).toHaveBeenCalledTimes(1);
            expect(spy.plugin).toHaveBeenCalledWith(moduleID, {});
        });

        it("should run plugin when hook into module register", () => {
            let moduleID = "module";
            let core = dcore.createOne().run();
            let module = getModule(new core.Sandbox(core, moduleID, moduleID));
            let creator = (sb: DSandbox): DModule => module;
            let mock = jasmine.createSpyObj("mock", ["plugin"]);

            core.hook(dcore.HOOK_MODULE_REGISTER, mock.plugin)
                .register(moduleID, creator);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, creator);
        });

        it("should run plugin when hook into publish", () => {
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            let message = "hello";
            let type = "test";

            let core = dcore.createOne()
                .run()
                .hook(dcore.HOOK_MODULE_PUBLISH, mock.plugin);
            core.subscribe([type], () => { return; });
            core.publish(type, message);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(type, message);
        });

        it("should run plugin when hook into subscribe", () => {
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            let topic = "test";

            dcore.createOne()
                .run()
                .hook(dcore.HOOK_MODULE_SUBSCRIBE, mock.plugin)
                .subscribe([topic], () => { return; });

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith([topic]);
        });

        it("should run plugin when hook into unsubscribe", () => {
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            let topic = "test";

            let token = dcore.createOne()
                .run()
                .hook(dcore.HOOK_MODULE_UNSUBSCRIBE, mock.plugin)
                .subscribe([topic], () => { return; });
            token.destroy();

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(topic);
        });

        it("should not throw when plugin execution failed", () => {
            let mock = {
                plugin: (): boolean => { throw new Error(); }
            };
            spyOn(mock, "plugin").and.callThrough();

            let core = dcore.createOne()
                .run()
                .hook(dcore.HOOK_MODULE_SUBSCRIBE, mock.plugin);

            expect(() => core.subscribe(["test"], () => { return; })).not.toThrow();
            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });

        it("should stop pipeline when run stopper plugin", () => {
            let moduleID = "module";
            let core = dcore.createOne().run();
            let module = getModule(new core.Sandbox(core, moduleID, moduleID));
            let spy = {
                plugin1: function (): boolean { return false; },
                plugin2: function (): boolean { return true; },
                plugin3: function (): boolean { return true; },
            };
            spyOn(spy, "plugin1").and.returnValue(false);
            spyOn(spy, "plugin2").and.returnValue(true);
            spyOn(spy, "plugin3").and.returnValue(true);
            spyOn(module, "init");

            core.register(moduleID, (sb: DSandbox): DModule => module)
                .hook(dcore.HOOK_MODULE_INITIALIZE, spy.plugin1)
                .hook(dcore.HOOK_MODULE_INITIALIZE, spy.plugin2)
                .hook(dcore.HOOK_MODULE_INITIALIZE, spy.plugin3)
                .start(moduleID)
                .start(moduleID);

            expect(spy.plugin1).toHaveBeenCalledTimes(2);
            expect(spy.plugin2).not.toHaveBeenCalled();
            expect(spy.plugin3).not.toHaveBeenCalled();
            expect(module.init).not.toHaveBeenCalled();
        });
    });
});