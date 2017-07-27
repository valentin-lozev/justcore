declare type TestSumAggregator = (a: number, b: number) => number;

interface DPluginsPipelineTestsContext {
    core: DCore;
    calculator: {
        sum: TestSumAggregator;
    };
    plugins: {
        increaseResultBy1(next: TestSumAggregator, a: number, b: number): number;
        increaseResultBy2(next: TestSumAggregator, a: number, b: number): number;
        increaseResultBy3(next: TestSumAggregator, a: number, b: number): number;
        multiplyArgumentsBy2(next: TestSumAggregator, a: number, b: number): number;
    };
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
        this.core = new dcore.Application();
        this.calculator = {
            sum: (a: number, b: number): number => {
                methodsCallOrder.push(sumName);
                return a + b;
            }
        };
        this.plugins = {
            increaseResultBy1: function (next: TestSumAggregator, a: number, b: number): number {
                methodsCallOrder.push(increaseResultBy1Name);
                return next.call(this, a, b) + 1;
            },

            increaseResultBy2: function (next: TestSumAggregator, a: number, b: number): number {
                methodsCallOrder.push(increaseResultBy2Name);
                return next.call(this, a, b) + 2;
            },

            increaseResultBy3: function (next: TestSumAggregator, a: number, b: number): number {
                methodsCallOrder.push(increaseResultBy3Name);
                return next.call(this, a, b) + 3;
            },

            multiplyArgumentsBy2: function (next: TestSumAggregator, a: number, b: number): number {
                methodsCallOrder.push(multiplyArgumentsBy2Name);
                return next.call(this, a * 2, b * 2);
            },
        };
    });

    describe("Having none or one hooked plugin", () => {

        it("should pipe an invoker when empty pipeline", function (this: DPluginsPipelineTestsContext): void {
            const a = 2;
            const b = 3;
            const expectedSum = a + b;
            spyOn(this.calculator, "sum").and.callThrough();

            let actualSum = this.core.pipe(sumName, this.calculator.sum, this.calculator, a, b);

            expect(this.calculator.sum).toHaveBeenCalledTimes(1);
            expect(this.calculator.sum).toHaveBeenCalledWith(a, b);
            expect(actualSum).toEqual(expectedSum);
        });

        it("should pipe an invoker and its plugin only once in the pipeline", function (this: DPluginsPipelineTestsContext): void {
            spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
            spyOn(this.calculator, "sum").and.callThrough();

            this.core.hook(sumName, this.plugins.multiplyArgumentsBy2);
            this.core.pipe(sumName, this.calculator.sum, this.calculator, 2, 3);

            expect(this.calculator.sum).toHaveBeenCalledTimes(1);
            expect(this.plugins.multiplyArgumentsBy2).toHaveBeenCalledTimes(1);
        });

        it("should pipe with correct context", function (this: DPluginsPipelineTestsContext): void {
            spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
            spyOn(this.calculator, "sum").and.callThrough();

            this.core.hook(sumName, this.plugins.multiplyArgumentsBy2);
            this.core.pipe(sumName, this.calculator.sum, this.calculator, 2, 3);

            expect(this.calculator.sum["calls"].first().object).toBe(this.calculator);
            expect(this.plugins.multiplyArgumentsBy2["calls"].first().object).toBe(this.calculator);
        });

        it("should pipe an invoker and its plugin with correct arguments when args have changed", function (this: DPluginsPipelineTestsContext): void {
            const a = 2;
            const b = 3;
            spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
            spyOn(this.calculator, "sum").and.callThrough();

            this.core.hook(sumName, this.plugins.multiplyArgumentsBy2);
            this.core.pipe(sumName, this.calculator.sum, this.calculator, a, b);

            const pluginArgs: any[] = this.plugins.multiplyArgumentsBy2["calls"].first().args;
            expect(pluginArgs.length).toEqual(3);
            expect(typeof pluginArgs[0]).toEqual("function");
            expect(pluginArgs[1]).toEqual(a);
            expect(pluginArgs[2]).toEqual(b);
            expect(this.calculator.sum).toHaveBeenCalledWith(a * 2, b * 2);
        });

        it("should pipe an invoker's plugin before the invoker", function (this: DPluginsPipelineTestsContext): void {
            spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
            spyOn(this.calculator, "sum").and.callThrough();

            this.core.hook(sumName, this.plugins.multiplyArgumentsBy2);
            this.core.pipe(sumName, this.calculator.sum, this.calculator, 2, 3);

            expect(methodsCallOrder.length).toEqual(2);
            expect(methodsCallOrder[0]).toEqual(multiplyArgumentsBy2Name);
            expect(methodsCallOrder[1]).toEqual(sumName);
        });

        it("should return correct result when pipe an invoker that has hooked plugin", function (this: DPluginsPipelineTestsContext): void {
            const a = 2;
            const b = 3;
            const expectedSum = (a + b) * 2;
            spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
            spyOn(this.calculator, "sum").and.callThrough();

            this.core.hook(sumName, this.plugins.multiplyArgumentsBy2);
            let actualSum = this.core.pipe(sumName, this.calculator.sum, this.calculator, a, b);

            expect(actualSum).toEqual(expectedSum);
        });
    });

    describe("Having more than one hooked plugin", () => {

        it("should pipe the plugins in correct order", function (this: DPluginsPipelineTestsContext): void {
            spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
            spyOn(this.plugins, "increaseResultBy1").and.callThrough();
            spyOn(this.plugins, "increaseResultBy2").and.callThrough();
            spyOn(this.plugins, "increaseResultBy3").and.callThrough();
            spyOn(this.calculator, "sum").and.callThrough();

            this.core.hook(sumName, this.plugins.multiplyArgumentsBy2);
            this.core.hook(sumName, this.plugins.increaseResultBy1);
            this.core.hook(sumName, this.plugins.increaseResultBy2);
            this.core.hook(sumName, this.plugins.increaseResultBy3);
            this.core.pipe(sumName, this.calculator.sum, this.calculator, 2, 3);

            expect(methodsCallOrder.length).toEqual(5);
            expect(methodsCallOrder[0]).toEqual(multiplyArgumentsBy2Name);
            expect(methodsCallOrder[1]).toEqual(increaseResultBy1Name);
            expect(methodsCallOrder[2]).toEqual(increaseResultBy2Name);
            expect(methodsCallOrder[3]).toEqual(increaseResultBy3Name);
            expect(methodsCallOrder[4]).toEqual(sumName);
        });

        it("should return correct result when pipe an invoker that has hooked plugins", function (this: DPluginsPipelineTestsContext): void {
            const a = 2;
            const b = 3;
            const expectedSum = ((a + b) * 2) + 3 + 2 + 1;
            spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
            spyOn(this.plugins, "increaseResultBy1").and.callThrough();
            spyOn(this.plugins, "increaseResultBy2").and.callThrough();
            spyOn(this.plugins, "increaseResultBy3").and.callThrough();
            spyOn(this.calculator, "sum").and.callThrough();

            this.core.hook(sumName, this.plugins.multiplyArgumentsBy2);
            this.core.hook(sumName, this.plugins.increaseResultBy1);
            this.core.hook(sumName, this.plugins.increaseResultBy2);
            this.core.hook(sumName, this.plugins.increaseResultBy3);
            let actualSum = this.core.pipe(sumName, this.calculator.sum, this.calculator, a, b);

            expect(actualSum).toEqual(expectedSum);
        });
    });
});