describe("DMediator", () => {

    const topics = ["change", "destroy"];
    const message = "I am the message";
    const mockSubscriber = {
        onPublish: (data?: any): void => undefined
    };

    let mediator: DMediator;

    beforeEach(() => {
        mediator = new dcore._private.DefaultMediator();
    });

    it("should be able to add subscriber", (done: DoneFn) => {
        spyOn(mockSubscriber, "onPublish");

        let token = mediator.subscribe(topics, mockSubscriber.onPublish);
        expect(token).toBeDefined();
        expect(typeof token.destroy).toEqual("function");

        topics.forEach(topic => mediator.publish(topic, message));
        setTimeout(() => {
            expect(mockSubscriber.onPublish).toHaveBeenCalledTimes(2);
            expect(mockSubscriber.onPublish).toHaveBeenCalledWith(topics[0], message);
            expect(mockSubscriber.onPublish).toHaveBeenCalledWith(topics[1], message);
            done();
        }, 100);
    });

    it("should be able to unsubscribe for all topics", (done: DoneFn) => {
        spyOn(mockSubscriber, "onPublish");
        let token = mediator.subscribe(topics, mockSubscriber.onPublish);

        token.destroy();
        topics.forEach(topic => mediator.publish(topic, message));

        setTimeout(() => {
            expect(mockSubscriber.onPublish).not.toHaveBeenCalled();
            done();
        }, 100);
    });

    it("should be able to unsubscribe for single topic", (done: DoneFn) => {
        spyOn(mockSubscriber, "onPublish");
        let token = mediator.subscribe(topics, mockSubscriber.onPublish);
        let unsubscribedTopic = topics[0];
        let expectedTopic = topics[1];

        token.destroy(unsubscribedTopic);
        topics.forEach(topic => mediator.publish(topic, message));

        setTimeout(() => {
            expect(mockSubscriber.onPublish).toHaveBeenCalledTimes(1);
            expect(mockSubscriber.onPublish).toHaveBeenCalledWith(expectedTopic, message);
            done();
        }, 100);
    });
});