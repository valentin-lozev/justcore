/// <reference path="/scripts/jasmine.js" />
/// <reference path="../../spamvp/src/core.js" />
/// <reference path="../../spamvp/src/sandbox/sandbox.js" />

describe('Sandbox', function () {
    var core = null,
        runningModules = {},
        singletonModuleId = 'singleton',
        singletonModuleInitCount = 0,
        multipleModuleId = 'multiple',
        secondInstanceId = '2ndInstanceModule',
        thirdInstanceId = '3rdInstanceModule';

    beforeAll(function () {
        core = new spaMVP._private.Core();
    });

    it('should have validation on module registration', function () {
        var moduleId = 'testModule';
        var tests = [
            function nullCreator() { core.register(moduleId, null); },
            function stringCreator() { core.register(moduleId, 'invalid factory'); },
            function numberCreator() { core.register(moduleId, 3); },
            function emptyId() { core.register('', function () { }); },
            function nullId() { core.register(null, function () { }); },
            function withoutInit() {
                core.register(moduleId, function (sb) {
                    return {
                        destroy: function () { }
                    };
                });
            },
            function withoutDestroy() {
                core.register(moduleId, function (sb) {
                    return {
                        init: function () { }
                    };
                });
            }
        ];

        tests.forEach(function (test) {
            expect(test).toThrow();
        });
    });

    it('should be able to register modules', function () {
        function registerSingleton() {
            core.register(singletonModuleId, function (sb) {
                return {
                    init: function (options) {
                        runningModules[singletonModuleId] = sb instanceof spaMVP.Sandbox && typeof options === 'object' && singletonModuleId === sb.moduleInstanceId;
                        singletonModuleInitCount++;
                    },
                    destroy: function () { delete runningModules[singletonModuleId]; }
                };
            });        
        }

        function registerMultiple() {
            core.register(multipleModuleId, function (sb) {
                return {
                    init: function (options) {
                        this.id = options.instanceId || multipleModuleId;
                        runningModules[this.id] = sb instanceof spaMVP.Sandbox && typeof this.id === 'string' && this.id === sb.moduleInstanceId;
                    },
                    destroy: function () { delete runningModules[this.id]; }
                };
            });        
        }

        expect(registerSingleton).not.toThrow();
        expect(registerMultiple).not.toThrow();

        // already registered validation
        expect(registerSingleton).toThrow();
        expect(registerMultiple).toThrow();
    });

    it('should be able to start single module instance', function () {
        core.start(singletonModuleId);
        expect(runningModules[singletonModuleId]).toBeTruthy();
    });

    it('should be able to start multiple module instances', function () {
        core.start(multipleModuleId)
            .start(multipleModuleId, { instanceId: secondInstanceId })
            .start(multipleModuleId, { instanceId: thirdInstanceId });

        expect(runningModules[multipleModuleId]).toBeTruthy();
        expect(runningModules[secondInstanceId]).toBeTruthy();
        expect(runningModules[thirdInstanceId]).toBeTruthy();
    });

    it('should have validation on module start', function () {
        var tests = [
            function notFound() { core.start('missing'); },
            function invalidOptions() { core.start(singletonModuleId, 3); },
        ];

        tests.forEach(function (test) {
            expect(test).toThrow();
        });
    });

    it('should not throw error if start already running module', function () {
        var tests = [
            function attempt1() { core.start(singletonModuleId); },
            function attempt2() { core.start(singletonModuleId); },
            function attempt3() { core.start(singletonModuleId); },
            function attempt4() { core.start(singletonModuleId); },
        ];

        tests.forEach(function (test) {
            expect(test).not.toThrow();
        });
        expect(singletonModuleInitCount).toEqual(1);
    });

    it('should stops modules', function () {
        var startedModulesCount = Object.keys(runningModules).length;

        expect(startedModulesCount).toEqual(4);

        core.stop(singletonModuleId)
            .stop(multipleModuleId)
            .stop(multipleModuleId, secondInstanceId)
            .stop(multipleModuleId, thirdInstanceId);
        startedModulesCount = Object.keys(runningModules).length;

        expect(startedModulesCount).toEqual(0);
    });
});