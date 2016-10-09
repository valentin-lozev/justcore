/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("Route", () => {

    function getRoute(pattern: string, callback?: (routeParams: any) => void): spaMVP.plugins.routing.Route {
        callback = callback || function (): void { return; };
        return new spaMVP.plugins.routing.Route(pattern, callback);
    }

    function getHash(value: string): spaMVP.plugins.routing.UrlHash {
        let result = new spaMVP.plugins.routing.UrlHash();
        result.value = value;
        return result;
    }

    it("should throw an error when pattern is null or undefined", () => {
        expect(() => getRoute(null)).toThrow();
        expect(() => getRoute(undefined)).toThrow();
    });

    it("should have empty array of tokens when pattern is empty string", () => {
        let route = getRoute("");
        let tokens = route.getTokens();

        expect(Array.isArray(tokens)).toBeTruthy();
        expect(tokens.length).toEqual(0);
    });

    it("should split pattern by / (slash) when dynamic params are missing", () => {
        let route = getRoute("/books/book/edit/");
        let tokens = route.getTokens();

        expect(tokens.length).toEqual(3);
        expect(tokens[0]).toEqual({ name: "books", isDynamic: false });
        expect(tokens[1]).toEqual({ name: "book", isDynamic: false });
        expect(tokens[2]).toEqual({ name: "edit", isDynamic: false });
    });

    it("should split pattern by / (slash) when there are dynamic params", () => {
        let route = getRoute("/books/{id}/edit/{page}");
        let tokens = route.getTokens();

        expect(tokens.length).toEqual(4);
        expect(tokens[0]).toEqual({ name: "books", isDynamic: false });
        expect(tokens[1]).toEqual({ name: "id", isDynamic: true });
        expect(tokens[2]).toEqual({ name: "edit", isDynamic: false });
        expect(tokens[3]).toEqual({ name: "page", isDynamic: true });
    });

    it("should parse dynamic params case sensitive", () => {
        let route = getRoute("/books/{id}/{Page}");
        let tokens = route.getTokens();

        expect(tokens[1]).toEqual({ name: "id", isDynamic: true });
        expect(tokens[2]).toEqual({ name: "Page", isDynamic: true });
    });

    it("should not be equal to hash of different tokens length", () => {
        let route = getRoute("/books/{id}/{Page}");
        let hash = getHash("books/1/");

        expect(route.getTokens().length).toEqual(3);
        expect(hash.tokens.length).toEqual(2);
        expect(route.equals(hash)).toBeFalsy();
    });

    it("should not be equal to hash with different token name", () => {
        let route = getRoute("/books/{id}/{Page}");
        let hash = getHash("/book/100/1");

        expect(route.getTokens()[0].name).toEqual("books");
        expect(hash.tokens[0]).toEqual("book");
        expect(route.equals(hash)).toBeFalsy();
    });

    it("should be equal to hash tokens when dynamic params are missing", () => {
        let route = getRoute("/books/book/edit");
        let hash = getHash("books/book/edit");

        expect(route.getTokens().length).toEqual(3);
        expect(hash.tokens.length).toEqual(3);
        expect(route.equals(hash)).toBeTruthy();
    });

    it("should be equal to hash tokens when there are dynamic params", () => {
        let route = getRoute("/books/{id}/{page}");
        let hash = getHash("books/123/1");

        expect(route.getTokens().length).toEqual(3);
        expect(hash.tokens.length).toEqual(3);
        expect(route.equals(hash)).toBeTruthy();
    });

    it("should be equal to hash tokens when there are dynamic params case insensitive", () => {
        let route = getRoute("/BOOKS/{id}/{page}");
        let hash = getHash("/books/123/1");

        expect(route.getTokens().length).toEqual(3);
        expect(hash.tokens.length).toEqual(3);
        expect(route.equals(hash)).toBeTruthy();
    });

    it("should execute callback with no dynamic params when pattern is without dynamic params and query params", () => {
        let callback = {
            run: (routeParams: any): void => { return; }
        };
        spyOn(callback, "run");
        let route = getRoute("/books", callback.run);

        route.start(getHash("/books"));

        expect(callback.run).toHaveBeenCalledWith({});
    });

    it("should execute callback when having dynamic params", () => {
        let callback = {
            run: (routeParams: any): void => { return; }
        };
        spyOn(callback, "run");
        let route = getRoute("/books/{id}/{page}", callback.run);

        route.start(getHash("/books/123/1"));

        expect(callback.run).toHaveBeenCalledWith({ id: "123", page: "1" });
    });

    it("should parse dynamic params case sensitive", () => {
        let callback = {
            run: (routeParams: any): void => { return; }
        };
        spyOn(callback, "run");
        let route = getRoute("/books/{ID}/{Page}", callback.run);

        route.start(getHash("/books/123/1"));

        expect(callback.run).toHaveBeenCalledWith({ ID: "123", Page: "1" });
    });

    it("should execute callback when having dynamic params and query params", () => {
        let callback = {
            run: (routeParams: any): void => { return; }
        };
        spyOn(callback, "run");
        let route = getRoute("/books/{id}/{page}", callback.run);

        route.start(getHash("/books/123/1?search=asd&filter=true"));

        expect(callback.run).toHaveBeenCalledWith({
            id: "123",
            page: "1",
            search: "asd",
            filter: "true"
        });
    });

    it("should parse dynamic parse with higher priority than query params", () => {
        let callback = {
            run: (routeParams: any): void => { return; }
        };
        spyOn(callback, "run");
        let route = getRoute("/books/{id}/{page}", callback.run);

        route.start(getHash("/books/123/100?id=0&page=0"));

        expect(callback.run).toHaveBeenCalledWith({
            id: "123",
            page: "100"
        });
    });
});