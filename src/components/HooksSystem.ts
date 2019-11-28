import { guard } from "../utils";

interface Plugin extends jc.Func {
    (next: () => any, ...args: any[]): any;
}

export class HooksSystem {

    private _plugins: Record<string, Plugin[]> = Object.create(null);

    public createHook<T extends jc.Func>(type: jc.HookType, method: T, context?: any): T & jc.HookProps {
        guard
            .nonEmptyString(type, "m16")
            .function(method, "m17", type);

        const hooksContext = this;
        const result = function(...args: any[]): any {
            const plugins = hooksContext._plugins[type];
            if (!plugins) {
                return method.apply(context, args);
            }

            return plugins.reduceRight(
                (pipeline, plugin) => () => plugin.apply(context, [pipeline, ...args]),
                () => method.apply(context, args)
            )();
        } as T & jc.HookProps;

        result._withPipeline = true;
        result._hookType = type;
        return result;
    }

    public addPlugin(hookType: jc.HookType, plugin: Plugin): void {
        guard
            .nonEmptyString(hookType, "m18")
            .function(plugin, "m19", hookType);

        (this._plugins[hookType] || (this._plugins[hookType] = [])).push(plugin);
    }
}