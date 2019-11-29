import { guard } from "../utils";

declare global {
    namespace jc {
        interface Sandbox {
            _unsubscribers?: UnsubscribersMap;
        }
    }
}

interface UnsubscribersMap {
    [message: string]: jc.Unsubscribe;
}

function subscribe(this: jc.Module): void {
    const core = this.sandbox._extensionsOnlyCore;
    const messages = typeof this.moduleWillSubscribe === "function"
        ? core.createHook("onModuleSubscribe", this.moduleWillSubscribe, this)()
        : null;
    const anyMessages = Array.isArray(messages) && messages.length >= 0;
    if (!anyMessages) {
        return;
    }

    guard.function(this.moduleDidReceiveMessage, "m23", this.sandbox.moduleId);

    const moduleDidReceiveMessage = core.createHook(
        "onModuleReceiveMessage",
        this.moduleDidReceiveMessage,
        this);
    this.sandbox._unsubscribers = messages.reduce(
        (map, message) => {
            map[message] = core.onMessage(message, moduleDidReceiveMessage);
            return map;
        },
        Object.create(null) as UnsubscribersMap);
}

function unsubscribe(this: jc.Module): void {
    const unsubscribers = this.sandbox._unsubscribers;
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

export function moduleAutosubscribe(): jc.Extension {
    return {
        name: "module-autosubscribe",
        install: () => ({
            onModuleInit: function(this: jc.Module, next: jc.Func<void>): void {
                next();
                subscribe.call(this);
            },

            onModuleDestroy: function(this: jc.Module, next: jc.Func<void>): void {
                unsubscribe.call(this);
                next();
            }
        })
    };
}