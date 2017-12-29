import { guard, uid } from "../utils";

interface SubscribersMap {
	[messageType: string]: {
		[subscriptionId: number]: dcore.MessageHandler;
	};
}

/**
 *  Encapsulates communication behavior that is private to dcore.
 */
export class MessageBus {

	private _subscribers: SubscribersMap = Object.create(null);

	onMessage(messageType: string, handler: dcore.MessageHandler): dcore.Unsubscribe {
		guard
			.function(handler, "onMessages(): message handler should be a function")
			.nonEmptyString(messageType, "onMessage(): message type must be a non empty string");

		return this._addSubscriber(messageType, handler);
	}

	publishAsync<T extends dcore.Message>(message: T): void {
		guard.true(
			typeof message === "object",
			"publishAsync(): message must be an object with defined type property as string");

		if (!(message.type in this._subscribers)) {
			return;
		}

		const subscriptions = this._subscribers[message.type];
		Object.keys(subscriptions).forEach(id => {
			this._publishSingle(message, subscriptions[id]);
		});
	}

	private _publishSingle(message: dcore.Message, handler: dcore.MessageHandler): void {
		setTimeout(() => {
			try {
				handler(message);
			} catch (err) {
				console.error(`publishAsync(): Receive "${message.type}" message failed.`);
				console.error(err);
			}
		}, 0);
	}

	private _addSubscriber(type: string, handler: dcore.MessageHandler): dcore.Unsubscribe {
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