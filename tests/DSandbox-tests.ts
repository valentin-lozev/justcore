interface DSandboxTestsContext {
  moduleId: string;
  getOne(core: DCore, moduleId?: string, moduleInstanceId?: string): DSandbox;
}

describe("DSandbox", () => {

  beforeEach(function (this: DSandboxTestsContext): void {
    this.moduleId = "testModule";
    this.getOne = function (core: DCore, moduleId: string = this.moduleId, moduleInstanceId: string = this.moduleId): DSandbox {
      return new core.Sandbox(core, moduleId, moduleInstanceId);
    };
  });

  it("should throw when created with invalid arguments", function (this: DSandboxTestsContext) {
    let core = new dcore.Application();

    expect(() => new dcore.Sandbox(null, this.moduleId, this.moduleId)).toThrow();
    expect(() => new dcore.Sandbox(core, null, this.moduleId)).toThrow();
    expect(() => new dcore.Sandbox(core, this.moduleId, null)).toThrow();
  });

  it("should know which module it is serving for", function (this: DSandboxTestsContext) {
    let sb = this.getOne(new dcore.Application());

    expect(sb.getModuleId()).toEqual(this.moduleId);
    expect(sb.getModuleInstanceId()).toEqual(this.moduleId);
  });

  it("should subscribe by delegating a single topic to its core", function (this: DSandboxTestsContext) {
    let core = new dcore.Application();
    spyOn(core.messages, "subscribe").and.callThrough();
    let sb = this.getOne(core);
    let topic = "on";
    let handler = (topic: string, data: any) => true;

    sb.subscribe(topic, handler);

    expect(core.messages.subscribe).toHaveBeenCalledWith([topic], handler);
  });

  it("should subscribe by delegating array of topics to its core", function (this: DSandboxTestsContext) {
    let core = new dcore.Application();
    spyOn(core.messages, "subscribe");
    let sb = this.getOne(core);
    let topics = ["on", "off"];
    let handler = (topic: string, data: any) => true;

    sb.subscribe(topics, handler);

    expect(core.messages.subscribe).toHaveBeenCalledWith(topics, handler);
  });

  it("should publish by delegating to its core", function (this: DSandboxTestsContext) {
    let core = new dcore.Application();
    spyOn(core.messages, "publish");
    let sb = this.getOne(core);
    let topic = "on";
    let message = 8;

    sb.publish(topic, message);

    expect(core.messages.publish).toHaveBeenCalledWith(topic, message);
  });

  it("should start a module by delegating to its core", function (this: DSandboxTestsContext) {
    let core = new dcore.Application();
    spyOn(core, "start");
    let sb = this.getOne(core);
    let moduleId = "test-module";
    let options = { isTest: true };

    sb.start(moduleId, options);

    expect(core.start).toHaveBeenCalledWith(moduleId, options);
  });

  it("should stop a module by delegating to its core", function (this: DSandboxTestsContext) {
    let core = new dcore.Application();
    spyOn(core, "stop");
    let sb = this.getOne(core);
    let moduleId = "test-module";
    let instanceId = "instanceID";

    sb.stop(moduleId, instanceId);

    expect(core.stop).toHaveBeenCalledWith(moduleId, instanceId);
  });
});