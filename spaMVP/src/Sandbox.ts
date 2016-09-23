namespace spaMVP {
    "use strict";

    export interface SandboxConstructor {
        new (core: Core, moduleInstanceId: string): Sandbox;
    }

    export interface Sandbox {
        moduleInstanceId: string;

        subscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: any): this;
        unsubscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: any): this;
        publish(type: string, data: any): this;

        start(moduleId: string, options?: Object): this;
        stop(moduleId: string, instanceId?: string): this;
    }

    /**
     *  @class Sandbox - Connects all modules to the outside world.
     *  @property {String} moduleInstanceId - Id of the module it serves for.
     */
    export class Sandbox implements Sandbox {
        private core: Core;

        constructor(core: Core, moduleInstanceId: string) {
            if (!core || !moduleInstanceId) {
                throw new Error("Missing core or module instance ID.");
            }

            this.core = core;
            this.moduleInstanceId = moduleInstanceId;
        }

        subscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: any): this {
            this.core.subscribe(eventTypes, handler, context);
            return this;
        }

        unsubscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: any): this {
            this.core.unsubscribe(eventTypes, handler, context);
            return this;
        }

        publish(eventType: string, data: any): this {
            this.core.publish(eventType, data);
            return this;
        }

        start(moduleId: string, options?: Object): this {
            this.core.start(moduleId, options);
            return this;
        }

        stop(moduleId: string, instanceId?: string): this {
            this.core.stop(moduleId, instanceId);
            return this;
        }
    }
}