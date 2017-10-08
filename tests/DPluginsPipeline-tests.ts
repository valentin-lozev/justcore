interface DPluginsPipelineTestsContext {
  pipeline: dcore._private.DPluginsPipeline;
  calculator: {
    sum: (args: SumArgs) => number;
  };
  plugins: {
    increaseResultBy1(next: () => number, args?: SumArgs): number;
    increaseResultBy2(next: () => number, args?: SumArgs): number;
    increaseResultBy3(next: () => number, args?: SumArgs): number;
    multiplyArgumentsBy2(next: () => number, args?: SumArgs): number;
  };
}

interface SumArgs {
  a: number;
  b: number;
}

describe("DPluginsPipeline", () => {

  const sumName = "sum";
  const increaseResultBy1Name = "increaseResultBy1";
  const increaseResultBy2Name = "increaseResultBy2";
  const increaseResultBy3Name = "increaseResultBy3";
  const multiplyArgumentsBy2Name = "multiplyArgumentsBy2";

  let methodsCallOrder: string[];

  beforeEach(function (this: DPluginsPipelineTestsContext): void {
    methodsCallOrder = [];
    this.pipeline = new dcore._private.DPluginsPipeline();
    this.calculator = {
      sum: (args): number => {
        methodsCallOrder.push(sumName);
        return args.a + args.b;
      }
    };
    this.plugins = {
      increaseResultBy1: function (next: () => number): number {
        methodsCallOrder.push(increaseResultBy1Name);
        return next() + 1;
      },

      increaseResultBy2: function (next: () => number): number {
        methodsCallOrder.push(increaseResultBy2Name);
        return next() + 2;
      },

      increaseResultBy3: function (next: () => number): number {
        methodsCallOrder.push(increaseResultBy3Name);
        return next() + 3;
      },

      multiplyArgumentsBy2: function (next: () => number, args?: SumArgs): number {
        methodsCallOrder.push(multiplyArgumentsBy2Name);
        args.a *= 2;
        args.b *= 2;
        return next();
      },
    };
  });

  describe("Having none or one hooked plugin", () => {

    it("should pipe an invoker when empty pipeline", function (this: DPluginsPipelineTestsContext): void {
      const args: SumArgs = {
        a: 2,
        b: 3,
      };
      const expectedSum = args.a + args.b;
      spyOn(this.calculator, "sum").and.callThrough();

      let actualSum = this.pipeline.pipe(sumName, this.calculator.sum, this.calculator, args);

      expect(this.calculator.sum).toHaveBeenCalledTimes(1);
      expect(this.calculator.sum).toHaveBeenCalledWith(args);
      expect(actualSum).toEqual(expectedSum);
    });

    it("should pipe an invoker and its plugin only once in the pipeline", function (this: DPluginsPipelineTestsContext): void {
      const args: SumArgs = {
        a: 2,
        b: 3,
      };
      spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
      spyOn(this.calculator, "sum").and.callThrough();

      this.pipeline.hook(sumName, this.plugins.multiplyArgumentsBy2);
      this.pipeline.pipe(sumName, this.calculator.sum, this.calculator, args);

      expect(this.calculator.sum).toHaveBeenCalledTimes(1);
      expect(this.plugins.multiplyArgumentsBy2).toHaveBeenCalledTimes(1);
    });

    it("should pipe with correct context", function (this: DPluginsPipelineTestsContext): void {
      const args: SumArgs = {
        a: 2,
        b: 3,
      };
      spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
      spyOn(this.calculator, "sum").and.callThrough();

      this.pipeline.hook(sumName, this.plugins.multiplyArgumentsBy2);
      this.pipeline.pipe(sumName, this.calculator.sum, this.calculator, args);

      expect(this.calculator.sum["calls"].first().object).toBe(this.calculator);
      expect(this.plugins.multiplyArgumentsBy2["calls"].first().object).toBe(this.calculator);
    });

    it("should pipe an invoker and its plugin with correct arguments when args have changed", function (this: DPluginsPipelineTestsContext): void {
      const args: SumArgs = {
        a: 2,
        b: 3,
      };
      spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
      spyOn(this.calculator, "sum").and.callThrough();

      this.pipeline.hook(sumName, this.plugins.multiplyArgumentsBy2);
      this.pipeline.pipe(sumName, this.calculator.sum, this.calculator, args);

      expect(args.a).toEqual(4);
      expect(args.b).toEqual(6);
      const pluginArgs: any[] = this.plugins.multiplyArgumentsBy2["calls"].first().args;
      expect(pluginArgs.length).toEqual(2);
      expect(typeof pluginArgs[0]).toEqual("function");
      expect(pluginArgs[1]).toEqual(args);
      expect(this.calculator.sum).toHaveBeenCalledWith(args);
    });

    it("should pipe an invoker's plugin before the invoker", function (this: DPluginsPipelineTestsContext): void {
      const args: SumArgs = {
        a: 2,
        b: 3,
      };
      spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
      spyOn(this.calculator, "sum").and.callThrough();

      this.pipeline.hook(sumName, this.plugins.multiplyArgumentsBy2);
      this.pipeline.pipe(sumName, this.calculator.sum, this.calculator, args);

      expect(methodsCallOrder.length).toEqual(2);
      expect(methodsCallOrder[0]).toEqual(multiplyArgumentsBy2Name);
      expect(methodsCallOrder[1]).toEqual(sumName);
    });

    it("should return correct result when pipe an invoker that has hooked plugin", function (this: DPluginsPipelineTestsContext): void {
      const args: SumArgs = {
        a: 2,
        b: 3,
      };
      const expectedSum = (args.a + args.b) * 2;
      spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
      spyOn(this.calculator, "sum").and.callThrough();

      this.pipeline.hook(sumName, this.plugins.multiplyArgumentsBy2);
      const actualSum = this.pipeline.pipe(sumName, this.calculator.sum, this.calculator, args);

      expect(actualSum).toEqual(expectedSum);
    });
  });

  describe("Having more than one hooked plugin", () => {

    it("should pipe the plugins in correct order", function (this: DPluginsPipelineTestsContext): void {
      const args: SumArgs = {
        a: 2,
        b: 3,
      };
      spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
      spyOn(this.plugins, "increaseResultBy1").and.callThrough();
      spyOn(this.plugins, "increaseResultBy2").and.callThrough();
      spyOn(this.plugins, "increaseResultBy3").and.callThrough();
      spyOn(this.calculator, "sum").and.callThrough();

      this.pipeline.hook(sumName, this.plugins.multiplyArgumentsBy2);
      this.pipeline.hook(sumName, this.plugins.increaseResultBy1);
      this.pipeline.hook(sumName, this.plugins.increaseResultBy2);
      this.pipeline.hook(sumName, this.plugins.increaseResultBy3);
      this.pipeline.pipe(sumName, this.calculator.sum, this.calculator, args);

      expect(methodsCallOrder.length).toEqual(5);
      expect(methodsCallOrder[0]).toEqual(multiplyArgumentsBy2Name);
      expect(methodsCallOrder[1]).toEqual(increaseResultBy1Name);
      expect(methodsCallOrder[2]).toEqual(increaseResultBy2Name);
      expect(methodsCallOrder[3]).toEqual(increaseResultBy3Name);
      expect(methodsCallOrder[4]).toEqual(sumName);
    });

    it("should return correct result when pipe an invoker that has hooked plugins", function (this: DPluginsPipelineTestsContext): void {
      const args: SumArgs = {
        a: 2,
        b: 3,
      };
      const expectedSum = ((args.a + args.b) * 2) + 3 + 2 + 1;
      spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
      spyOn(this.plugins, "increaseResultBy1").and.callThrough();
      spyOn(this.plugins, "increaseResultBy2").and.callThrough();
      spyOn(this.plugins, "increaseResultBy3").and.callThrough();
      spyOn(this.calculator, "sum").and.callThrough();

      this.pipeline.hook(sumName, this.plugins.multiplyArgumentsBy2);
      this.pipeline.hook(sumName, this.plugins.increaseResultBy1);
      this.pipeline.hook(sumName, this.plugins.increaseResultBy2);
      this.pipeline.hook(sumName, this.plugins.increaseResultBy3);
      let actualSum = this.pipeline.pipe(sumName, this.calculator.sum, this.calculator, args);

      expect(actualSum).toEqual(expectedSum);
    });
  });
});