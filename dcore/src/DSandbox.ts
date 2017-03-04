interface DSandboxConstructor {
    new (core: DCore, moduleInstanceId: string): DSandbox;
}

interface DSandbox {
    moduleInstanceId: string;

    subscribe(topics: string[], handler: (topic: string, data: any) => void): DSubscriptionToken;
    publish(topic: string, data: any): this;

    start(moduleId: string, options?: Object): this;
    stop(moduleId: string, instanceId?: string): this;
}

namespace dcore {
    "use strict";

    /**
     *  @class Sandbox - Connects all modules to the outside world.
     *  @property {String} moduleInstanceId - Id of the module it serves for.
     */
    export class DefaultSandbox implements DSandbox {
        private core: DCore;
        public moduleInstanceId: string;

        constructor(core: DCore, moduleInstanceId: string) {
            if (!core || !moduleInstanceId) {
                throw new Error("DefaultSandbox: Missing core or module instance ID");
            }

            this.core = core;
            this.moduleInstanceId = moduleInstanceId;
        }

        /**
         *  Subscribes for given topics.
         *  @param {Array} topics Array of topics to subscribe for.
         *  @param {Function} handler The message handler.
         *  @returns {Object}
         */
        subscribe(topics: string[], handler: (topic: string, data: any) => void): DSubscriptionToken {
            return this.core.subscribe(topics, handler);
        }

        /**
         *  Publishes a message.
         *  @param {String} topic The topic of the message.
         *  @param {*} [data] Optional data.
         */
        publish(topic: string, data: any): this {
            this.core.publish(topic, data);
            return this;
        }

        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [options] Optional options.
         */
        start(moduleId: string, options?: Object): this {
            this.core.start(moduleId, options);
            return this;
        }

        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module which must be stopped.
         *  @param {string} [instanceId] Optional. Specific module's instance id.
         */
        stop(moduleId: string, instanceId?: string): this {
            this.core.stop(moduleId, instanceId);
            return this;
        }
    }
}