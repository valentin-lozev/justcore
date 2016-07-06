/// <reference path="../../spaMVP/src/mvp/hashSet.js" />
/// <reference path="/scripts/jasmine.js" />

describe('HashSet', function ()
{
    it('should return true when search for valid number', function ()
    {
        var hashSet = new spaMVP.HashSet();
        hashSet.add(18);
        expect(hashSet.contains(18)).toBe(true);
    });

    it('should return false when search for invalid number', function ()
    {
        var hashSet = new spaMVP.HashSet();
        hashSet.add(15);
        expect(hashSet.contains(18)).toBe(false);
    });

    it('should return true when search for valid string', function ()
    {
        var hashSet = new spaMVP.HashSet();
        hashSet.add('asd');
        expect(hashSet.contains('asd')).toBe(true);
    });

    it('should return false when search for invalid string', function ()
    {
        var hashSet = new spaMVP.HashSet();
        hashSet.add('asd');
        expect(hashSet.contains('asdddd')).toBe(false);
    });

    it('should return true when search for valid object', function ()
    {
        var object1 = { id: 1 };
        var hashFunc = function (item) { return item.id; };
        var hashSet = new spaMVP.HashSet(hashFunc);
        hashSet.add(object1);

        expect(hashSet.contains(object1)).toBe(true);
    });

    it('should return false when search for invalid object', function ()
    {
        var object1 = { id: 1 };
        var object2 = { id: 1 };
        var hashFunc = function (item) { return item.id; };
        var hashSet = new spaMVP.HashSet(hashFunc);

        hashSet.add(object1);

        expect(hashSet.contains(object2)).toBe(false);
    });

    it('should add only unique numbers', function () 
    {
        var hashSet = new spaMVP.HashSet();
        hashSet.add(1);
        hashSet.add(1);
        hashSet.add(1);
        hashSet.add(2);
        hashSet.add(2);

        expect(hashSet.size).toBe(2);
        expect(hashSet.contains(1)).toBe(true);
        expect(hashSet.contains(2)).toBe(true);
    });

    it('should add only unique strings', function ()
    {
        var hashSet = new spaMVP.HashSet();
        hashSet.add('123');
        hashSet.add('123');
        hashSet.add('unique');
        hashSet.add('unique');
        hashSet.add('unique');

        expect(hashSet.size).toBe(2);
        expect(hashSet.contains('unique')).toBe(true);
        expect(hashSet.contains('123')).toBe(true);
    });

    it('should add only unique objects', function ()
    {
        var object1 = { id: 1 };
        var object2 = { id: 2 };
        var hashFunc = function (item) { return item.id; };
        var hashSet = new spaMVP.HashSet(hashFunc);
        hashSet.add(object1);
        hashSet.add(object1);
        hashSet.add(object1);
        hashSet.add(object2);
        hashSet.add(object2);

        expect(hashSet.size).toBe(2);
        expect(hashSet.contains(object1)).toBe(true);
        expect(hashSet.contains(object2)).toBe(true);
    });

    it('should add only unique objects with equality func', function ()
    {
        var object1 = { id: 1 };
        var object2 = { id: 2 };
        var hashFunc = function (item) { return item.id; };
        var equalityFunc = function (a, b) { return a.id === b.id; };
        var hashSet = new spaMVP.HashSet(hashFunc, equalityFunc);
        hashSet.add(object1);
        hashSet.add(object1);
        hashSet.add(object1);
        hashSet.add(object2);
        hashSet.add(object2);

        expect(hashSet.size).toBe(2);
        expect(hashSet.contains(object1)).toBe(true);
        expect(hashSet.contains(object2)).toBe(true);
    });

    it('should add only unique objects using their equals methods', function () {
        var object1 = {
            id: 1,
            equals: function (other) {
                return this.id === other.id;
            }
        };
        var object2 = {
            id: 30,
            equals: function (other) {
                return this.id === other.id;
            }
        };
        var object3 = {
            id: 1,
            equals: function (other) {
                return this.id === other.id;
            }
        };

        var hashFunc = function (item) { return 1; };
        var hashSet = new spaMVP.HashSet(hashFunc);
        hashSet.add(object1);
        hashSet.add(object1);
        hashSet.add(object1);
        hashSet.add(object2);
        hashSet.add(object2);
        hashSet.add(object3);
        hashSet.add(object3);
        hashSet.add(object3);

        expect(hashSet.size).toBe(2);
        expect(hashSet.contains(object1)).toBe(true);
        expect(hashSet.contains(object2)).toBe(true);
        expect(hashSet.contains(object3)).toBe(true);
    });

    it('should be empty when clear is called', function ()
    {
        var hashSet = new spaMVP.HashSet();
        hashSet.add(1);
        hashSet.add(2);
        hashSet.add(3);
        hashSet.add(4);
        hashSet.add(5);
        hashSet.clear();

        expect(hashSet.size).toBe(0);
    });

    it('should return array of its items when toArray is called', function ()
    {
        var hashSet = new spaMVP.HashSet(function (item) { return item.toString().length; });
        hashSet.add(1);
        hashSet.add(2);
        hashSet.add(3);
        hashSet.add(20);
        hashSet.add(30);
        hashSet.add(100);
        var arr = hashSet.toArray();

        expect(arr.length).toBe(6);
        expect(arr.length).toBe(hashSet.size);
        expect(arr.indexOf(1)).toBeGreaterThan(-1);
        expect(arr.indexOf(2)).toBeGreaterThan(-1);
        expect(arr.indexOf(3)).toBeGreaterThan(-1);
        expect(arr.indexOf(20)).toBeGreaterThan(-1);
        expect(arr.indexOf(30)).toBeGreaterThan(-1);
        expect(arr.indexOf(100)).toBeGreaterThan(-1);
    });

    it('should remove number', function ()
    {
        var hashSet = new spaMVP.HashSet();
        hashSet.add(1);
        hashSet.add(3);
        hashSet.remove(3);

        expect(hashSet.size).toBe(1);
        expect(hashSet.contains(3)).toBe(false);
    });

    it('should remove string', function ()
    {
        var hashSet = new spaMVP.HashSet();
        hashSet.add('asd');
        hashSet.add('remove');
        hashSet.remove('remove');

        expect(hashSet.size).toBe(1);
        expect(hashSet.contains('remove')).toBe(false);
    });

    it('should remove object', function ()
    {
        var object1 = { id: 1 };
        var object2 = { id: 2 };
        var hashFunc = function (item) { return item.id; };
        var hashSet = new spaMVP.HashSet(hashFunc);
        hashSet.add(object1);
        hashSet.add(object2);
        hashSet.remove(object2);

        expect(hashSet.size).toBe(1);
        expect(hashSet.contains(object2)).toBe(false);
    });

    it('should perform an action over all items', function () {
        var hashSet = new spaMVP.HashSet(function (item) { return item.length; });
        hashSet.add('a');
        hashSet.add('b');
        hashSet.add('c');
        hashSet.add('d');
        hashSet.add('a'); // invalid
        hashSet.add('dd');
        hashSet.add('ddd');
        hashSet.add('ddd'); // invalid

        var indexes = '';
        var items = [];
        hashSet.forEach(function (item, index) {
            indexes += index;
            items.push(item);
        });

        expect(indexes).toEqual('012345');
        expect(items.length).toEqual(6);
        expect(items.sort().join('')).toEqual('abcdddddd');
    });
});