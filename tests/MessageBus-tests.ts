import { MessageBus } from "../src/components/MessageBus";

interface TestsContext {
    bus: MessageBus;
    message: string;
    messageData: string;
    handleMessage: jc.MessageHandler;
}

describe("MessageBus", () => {

    beforeEach(function (this: TestsContext): void {
        this.bus = new MessageBus();
        this.message = "change";
        this.messageData = "I am the message";
        this.handleMessage = () => true;
    });

    it("should throw when subscribe with invalid args", function (this: TestsContext) {
        const cases = [
            () => this.bus.onMessage("", this.handleMessage),
            () => this.bus.onMessage(this.message, null)
        ];

        cases.forEach(x => expect(x).toThrowError());
    });

    it("should return unsubscribe function when subscribe", function (this: TestsContext) {
        const unsubscribe = this.bus.onMessage(this.message, this.handleMessage);

        expect(typeof unsubscribe).toEqual("function");
    });

    it("should throw when publish a non message", function (this: TestsContext) {
        expect(() => this.bus.publishAsync(null)).toThrowError();
    });

    it("should publish a message to its subscribers", function (this: TestsContext, done: DoneFn) {
        const spy = spyOn(this, "handleMessage");

        this.bus.onMessage(this.message, spy);
        this.bus.publishAsync({ type: this.message, message: this.messageData });

        setTimeout(() => {
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith({ type: this.message, message: this.messageData } as jc.Message);
            done();
        }, 10);
    });

    it("should not throw when publish and there aren't any subscribers", function (this: TestsContext) {
        expect(() => this.bus.publishAsync({
            type: this.message,
            message: this.messageData
        })).not.toThrow();
    });

    it("should not throw when an error occurs in message handler", function (this: TestsContext, done: DoneFn) {
        const spy = spyOn(this, "handleMessage").and.throwError("");

        this.bus.onMessage(this.message, spy);

        expect(() => {
            this.bus.publishAsync({ type: this.message, message: this.messageData });
        }).not.toThrowError();

        setTimeout(() => {
            expect(spy).toHaveBeenCalledTimes(1);
            done();
        }, 10);
    });

    it("should unsubscribe", function (this: TestsContext, done: DoneFn) {
        const spy = spyOn(this, "handleMessage");
        const unsubscribe = this.bus.onMessage(this.message, spy);

        unsubscribe();
        this.bus.publishAsync({ type: this.message, message: this.messageData });

        setTimeout(() => {
            expect(spy).not.toHaveBeenCalled();
            done();
        }, 10);
    });
});