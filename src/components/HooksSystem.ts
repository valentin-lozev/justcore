import { guard } from "../utils";

interface Plugin extends dcore.Func {
	(next: () => any, ...args: any[]): any;
}

/**
 *  Encapsulates hooks behavior of dcore.
 */
export class HooksSystem {

	private _plugins: { [hookType: string]: Plugin[]; } = Object.create(null);

	createHook<T extends dcore.Func>(type: dcore.HookType, method: T, context?: any): T & dcore.Hook {
		guard
			.nonEmptyString(type, "m16")
			.function(method, "m17", type);

		const hooksContext = this;
		const result = function (...args: any[]): any {
			const plugins = hooksContext._plugins[type];
			if (!plugins) {
				return method.apply(context, args);
			}

			return plugins.reduceRight(
				(pipeline, plugin) => () => plugin.apply(context, [pipeline, ...args]),
				() => method.apply(context, args)
			)();
		} as T & dcore.Hook;

		result._withPipeline = true;
		result._hookType = type;
		return result;
	}

	addPlugin(hookType: dcore.HookType, plugin: Plugin): void {
		guard
			.nonEmptyString(hookType, "m18")
			.function(plugin, "m19", hookType);

		(this._plugins[hookType] || (this._plugins[hookType] = [])).push(plugin);
	}
}