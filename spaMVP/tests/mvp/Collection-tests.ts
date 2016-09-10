/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe('Collection', function () {

    class Book extends spaMVP.Model implements spaMVP.Equatable<Book> {
        id: number;
        constructor(id: number) {
            super();
            this.id = id;
        }

        hash(): number {
            return this.id | 17;
        }

        equals(other: Book) {
            return other && this.id === other.id;
        }
    }

    function getBooks(count: number): Array<Book> {
        let result = new Array(count);
        for (let i = 0; i < count; i++) {
            result[i] = new Book(i);
        }

        return result;
    }

    function getCollection(): spaMVP.Collection<Book> {
        return new spaMVP.Collection<Book>();
    }

    it('should be an instance of Model', function () {
        expect(getCollection() instanceof spaMVP.Model).toBeTruthy();
    });

    it('should have size', function () {
        expect(getCollection().size).toEqual(0);
    });

    describe('Adding', () => {
        it('should return true when add new item', function () {
            let collection = getCollection();
            let book = new Book(1);

            let result = collection.add(book);

            expect(result).toBeTruthy();
        });

        it('should return false when add duplicated item', function () {
            let collection = getCollection();
            let book = new Book(0);
            collection.add(book);

            let result = collection.add(book);

            expect(result).toBeFalsy();
            expect(collection.size).toEqual(1);
        });

        it('should return true when add range of items', function () {
            let collection = getCollection();
            let size = 10;

            let result = collection.addRange(getBooks(size));

            expect(result).toBeTruthy();
            expect(collection.size).toEqual(size);
        });

        it('should return false when add range of duplicated items', function () {
            let collection = getCollection();
            let size = 10;
            collection.addRange(getBooks(size));

            let result = collection.addRange(getBooks(size));

            expect(result).toBeFalsy();
            expect(collection.size).toEqual(size);
        });

        it('should notify for added items', function () {
            let collection = getCollection();
            let books = getBooks(20);
            let spy = jasmine.createSpyObj('spy', ['handler']);
            collection.on(spaMVP.CollectionEvents.AddedItems, spy.handler);

            collection.addRange(books);

            expect(spy.handler).toHaveBeenCalledWith(books);
        });
    });

    describe('Deleting', () => {
        it('should return true when remove existing item', function () {
            let collection = getCollection();
            let book = getBooks(1)[0];
            collection.add(book);

            let result = collection.remove(book);

            expect(result).toBeTruthy();
            expect(collection.size).toEqual(0);
        });

        it('should return false when remove unexisting item', function () {
            let collection = getCollection();

            let result = collection.remove(new Book(1));

            expect(result).toBeFalsy();
            expect(collection.size).toEqual(0);
        });

        it('should return true when remove range of items', function () {
            let collection = getCollection();
            let size = 10;
            let books = getBooks(size);
            collection.addRange(books);

            let result = collection.removeRange(books);

            expect(result).toBeTruthy();
            expect(collection.size).toEqual(0);
        });

        it('should return false when remove range of unexisting items', function () {
            let collection = getCollection();

            let result = collection.removeRange(getBooks(10));

            expect(result).toBeFalsy();
            expect(collection.size).toEqual(0);
        });

        it('should notify for deleted items', function () {
            let collection = getCollection();
            let books = getBooks(20);
            let spy = jasmine.createSpyObj('spy', ['handler']);
            collection.on(spaMVP.CollectionEvents.DeletedItems, spy.handler);
            collection.addRange(books);

            collection.removeRange(books);

            expect(spy.handler).toHaveBeenCalledWith(books);
            expect(collection.size).toEqual(0);
        });

        it('should remove all items when clear is being invoked', function () {
            let result = false;
            let collection = getCollection();
            let books = getBooks(20);
            let spy = {
                handler: data => {
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
            let collection = getCollection();
            let books = getBooks(20);
            let spy = jasmine.createSpyObj('spy', ['handler']);
            collection.on(spaMVP.CollectionEvents.DeletedItems, spy.handler);
            collection.addRange(books);

            books.forEach(book => {
                let size = collection.size;
                book.destroy();
                expect(spy.handler).toHaveBeenCalledWith([book]);
                expect(collection.size).toEqual(size - 1);
            });

            expect(spy.handler).toHaveBeenCalledTimes(books.length);
            expect(collection.size).toBe(0);
        });
    });

    describe('Updating', () => {
        it('should notify for updated item', function () {
            let collection = getCollection();
            let books = getBooks(20);
            let spy = jasmine.createSpyObj('spy', ['handler']);
            collection.on(spaMVP.CollectionEvents.UpdatedItem, spy.handler);
            collection.addRange(books);

            books.forEach(book => {
                book.change();
                expect(spy.handler).toHaveBeenCalledWith(book);
            });

            expect(spy.handler).toHaveBeenCalledTimes(books.length);
        });
    });

    it('should return false when does not constain given item', function () {
        let collection = getCollection();
        let book = new Book(1);

        expect(collection.contains(book)).toBeFalsy();
    });

    it('should return true when constains given item', function () {
        let collection = getCollection();
        let book = new Book(1);
        collection.add(book);

        expect(collection.contains(book)).toBeTruthy();
    });

    it('any should return false when constains no items', function () {
        let collection = getCollection();

        expect(collection.any()).toBeFalsy();
    });

    it('any should return true when constains at least one item', function () {
        let collection = getCollection();
        let book = new Book(1);
        collection.add(book);

        expect(collection.any()).toBeTruthy();
    });
});