namespace spaMVP {
    "use strict";

    /**
     *  @class Sandbox - Connects all modules to the outside world.
     *  @property {String} moduleInstanceId - Id of the module it serves for.
     */
    export class Sandbox {
        private core: Core;
        public moduleInstanceId: string;

        constructor(core: Core, moduleInstanceId: string) {
            if (!core || !moduleInstanceId) {
                throw new Error("Missing core or module instance ID");
            }

            this.core = core;
            this.moduleInstanceId = moduleInstanceId;
        }

        subscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: Object): void {
            this.core.subscribe(eventTypes, handler, context);
        }

        unsubscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: Object): void {
            this.core.unsubscribe(eventTypes, handler, context);
        }

        publish(eventType: string, data: any): void {
            this.core.publish(eventType, data);
        }

        getService<T>(id: string): T {
            return this.core.getService<T>(id);
        }
    }
}