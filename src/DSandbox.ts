namespace dcore.hooks {
    "use strict";

    export const SANDBOX_SUBSCRIBE = "sandbox.subscribe";
    export const SANDBOX_PUBLISH = "sandbox.publish";
    export const SANDBOX_START = "sandbox.start";
    export const SANDBOX_STOP = "sandbox.stop";
}

namespace dcore._private {
    "use strict";

    /**
     *  Connects the modules to the outside world. Facade of the core.
     */
    export class DefaultSandbox implements DSandbox {

        private core: DCore;
        private moduleId: string;
        private moduleInstanceId: string;

        constructor(core: DCore, moduleId: string, moduleInstanceId: string) {
            argumentGuard("DefaultSandbox: ")
                .mustBeDefined(core, "core must be provided")
                .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
                .mustBeNonEmptyString(moduleInstanceId, "module instance id must be a non empty string");

            this.core = core;
            this.moduleId = moduleId;
            this.moduleInstanceId = moduleInstanceId;
        }

        /**
         *  Gets the module id it serves for.
         */
        getModuleId(): string {
            return this.moduleId;
        }

        /**
         *  Gets the module instance id it serves for.
         */
        getModuleInstanceId(): string {
            return this.moduleInstanceId;
        }

        /**
         *  Gets application's current state.
         */
        getAppState(): Readonly<DCoreState> {
            return this.core.getState();
        }

        /**
         *  Update application's current state by merging the provided object to the current state.
         *  Also, "isRunning" and "isDebug" are being skipped.
         *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
         */
        setAppState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void {
            this.core.setState(value);
        }

        /**
         *  Subscribes for given topics.
         */
        subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
        subscribe(topics: any, handler: (topic: string, message: any) => void): DSubscriptionToken {
            return this.core.pipe(
                hooks.SANDBOX_SUBSCRIBE,
                this.__subscribe,
                this,
                Array.isArray(topics) ? topics : [topics], handler);
        }

        /**
         *  Publishes a message asynchronously.
         */
        publish(topic: string, message: any): void {
            this.core.pipe(
                hooks.SANDBOX_PUBLISH,
                this.__publish,
                this,
                topic, message);
        }

        /**
         *  Starts an instance of given module and initializes it.
         */
        start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            this.core.pipe(
                hooks.SANDBOX_START,
                this.__start,
                this,
                moduleId, props);
        }

        /**
         *  Stops a given module.
         */
        stop(moduleId: string, instanceId?: string): void {
            this.core.pipe(
                hooks.SANDBOX_STOP,
                this.__stop,
                this,
                moduleId, instanceId);
        }

        private __subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
            return this.core.subscribe(topics, handler);
        }

        private __publish(topic: string, message: any): void {
            this.core.publish(topic, message);
        }

        private __start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            this.core.start(moduleId, props);
        }

        private __stop(moduleId: string, instanceId?: string): void {
            this.core.stop(moduleId, instanceId);
        }
    }
}