namespace spaMVP {

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

        subscribe(eventTypes: Array<string>, handler: (type: string, data: any) => void, context?: Object) {
            this.core.subscribe(eventTypes, handler, context);
        }

        unsubscribe(eventTypes: Array<string>, handler: (type: string, data: any) => void, context?: Object) {
            this.core.unsubscribe(eventTypes, handler, context);
        }

        publish(eventType: string, data: any) {
            this.core.publish(eventType, data);
        }

        getService(id: string) : any {
            return this.core.getService(id);
        }
    }
}