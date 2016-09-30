namespace spaMVP {
    "use strict";

    export interface Core {
        useConsoleLogging(): void;
    }

    Core.prototype.useConsoleLogging = function (): void {
        let that = <Core>this;

        // if !debug -> return

        that.hook(spaMVP.HookType.SPA_ModuleInit, (moduleId) => {
            console.info(moduleId + " has been started.");
        });

        that.hook(spaMVP.HookType.SPA_ModuleDestroy, (moduleId) => {
            console.info(moduleId + " has been destroyed.");
        });
    };
}