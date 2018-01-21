import { guard } from "../utils";

declare global {
	namespace dcore {
		interface Sandbox {
			unsubscribers?: UnsubscribersMap;
		}
	}
}

interface UnsubscribersMap {
	[message: string]: dcore.Unsubscribe;
}

function subscribe(this: dcore.Module): void {
	const dcore = this.sandbox._extensionsOnlyCore;
	const messages = typeof this.moduleWillSubscribe === "function"
		? dcore.createHook("onModuleSubscribe", this.moduleWillSubscribe).call(this)
		: null;
	const anyMessages = Array.isArray(messages) && messages.length >= 0;
	if (!anyMessages) {
		return;
	}

	guard.function(this.moduleDidReceiveMessage, "m23", this.sandbox.moduleId);

	const moduleDidReceiveMessage = dcore.createHook("onModuleReceiveMessage", this.moduleDidReceiveMessage.bind(this));
	this.sandbox.unsubscribers = messages.reduce(
		(map, message) => {
			map[message] = dcore.onMessage(message, moduleDidReceiveMessage);
			return map;
		},
		Object.create(null) as UnsubscribersMap);
}

function unsubscribe(this: dcore.Module): void {
	const unsubscribers = this.sandbox.unsubscribers;
	if (unsubscribers) {
		Object
			.keys(unsubscribers)
			.forEach(message => {
				unsubscribers[message]();
				unsubscribers[message] = null;
				delete unsubscribers[message];
			});
	}
}

export function moduleAutosubscribe(): dcore.Extension {
	return {
		name: "module-autosubscribe",
		install: () => ({
			onModuleInit: function (this: dcore.Module, next: dcore.Func<void>): void {
				next();
				subscribe.call(this);
			},

			onModuleDestroy: function (this: dcore.Module, next: dcore.Func<void>): void {
				unsubscribe.call(this);
				next();
			}
		})
	};
}