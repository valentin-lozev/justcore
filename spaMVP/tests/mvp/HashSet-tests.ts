/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

interface Number {
    hash(): number;
    equals(other: number): boolean;
}

describe("HashSet", function (): void {

    Number.prototype.hash = function (): number { return this | 17; };
    Number.prototype.equals = function (other: number): boolean { return this == other; };

    function getSet(): spaMVP.plugins.mvp.HashSet<number> {
        return new spaMVP.plugins.mvp.HashSet<number>();
    }

    it("should return true when successfully add an item", () => {
        let set = getSet();

        expect(set.add(1)).toBeTruthy();
        expect(set.size).toEqual(1);
    });

    it("should return false when add null or undefined", () => {
        let set = getSet();

        expect(set.add(null)).toBeFalsy();
        expect(set.add(undefined)).toBeFalsy();
        expect(set.size).toEqual(0);
    });

    it("should return false when add a duplicated item", () => {
        let set = getSet();
        set.add(1);

        expect(set.add(1)).toBeFalsy();
        expect(set.size).toEqual(1);
    });

    it("should add only unique items", () => {
        let set = getSet();
        let size = 10000;

        for (let i = 0; i < size; i++) {
            set.add(i);
        }

        expect(set.size).toEqual(size);
        for (let i = 0; i < size; i++) {
            expect(set.contains(i));
        }
    });

    it("should return true when contains an item", () => {
        let set = getSet();
        set.add(10);

        expect(set.contains(10)).toBeTruthy();
    });

    it("should return false when does not contain an item", () => {
        let set = getSet();

        expect(set.contains(10)).toBeFalsy();
    });

    it("should be empty when clear is being called", () => {
        let set = getSet();
        let size = 1000;
        for (let i = 0; i < size; i++) {
            set.add(i);
        }

        set.clear();

        expect(set.size).toEqual(0);
        for (let i = 0; i < size; i++) {
            expect(set.contains(i)).toBeFalsy();
        }
    });

    it("should return true when successfully clear items", () => {
        let set = getSet();
        set.add(1);

        let result = set.clear();

        expect(result).toBeTruthy();
        expect(set.size).toEqual(0);
    });

    it("should return false when clear an empty set", () => {
        let set = getSet();

        let result = set.clear();

        expect(result).toBeFalsy();
    });

    it("should return true when remove successfully an item", () => {
        let set = getSet();
        let size = 10000;
        for (let i = 0; i < size; i++) {
            set.add(i);
        }

        for (let i = 0; i < size; i++) {
            expect(set.remove(i)).toBeTruthy();
        }
        expect(set.size).toEqual(0);
    });

    it("should return false when remove item that does not exist", () => {
        let set = getSet();

        expect(set.remove(1)).toBeFalsy();
    });

    it("should return an array of its items", () => {
        let set = getSet();
        let size = 1000;
        for (let i = 0; i < size; i++) {
            set.add(i);
        }

        let arr = set.toArray();

        expect(Array.isArray(arr)).toBeTruthy();
        expect(arr.length).toBe(set.size);
        for (let i = 0; i < size; i++) {
            expect(arr.indexOf(i)).toBeGreaterThan(-1);
        }
    });

    it("should iterate over its items and performs an action", () => {
        let set = getSet();
        let size = 100;
        let sum = 0;
        for (let i = 0; i < size; i++) {
            set.add(i);
            sum += i;
        }

        let previousIndex = -1;
        set.forEach((num, index) => {
            sum -= <number>num;
            expect(index === previousIndex + 1);
            previousIndex = index;
        });

        expect(sum).toEqual(0);
        expect(previousIndex).toEqual(size - 1);
    });
});