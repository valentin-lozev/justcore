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
	const messages = this.messages;
	if (!Array.isArray(messages) || messages.length === 0) {
		return;
	}

	guard.function(
		this.handleMessage,
		"handleMessage method must be implemented in order to subscribe to given messages");

	this.handleMessage = this.handleMessage.bind(this);
	const dcore = this.sandbox._extensionsOnlyCore;
	this.sandbox.unsubscribers = messages.reduce(
		(map, message) => {
			map[message] = dcore.onMessage(message, this.handleMessage);
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