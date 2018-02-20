import { guard, uid } from "../utils";

interface SubscribersMap {
	[messageType: string]: {
		[subscriptionId: number]: jc.MessageHandler;
	};
}

/**
 *  Encapsulates communication behavior of the core.
 */
export class MessageBus {

	private _subscribers: SubscribersMap = Object.create(null);

	onMessage(type: string, handler: jc.MessageHandler): jc.Unsubscribe {
		guard
			.nonEmptyString(type, "m20")
			.function(handler, "m21", type);

		return this._addSubscriber(type, handler);
	}

	publishAsync<T extends jc.Message>(message: T): void {
		guard.true(typeof message === "object", "m22");

		if (!(message.type in this._subscribers)) {
			return;
		}

		const subscriptions = this._subscribers[message.type];
		Object.keys(subscriptions).forEach(id => {
			this._publishSingle(message, subscriptions[id]);
		});
	}

	private _publishSingle(message: jc.Message, handler: jc.MessageHandler): void {
		setTimeout(() => {
			try {
				handler(message);
			} catch (err) {
				console.error(`publishAsync(): Receive "${message.type}" message failed.`);
				console.error(err);
			}
		}, 0);
	}

	private _addSubscriber(type: string, handler: jc.MessageHandler): jc.Unsubscribe {
		if (!(type in this._subscribers)) {
			this._subscribers[type] = Object.create(null);
		}

		const subscriptionId = uid();
		this._subscribers[type][subscriptionId] = handler;

		return () => {
			this._subscribers[type][subscriptionId] = null;
			delete this._subscribers[type][subscriptionId];
		};
	}
}