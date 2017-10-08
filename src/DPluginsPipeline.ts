namespace dcore._private {
  "use strict";

  interface PluginsMap {
    [hook: string]: DPlugin<any>[];
  }

  export class DPluginsPipeline {

    private pluginsMap: PluginsMap = {};

    /**
     *  Hooks a plugin to given hook name from dcore.hooks constants.
     */
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

    /**
     *  Runs all plugins for given hook as pipeline.
     *  It is useful when you want to provide hooks in your own plugin.
     */
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
          return function (): TResponse {
            return pipeline.apply(hookContext, [next].concat(args));
          };
        }, () => hookInvoker.apply(hookContext, args));

      const result = pipeline(null);
      pipeline = null;
      return result;
    }
  }
}