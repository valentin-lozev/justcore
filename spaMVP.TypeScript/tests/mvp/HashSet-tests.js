/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
describe('HashSet', function () {
    Number.prototype.hash = function () { return this | 17; };
    Number.prototype.equals = function (other) { return this == other; };
    it('should return true when successfully add an item', function () {
        var set = new spaMVP.HashSet();
        expect(set.add(1)).toBeTruthy();
        expect(set.size).toEqual(1);
    });
    it('should return false when add a duplicated item', function () {
        var set = new spaMVP.HashSet();
        set.add(1);
        expect(set.add(1)).toBeFalsy();
        expect(set.size).toEqual(1);
    });
    it('should add only unique items', function () {
        var set = new spaMVP.HashSet();
        var size = 10000;
        for (var i = 0; i < size; i++) {
            set.add(i);
        }
        expect(set.size).toEqual(size);
        for (var i = 0; i < size; i++) {
            expect(set.contains(i));
        }
    });
    it('should return true when contains an item', function () {
        var set = new spaMVP.HashSet();
        set.add(10);
        expect(set.contains(10)).toBeTruthy();
    });
    it('should return false when does not contain an item', function () {
        var set = new spaMVP.HashSet();
        expect(set.contains(10)).toBeFalsy();
    });
    it('should be empty when clear is being called', function () {
        var set = new spaMVP.HashSet();
        var size = 1000;
        for (var i = 0; i < size; i++) {
            set.add(i);
        }
        set.clear();
        expect(set.size).toEqual(0);
        for (var i = 0; i < size; i++) {
            expect(set.contains(i)).toBeFalsy();
        }
    });
    it('should return true when successfully clear items', function () {
        var set = new spaMVP.HashSet();
        set.add(1);
        var result = set.clear();
        expect(result).toBeTruthy();
        expect(set.size).toEqual(0);
    });
    it('should return false when clear an empty set', function () {
        var set = new spaMVP.HashSet();
        var result = set.clear();
        expect(result).toBeFalsy();
    });
    it('should return true when remove successfully an item', function () {
        var set = new spaMVP.HashSet();
        var size = 10000;
        for (var i = 0; i < size; i++) {
            set.add(i);
        }
        for (var i = 0; i < size; i++) {
            expect(set.remove(i)).toBeTruthy();
        }
        expect(set.size).toEqual(0);
    });
    it('should return false when remove item that does not exist', function () {
        var set = new spaMVP.HashSet();
        expect(set.remove(1)).toBeFalsy();
    });
    it('should return an array of its items', function () {
        var set = new spaMVP.HashSet();
        var size = 1000;
        for (var i = 0; i < size; i++) {
            set.add(i);
        }
        var arr = set.toArray();
        expect(Array.isArray(arr)).toBeTruthy();
        expect(arr.length).toBe(set.size);
        for (var i = 0; i < size; i++) {
            expect(arr.indexOf(i)).toBeGreaterThan(-1);
        }
    });
    it('should iterate over its items and performs an action', function () {
        var set = new spaMVP.HashSet();
        var size = 100;
        var sum = 0;
        for (var i = 0; i < size; i++) {
            set.add(i);
            sum += i;
        }
        var previousIndex = -1;
        set.forEach(function (num, index) {
            sum -= num;
            expect(index === previousIndex + 1);
            previousIndex = index;
        });
        expect(sum).toEqual(0);
        expect(previousIndex).toEqual(size - 1);
    });
});
//# sourceMappingURL=HashSet-tests.js.map