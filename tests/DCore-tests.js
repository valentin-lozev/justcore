/// <reference path="../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
describe("DCore", function () {
    function getModule(sb) {
        return {
            init: function (options) { return undefined; },
            destroy: function () { return undefined; }
        };
    }
    describe("Initialization", function () {
        it("should be in debug mode by default", function () {
            expect(dcore.createOne().state.isDebug).toBeTruthy();
        });
        it("should not be in running mode by default", function () {
            expect(dcore.createOne().state.isRunning).toBeFalsy();
        });
        it("should throw when run plugins before it is being started", function () {
            expect(function () { return dcore.createOne().subscribe(["topic"], function () { return; }); })
                .toThrow();
        });
        it("should be in running mode after run", function () {
            expect(dcore.createOne().run().state.isRunning).toBeTruthy();
        });
        it("should execute an action on DOMContentLoaded", function () {
            var spy = { action: function () { return; } };
            spyOn(spy, "action");
            dcore.createOne().run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));
            expect(spy.action).toHaveBeenCalled();
        });
        it("should not run again when is already being started", function () {
            var core = dcore.createOne();
            var spy = { action: function () { return; } };
            spyOn(spy, "action");
            core.run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));
            core.run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));
            expect(spy.action).toHaveBeenCalledTimes(1);
        });
        it("should initialize with default sandbox type when such is not provided", function () {
            expect(dcore.createOne().Sandbox).toBeDefined();
        });
        it("should initialize with custom sandbox type when such is provided", function () {
            var CustomSandbox = (function () {
                function CustomSandbox(core, moduleId, moduleInstanceId) {
                    this.core = core;
                    this.moduleId = moduleId;
                    this.moduleInstanceId = moduleInstanceId;
                }
                CustomSandbox.prototype.subscribe = function (topics, handler) {
                    return { destroy: function (topic) { return undefined; } };
                };
                CustomSandbox.prototype.publish = function (topic, data) {
                    return this;
                };
                CustomSandbox.prototype.start = function (moduleId, options) {
                    return this;
                };
                CustomSandbox.prototype.stop = function (moduleId, instanceId) {
                    return this;
                };
                return CustomSandbox;
            }());
            expect(dcore.createOne(CustomSandbox).Sandbox).toBe(CustomSandbox);
        });
    });
    describe("Modules", function () {
        it("should havent any registered modules by default", function () {
            var modules = dcore.createOne().listModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });
        it("should have validation when register", function () {
            var core = dcore.createOne();
            var validId = "testModule";
            var tests = [
                function emptyString() { core.register("", getModule); },
                function nullString() { core.register(null, getModule); },
                function undefinedString() { core.register(undefined, getModule); },
                function nullCreator() { core.register(validId, null); },
                function undefinedCreator() { core.register(validId, undefined); }
            ];
            tests.forEach(function (test) { return expect(test).toThrow(); });
        });
        it("should register a module", function () {
            var id = "testModule";
            var modules = dcore.createOne()
                .run()
                .register(id, getModule)
                .listModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });
        it("should throw if when module not found", function () {
            expect(function () { return dcore.createOne().start("test"); }).toThrow();
        });
        it("should throw when register an already registered module", function () {
            var core = dcore.createOne().run();
            var id = "testModule";
            core.register(id, getModule);
            expect(function () { return core.register(id, getModule); }).toThrow();
            var modules = core.listModules();
            expect(modules.length).toEqual(1);
        });
        it("should start a module", function () {
            var core = dcore.createOne().run();
            var id = "testModule";
            var module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "init");
            var modules = core
                .register(id, function (sb) { return module; })
                .start(id)
                .listModules();
            expect(modules[0]).toEqual(id);
            expect(module.init).toHaveBeenCalledWith({});
        });
        it("should start a module with options", function () {
            var core = dcore.createOne().run();
            var id = "testModule";
            var module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "init");
            var options = { count: 5 };
            core.register(id, function (sb) { return module; })
                .start(id, options);
            expect(module.init).toHaveBeenCalledWith(options);
        });
        it("should not start an already started module", function () {
            var core = dcore.createOne().run();
            var id = "testModule";
            var module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "init");
            core.register(id, function (sb) { return module; })
                .start(id)
                .start(id);
            expect(module.init).toHaveBeenCalledTimes(1);
        });
        // TODO: Sandbox tests for moduleId and moduleInstanceId
        it("should start a module with another instance", function () {
            var core = dcore.createOne().run();
            var id = "testModule";
            var module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "init");
            core.register(id, function (sb) { return module; })
                .start(id)
                .start(id, { instanceId: "test2" });
            expect(module.init).toHaveBeenCalledTimes(2);
        });
        it("should give sandbox that has same moduleId and moduleInstanceId when start a single instance module", function () {
            var core = dcore.createOne().run();
            var id = "testModule";
            var actualSandbox;
            core
                .register(id, function (sb) {
                actualSandbox = sb;
                return getModule(sb);
            })
                .start(id);
            expect(actualSandbox).toBeDefined();
            expect(actualSandbox.moduleId).toEqual(id);
            expect(actualSandbox.moduleInstanceId).toEqual(id);
        });
        it("should give sandbox that has different moduleId and moduleInstanceId when start a given instance of a module", function () {
            var core = dcore.createOne().run();
            var id = "testModule";
            var instanceId = "testModuleInstance";
            var actualSandbox;
            core
                .register(id, function (sb) {
                actualSandbox = sb;
                return getModule(sb);
            })
                .start(id, { instanceId: instanceId });
            expect(actualSandbox).toBeDefined();
            expect(actualSandbox.moduleId).toEqual(id);
            expect(actualSandbox.moduleInstanceId).toEqual(instanceId);
        });
        it("should not throw when stop not started module", function () {
            expect(function () { return dcore.createOne().stop(""); }).not.toThrow();
        });
        it("should stop a module", function () {
            var core = dcore.createOne().run();
            var id = "testModule";
            var module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "destroy");
            core.register(id, function (sb) { return module; })
                .start(id)
                .stop(id);
            expect(module.destroy).toHaveBeenCalledTimes(1);
        });
        it("should stop a module having multiple instances", function () {
            var core = dcore.createOne().run();
            var id = "testModule";
            var module = getModule(new core.Sandbox(core, id, id));
            spyOn(module, "destroy");
            core.register(id, function (sb) { return module; })
                .start(id)
                .start(id, { instanceId: "another" })
                .stop(id)
                .stop(id, "another");
            expect(module.destroy).toHaveBeenCalledTimes(2);
        });
    });
    describe("Communication", function () {
        it("should add subscriber", function (done) {
            var core = dcore.createOne().run();
            var subscriber = {
                onPublish: function (data) { return undefined; }
            };
            spyOn(subscriber, "onPublish");
            var topics = ["change", "destroy"];
            core.subscribe(topics, subscriber.onPublish);
            topics.forEach(function (topic) { return core.publish(topic, 1); });
            setTimeout(function () {
                expect(subscriber.onPublish).toHaveBeenCalledTimes(2);
                expect(subscriber.onPublish).toHaveBeenCalledWith(topics[0], 1);
                expect(subscriber.onPublish).toHaveBeenCalledWith(topics[1], 1);
                done();
            }, 100);
        });
        it("should remove subscriber", function () {
            var core = dcore.createOne().run();
            var subscriber = {
                onPublish: function (data) { return undefined; }
            };
            spyOn(subscriber, "onPublish");
            var topics = ["change", "destroy"];
            var token = core.subscribe(topics, subscriber.onPublish);
            token.destroy();
            topics.forEach(function (topic) { return core.publish(topic, 1); });
            expect(subscriber.onPublish).not.toHaveBeenCalled();
        });
        it("should remove subscriber per topic", function (done) {
            var core = dcore.createOne().run();
            var subscriber = {
                onPublish: function (data) { return undefined; }
            };
            spyOn(subscriber, "onPublish");
            var topics = ["change", "destroy"];
            var token = core.subscribe(topics, subscriber.onPublish);
            token.destroy("change");
            topics.forEach(function (topic) { return core.publish(topic, 1); });
            setTimeout(function () {
                expect(subscriber.onPublish).toHaveBeenCalledTimes(1);
                expect(subscriber.onPublish).toHaveBeenCalledWith("destroy", 1);
                done();
            }, 100);
        });
    });
    describe("Hooks", function () {
        it("should throw when hook with null type", function () {
            var hook = function () {
                dcore.createOne().hook(null, function () { return true; });
            };
            expect(hook).toThrow();
        });
        it("should throw when hook with null plugin", function () {
            var hook = function () {
                dcore.createOne().hook(dcore.HOOK_DOM_READY, null);
            };
            expect(hook).toThrow();
        });
        it("should run plugin when hook into DOMReady", function () {
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            dcore.createOne()
                .hook(dcore.HOOK_DOM_READY, mock.plugin)
                .run();
            document.dispatchEvent(new Event("DOMContentLoaded"));
            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });
        it("should run plugin when hook into module destroy", function () {
            var moduleID = "module";
            var core = dcore.createOne().run();
            var module = getModule(new core.Sandbox(core, moduleID, moduleID));
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.register(moduleID, function (sb) { return module; })
                .hook(dcore.HOOK_MODULE_DESTROY, mock.plugin)
                .start(moduleID)
                .stop(moduleID);
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, undefined);
        });
        it("should run plugin when hook into module init", function () {
            var moduleID = "module";
            var core = dcore.createOne().run();
            var module = getModule(new core.Sandbox(core, moduleID, moduleID));
            var spy = {
                plugin: function () {
                    return true;
                }
            };
            spyOn(spy, "plugin").and.returnValue(true);
            core.register(moduleID, function (sb) { return module; })
                .hook(dcore.HOOK_MODULE_INITIALIZE, spy.plugin)
                .start(moduleID)
                .start(moduleID);
            expect(spy.plugin).toHaveBeenCalledTimes(1);
            expect(spy.plugin).toHaveBeenCalledWith(moduleID, {});
        });
        it("should run plugin when hook into module register", function () {
            var moduleID = "module";
            var core = dcore.createOne().run();
            var module = getModule(new core.Sandbox(core, moduleID, moduleID));
            var creator = function (sb) { return module; };
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(dcore.HOOK_MODULE_REGISTER, mock.plugin)
                .register(moduleID, creator);
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, creator);
        });
        it("should run plugin when hook into publish", function () {
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            var message = "hello";
            var type = "test";
            var core = dcore.createOne()
                .run()
                .hook(dcore.HOOK_MODULE_PUBLISH, mock.plugin);
            core.subscribe([type], function () { return; });
            core.publish(type, message);
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(type, message);
        });
        it("should run plugin when hook into subscribe", function () {
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            var topic = "test";
            dcore.createOne()
                .run()
                .hook(dcore.HOOK_MODULE_SUBSCRIBE, mock.plugin)
                .subscribe([topic], function () { return; });
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith([topic]);
        });
        it("should run plugin when hook into unsubscribe", function () {
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            var topic = "test";
            var token = dcore.createOne()
                .run()
                .hook(dcore.HOOK_MODULE_UNSUBSCRIBE, mock.plugin)
                .subscribe([topic], function () { return; });
            token.destroy();
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(topic);
        });
        it("should not throw when plugin execution failed", function () {
            var mock = {
                plugin: function () { throw new Error(); }
            };
            spyOn(mock, "plugin").and.callThrough();
            var core = dcore.createOne()
                .run()
                .hook(dcore.HOOK_MODULE_SUBSCRIBE, mock.plugin);
            expect(function () { return core.subscribe(["test"], function () { return; }); }).not.toThrow();
            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });
        it("should stop pipeline when run stopper plugin", function () {
            var moduleID = "module";
            var core = dcore.createOne().run();
            var module = getModule(new core.Sandbox(core, moduleID, moduleID));
            var spy = {
                plugin1: function () { return false; },
                plugin2: function () { return true; },
                plugin3: function () { return true; },
            };
            spyOn(spy, "plugin1").and.returnValue(false);
            spyOn(spy, "plugin2").and.returnValue(true);
            spyOn(spy, "plugin3").and.returnValue(true);
            spyOn(module, "init");
            core.register(moduleID, function (sb) { return module; })
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
//# sourceMappingURL=DCore-tests.js.map