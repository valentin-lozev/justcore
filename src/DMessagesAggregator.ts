namespace dcore._private {
  "use strict";

  interface SubscribersMap {
    [topic: string]: { [tokenId: string]: Function; };
  }

  const hasOwnProperty = Object.prototype.hasOwnProperty;

  let lastUsedSubscriptionID = 0;

  export class DMessagesAggregator {

    private subscribers: SubscribersMap = {};

    /**
     *  Subscribes for given topics.
     */
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
      argumentGuard("subscribe(): ")
        .mustBeFunction(handler, "message handler should be a function.")
        .mustBeArray(topics, "topics should be passed as an array of strings.");

      const token = {};
      topics.forEach(topic => token[topic] = this.__addSubscriber(topic, handler));

      const that = this;
      return {
        destroy: function (topic?: string): void {
          if (arguments.length > 0) {
            that.__unsubscribe(topic, token);
            return;
          }

          Object.keys(token).forEach(topic => that.__unsubscribe(topic, token));
        }
      };
    }

    /**
     *  Publishes a message asynchronously.
     */
    publish(topic: string, message: any): void {
      if (!hasOwnProperty.call(this.subscribers, topic)) {
        return;
      }

      const subscriptions = this.subscribers[topic];
      Object.keys(subscriptions).forEach(key => {
        const handler = subscriptions[key];
        setTimeout(() => {
          try {
            handler(topic, message);
          } catch (err) {
            console.error(`publish(): Receive "${topic}" message failed.`);
            console.error(err);
            console.error(`Handler:`);
            console.error(handler);
          }
        }, 0);
      });
    }

    private __addSubscriber(topic: string, handler: Function): string {
      if (!hasOwnProperty.call(this.subscribers, topic)) {
        this.subscribers[topic] = {};
      }

      const subscriptionID = "sbscrptn" + (++lastUsedSubscriptionID);
      this.subscribers[topic][subscriptionID] = handler;
      return subscriptionID;
    }

    private __unsubscribe(topic: string, token: { [topic: string]: string; }): void {
      if (!hasOwnProperty.call(token, topic)) {
        return;
      }

      const subscriptionID = token[topic];
      delete this.subscribers[topic][subscriptionID];
    }
  }
}