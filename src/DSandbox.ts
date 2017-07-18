namespace dcore._private {
    "use strict";

    /**
     *  @class DefaultSandbox - Connects the modules to the outside world.
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
         *  @returns {String}
         */
        getModuleId(): string {
            return this.moduleId;
        }

        /**
         *  Gets the module instance id it serves for.
         *  @returns {String}
         */
        getModuleInstanceId(): string {
            return this.moduleInstanceId;
        }

        /**
         *  Gets current application's state.
         */
        getAppState(): DCoreState {
            return this.core.getState();
        }

        /**
         *  Update current application's state by merging the provided object to the current state.
         *  Also, "isRunning" and "isDebug" are being skipped.
         *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
         */
        setAppState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void {
            this.core.setState(value);
        }

        /**
         *  Subscribes for given topics.
         *  @returns {Object}
         */
        subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
        subscribe(topics: any, handler: (topic: string, message: any) => void): DSubscriptionToken {
            topics = Array.isArray(topics) ? topics : [topics];
            return this.core.subscribe(topics, handler);
        }

        /**
         *  Publishes a message.
         *  @param {String} topic The topic of the message.
         *  @param {*} message The message.
         */
        publish(topic: string, message: any): void {
            this.core.publish(topic, message);
        }

        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [props] Optional. Module properties.
         */
        start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            this.core.start(moduleId, props);
        }

        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module which must be stopped.
         *  @param {string} [instanceId] Optional. Specific module's instance id.
         */
        stop(moduleId: string, instanceId?: string): void {
            this.core.stop(moduleId, instanceId);
        }
    }
}