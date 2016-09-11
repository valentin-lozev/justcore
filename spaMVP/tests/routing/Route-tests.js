/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
describe('Route', function () {
    function getRoute(pattern, callback) {
        return new spaMVP.Hidden.Route(pattern, callback);
    }
    function getHash(value) {
        var result = new spaMVP.Hidden.UrlHash();
        result.value = value;
        return result;
    }
    it('should throw an error when pattern is null or undefined', function () {
        expect(function () { return getRoute(null); }).toThrow();
        expect(function () { return getRoute(undefined); }).toThrow();
    });
    it('should have empty array of tokens when pattern is empty string', function () {
        var route = getRoute('');
        var tokens = route.getTokens();
        expect(Array.isArray(tokens)).toBeTruthy();
        expect(tokens.length).toEqual(0);
    });
    it('should split pattern by / (slash) when dynamic params are missing', function () {
        var route = getRoute('/books/book/edit/');
        var tokens = route.getTokens();
        expect(tokens.length).toEqual(3);
        expect(tokens[0]).toEqual({ name: 'books', isDynamic: false });
        expect(tokens[1]).toEqual({ name: 'book', isDynamic: false });
        expect(tokens[2]).toEqual({ name: 'edit', isDynamic: false });
    });
    it('should split pattern by / (slash) when there are dynamic params', function () {
        var route = getRoute('/books/{id}/edit/{page}');
        var tokens = route.getTokens();
        expect(tokens.length).toEqual(4);
        expect(tokens[0]).toEqual({ name: 'books', isDynamic: false });
        expect(tokens[1]).toEqual({ name: 'id', isDynamic: true });
        expect(tokens[2]).toEqual({ name: 'edit', isDynamic: false });
        expect(tokens[3]).toEqual({ name: 'page', isDynamic: true });
    });
    it('should parse dynamic params case sensitive', function () {
        var route = getRoute('/books/{id}/{Page}');
        var tokens = route.getTokens();
        expect(tokens[1]).toEqual({ name: 'id', isDynamic: true });
        expect(tokens[2]).toEqual({ name: 'Page', isDynamic: true });
    });
    it('should not be equal to hash of different tokens length', function () {
        var route = getRoute('/books/{id}/{Page}');
        var hash = getHash('books/1/');
        expect(route.getTokens().length).toEqual(3);
        expect(hash.tokens.length).toEqual(2);
        expect(route.equals(hash)).toBeFalsy();
    });
    it('should not be equal to hash with different token name', function () {
        var route = getRoute('/books/{id}/{Page}');
        var hash = getHash('/book/100/1');
        expect(route.getTokens()[0].name).toEqual('books');
        expect(hash.tokens[0]).toEqual('book');
        expect(route.equals(hash)).toBeFalsy();
    });
    it('should be equal to hash tokens when dynamic params are missing', function () {
        var route = getRoute('/books/book/edit');
        var hash = getHash('books/book/edit');
        expect(route.getTokens().length).toEqual(3);
        expect(hash.tokens.length).toEqual(3);
        expect(route.equals(hash)).toBeTruthy();
    });
    it('should be equal to hash tokens when there are dynamic params', function () {
        var route = getRoute('/books/{id}/{page}');
        var hash = getHash('books/123/1');
        expect(route.getTokens().length).toEqual(3);
        expect(hash.tokens.length).toEqual(3);
        expect(route.equals(hash)).toBeTruthy();
    });
    it('should be equal to hash tokens when there are dynamic params case insensitive', function () {
        var route = getRoute('/BOOKS/{id}/{page}');
        var hash = getHash('/books/123/1');
        expect(route.getTokens().length).toEqual(3);
        expect(hash.tokens.length).toEqual(3);
        expect(route.equals(hash)).toBeTruthy();
    });
    it('should execute callback with no dynamic params when pattern is without dynamic params and query params', function () {
        var callback = {
            run: function (routeParams) { }
        };
        spyOn(callback, 'run');
        var route = getRoute('/books', callback.run);
        route.start(getHash('/books'));
        expect(callback.run).toHaveBeenCalledWith({});
    });
    it('should execute callback when having dynamic params', function () {
        var callback = {
            run: function (routeParams) { }
        };
        spyOn(callback, 'run');
        var route = getRoute('/books/{id}/{page}', callback.run);
        route.start(getHash('/books/123/1'));
        expect(callback.run).toHaveBeenCalledWith({ id: '123', page: '1' });
    });
    it('should parse dynamic params case sensitive', function () {
        var callback = {
            run: function (routeParams) { }
        };
        spyOn(callback, 'run');
        var route = getRoute('/books/{ID}/{Page}', callback.run);
        route.start(getHash('/books/123/1'));
        expect(callback.run).toHaveBeenCalledWith({ ID: '123', Page: '1' });
    });
    it('should execute callback when having dynamic params and query params', function () {
        var callback = {
            run: function (routeParams) { }
        };
        spyOn(callback, 'run');
        var route = getRoute('/books/{id}/{page}', callback.run);
        route.start(getHash('/books/123/1?search=asd&filter=true'));
        expect(callback.run).toHaveBeenCalledWith({
            id: '123',
            page: '1',
            search: 'asd',
            filter: 'true'
        });
    });
    it('should parse dynamic parse with higher priority than query params', function () {
        var callback = {
            run: function (routeParams) { }
        };
        spyOn(callback, 'run');
        var route = getRoute('/books/{id}/{page}', callback.run);
        route.start(getHash('/books/123/100?id=0&page=0'));
        expect(callback.run).toHaveBeenCalledWith({
            id: '123',
            page: '100'
        });
    });
});
//# sourceMappingURL=Route-tests.js.map