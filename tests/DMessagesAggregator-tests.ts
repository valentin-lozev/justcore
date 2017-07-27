interface DMessagesAggregatorTestsContext {
    core: DCore;
    topics: string[];
    message: string;
    mockSubscriber: {
        onPublish(data?: any): void;
    };
}

describe("DMessagesAggregator", () => {

    beforeEach(function (this: DMessagesAggregatorTestsContext): void {
        this.topics = ["change", "destroy"];
        this.message = "I am the message";
        this.core = new dcore.Application();
        this.mockSubscriber = {
            onPublish: (data?: any): void => undefined
        };
    });

    it("should be able to add subscriber", function (this: DMessagesAggregatorTestsContext, done: DoneFn) {
        spyOn(this.mockSubscriber, "onPublish");

        let token = this.core.subscribe(this.topics, this.mockSubscriber.onPublish);
        expect(token).toBeDefined();
        expect(typeof token.destroy).toEqual("function");

        this.topics.forEach(topic => this.core.publish(topic, this.message));
        setTimeout(() => {
            expect(this.mockSubscriber.onPublish).toHaveBeenCalledTimes(2);
            expect(this.mockSubscriber.onPublish).toHaveBeenCalledWith(this.topics[0], this.message);
            expect(this.mockSubscriber.onPublish).toHaveBeenCalledWith(this.topics[1], this.message);
            done();
        }, 100);
    });

    it("should be able to unsubscribe for all topics", function (this: DMessagesAggregatorTestsContext, done: DoneFn) {
        spyOn(this.mockSubscriber, "onPublish");
        let token = this.core.subscribe(this.topics, this.mockSubscriber.onPublish);

        token.destroy();
        this.topics.forEach(topic => this.core.publish(topic, this.message));

        setTimeout(() => {
            expect(this.mockSubscriber.onPublish).not.toHaveBeenCalled();
            done();
        }, 100);
    });

    it("should be able to unsubscribe for single topic", function (this: DMessagesAggregatorTestsContext, done: DoneFn) {
        spyOn(this.mockSubscriber, "onPublish");
        let token = this.core.subscribe(this.topics, this.mockSubscriber.onPublish);
        let unsubscribedTopic = this.topics[0];
        let expectedTopic = this.topics[1];

        token.destroy(unsubscribedTopic);
        this.topics.forEach(topic => this.core.publish(topic, this.message));

        setTimeout(() => {
            expect(this.mockSubscriber.onPublish).toHaveBeenCalledTimes(1);
            expect(this.mockSubscriber.onPublish).toHaveBeenCalledWith(expectedTopic, this.message);
            done();
        }, 100);
    });
});