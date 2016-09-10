/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
describe('Collection', function () {
    var Book = (function (_super) {
        __extends(Book, _super);
        function Book(id) {
            _super.call(this);
            this.id = id;
        }
        Book.prototype.hash = function () {
            return this.id | 17;
        };
        Book.prototype.equals = function (other) {
            return other && this.id === other.id;
        };
        return Book;
    }(spaMVP.Model));
    function getBooks(count) {
        var result = new Array(count);
        for (var i = 0; i < count; i++) {
            result[i] = new Book(i);
        }
        return result;
    }
    function getCollection() {
        return new spaMVP.Collection();
    }
    it('should be an instance of Model', function () {
        expect(getCollection() instanceof spaMVP.Model).toBeTruthy();
    });
    it('should have size', function () {
        expect(getCollection().size).toEqual(0);
    });
    describe('Adding', function () {
        it('should return true when add new item', function () {
            var collection = getCollection();
            var book = new Book(1);
            var result = collection.add(book);
            expect(result).toBeTruthy();
        });
        it('should return false when add duplicated item', function () {
            var collection = getCollection();
            var book = new Book(0);
            collection.add(book);
            var result = collection.add(book);
            expect(result).toBeFalsy();
            expect(collection.size).toEqual(1);
        });
        it('should return true when add range of items', function () {
            var collection = getCollection();
            var size = 10;
            var result = collection.addRange(getBooks(size));
            expect(result).toBeTruthy();
            expect(collection.size).toEqual(size);
        });
        it('should return false when add range of duplicated items', function () {
            var collection = getCollection();
            var size = 10;
            collection.addRange(getBooks(size));
            var result = collection.addRange(getBooks(size));
            expect(result).toBeFalsy();
            expect(collection.size).toEqual(size);
        });
        it('should notify for added items', function () {
            var collection = getCollection();
            var books = getBooks(20);
            var spy = jasmine.createSpyObj('spy', ['handler']);
            collection.on(spaMVP.CollectionEvents.AddedItems, spy.handler);
            collection.addRange(books);
            expect(spy.handler).toHaveBeenCalledWith(books);
        });
    });
    describe('Deleting', function () {
        it('should return true when remove existing item', function () {
            var collection = getCollection();
            var book = getBooks(1)[0];
            collection.add(book);
            var result = collection.remove(book);
            expect(result).toBeTruthy();
            expect(collection.size).toEqual(0);
        });
        it('should return false when remove unexisting item', function () {
            var collection = getCollection();
            var result = collection.remove(new Book(1));
            expect(result).toBeFalsy();
            expect(collection.size).toEqual(0);
        });
        it('should return true when remove range of items', function () {
            var collection = getCollection();
            var size = 10;
            var books = getBooks(size);
            collection.addRange(books);
            var result = collection.removeRange(books);
            expect(result).toBeTruthy();
            expect(collection.size).toEqual(0);
        });
        it('should return false when remove range of unexisting items', function () {
            var collection = getCollection();
            var result = collection.removeRange(getBooks(10));
            expect(result).toBeFalsy();
            expect(collection.size).toEqual(0);
        });
        it('should notify for deleted items', function () {
            var collection = getCollection();
            var books = getBooks(20);
            var spy = jasmine.createSpyObj('spy', ['handler']);
            collection.on(spaMVP.CollectionEvents.DeletedItems, spy.handler);
            collection.addRange(books);
            collection.removeRange(books);
            expect(spy.handler).toHaveBeenCalledWith(books);
            expect(collection.size).toEqual(0);
        });
        it('should remove all items when clear is being invoked', function () {
            var result = false;
            var collection = getCollection();
            var books = getBooks(20);
            var spy = {
                handler: function (data) {
                    result = data.length === books.length;
                }
            };
            spyOn(spy, 'handler').and.callThrough();
            collection.addRange(books);
            collection.on(spaMVP.CollectionEvents.DeletedItems, spy.handler);
            collection.clear();
            expect(spy.handler).toHaveBeenCalled();
            expect(collection.size).toEqual(0);
            expect(result).toBeTruthy();
        });
        it('should delete an item on item destroy', function () {
            var collection = getCollection();
            var books = getBooks(20);
            var spy = jasmine.createSpyObj('spy', ['handler']);
            collection.on(spaMVP.CollectionEvents.DeletedItems, spy.handler);
            collection.addRange(books);
            books.forEach(function (book) {
                var size = collection.size;
                book.destroy();
                expect(spy.handler).toHaveBeenCalledWith([book]);
                expect(collection.size).toEqual(size - 1);
            });
            expect(spy.handler).toHaveBeenCalledTimes(books.length);
            expect(collection.size).toBe(0);
        });
    });
    describe('Updating', function () {
        it('should notify for updated item', function () {
            var collection = getCollection();
            var books = getBooks(20);
            var spy = jasmine.createSpyObj('spy', ['handler']);
            collection.on(spaMVP.CollectionEvents.UpdatedItem, spy.handler);
            collection.addRange(books);
            books.forEach(function (book) {
                book.change();
                expect(spy.handler).toHaveBeenCalledWith(book);
            });
            expect(spy.handler).toHaveBeenCalledTimes(books.length);
        });
    });
    it('should return false when does not constain given item', function () {
        var collection = getCollection();
        var book = new Book(1);
        expect(collection.contains(book)).toBeFalsy();
    });
    it('should return true when constains given item', function () {
        var collection = getCollection();
        var book = new Book(1);
        collection.add(book);
        expect(collection.contains(book)).toBeTruthy();
    });
    it('any should return false when constains no items', function () {
        var collection = getCollection();
        expect(collection.any()).toBeFalsy();
    });
    it('any should return true when constains at least one item', function () {
        var collection = getCollection();
        var book = new Book(1);
        collection.add(book);
        expect(collection.any()).toBeTruthy();
    });
});
//# sourceMappingURL=Collection-tests.js.map