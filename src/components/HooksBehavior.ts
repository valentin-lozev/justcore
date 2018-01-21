import { guard } from "../utils";

interface Plugin extends dcore.Func {
	(next: () => any, ...args: any[]): any;
}

/**
 *  Encapsulates hooks behavior that is private to dcore.
 */
export class HooksBehavior {

	private _plugins: { [hookType: string]: Plugin[]; } = Object.create(null);

	createHook<T extends dcore.Func>(type: dcore.HookType, method: T): T & dcore.Hook {
		guard
			.nonEmptyString(type, "m16")
			.function(method, "m17", type);

		const hookContext = this;
		const result = function (...args: any[]): any {
			const plugins = hookContext._plugins[type];
			if (!plugins) {
				return method.apply(this, args);
			}

			return plugins.reduceRight(
				(pipeline, plugin) => () => plugin.apply(this, [pipeline, ...args]),
				() => method.apply(this, args)
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