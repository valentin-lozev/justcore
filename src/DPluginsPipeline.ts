namespace dcore._private {
    "use strict";

    interface PluginsMap {
        [hook: string]: DPlugin<any>[];
    }

    export class DPluginsPipeline {

        private pluginsMap: PluginsMap = {};

        hook<TResponse>(hookName: string, plugin: DPlugin<TResponse>): void {
            argumentGuard("hook(): ")
                .mustBeNonEmptyString(hookName, "hook name must be a non empty string")
                .mustBeFunction(plugin, "plugin must be a function");

            let list = this.pluginsMap[hookName];
            if (!list) {
                this.pluginsMap[hookName] = list = [];
            }

            list.push(plugin);
        }

        pipe<TResponse>(
            hookName: string,
            hookInvoker: (...args: any[]) => TResponse,
            hookContext: any,
            ...args: any[]): TResponse {

            argumentGuard("pipe(): ")
                .mustBeFunction(hookInvoker, "hook invoker must be a function");

            let pipeline = (this.pluginsMap[hookName] || [])
                .slice(0)
                .reduceRight(function (next, pipeline): () => TResponse {
                    return function (...args: any[]): TResponse {
                        return pipeline.apply(this, [next].concat(args));
                    };
                }, hookInvoker);

            const result = pipeline.apply(hookContext, args);
            pipeline = null;
            return result;
        }
    }
}