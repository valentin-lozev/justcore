/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe('UrlHash', () => {

    function getIt(): spaMVP.UrlHash {
        return new spaMVP.UrlHash();
    }

    it('should have empty string set as default value', () => {
        let hash = getIt();

        expect(hash.value).toEqual('');
    });

    it('should have an empty array of tokens when value is not set', () => {
        let hash = getIt();

        expect(Array.isArray(hash.tokens)).toBeTruthy();
        expect(hash.tokens.length).toEqual(0);
    });

    it('should have empty array of query params when value is not set', () => {
        let hash = getIt();

        expect(Array.isArray(hash.queryParams)).toBeTruthy();
        expect(hash.queryParams.length).toEqual(0);
    });

    it('should set empty string when value is null', () => {
        let hash = getIt();

        hash.value = null;

        expect(hash.value).toEqual('');
        expect(hash.tokens.length).toEqual(0);
    });

    it('should set empty string when value is undefined', () => {
        let hash = getIt();

        hash.value = undefined;

        expect(hash.value).toEqual('');
        expect(hash.tokens.length).toEqual(0);
    });

    it('should split url by slashes when query params are missing', () => {
        let hash = getIt();
        let url = '/books/edit/';

        hash.value = url;

        expect(hash.value).toEqual(url);
        expect(hash.tokens.length).toEqual(2);
        expect(hash.tokens[0]).toEqual('books');
        expect(hash.tokens[1]).toEqual('edit');
    });

    it('should split url by slashes when there are query params', () => {
        let hash = getIt();
        let url = '/books/edit?page=1&id=-11&title=book';

        hash.value = url;

        expect(hash.value).toEqual(url);
        expect(hash.tokens.length).toEqual(2);
        expect(hash.tokens[0]).toEqual('books');
        expect(hash.tokens[1]).toEqual('edit');
        expect(hash.queryParams.length).toEqual(3);
        expect(hash.queryParams[0]).toEqual({ key: 'page', value: '1' });
        expect(hash.queryParams[1]).toEqual({ key: 'id', value: '-11' });
        expect(hash.queryParams[2]).toEqual({ key: 'title', value: 'book' });
    });

    it('should parse query params case sensitive', () => {
        let hash = getIt();
        let url = '/books/?Page=1&id=-11&tiTle=Book';

        hash.value = url;

        expect(hash.value).toEqual(url);
        expect(hash.tokens.length).toEqual(1);
        expect(hash.tokens[0]).toEqual('books');
        expect(hash.queryParams.length).toEqual(3);
        expect(hash.queryParams[0]).toEqual({ key: 'Page', value: '1' });
        expect(hash.queryParams[1]).toEqual({ key: 'id', value: '-11' });
        expect(hash.queryParams[2]).toEqual({ key: 'tiTle', value: 'Book' });
    });

    it('should parse query value as empty when value is missing', () => {
        let hash = getIt();
        let url = '/books?page=1&id';

        hash.value = url;

        expect(hash.tokens.length).toEqual(1);
        expect(hash.tokens[0]).toEqual('books');
        expect(hash.queryParams.length).toEqual(2);
        expect(hash.queryParams[0]).toEqual({ key: 'page', value: '1' });
        expect(hash.queryParams[1]).toEqual({ key: 'id', value: '' });
    });
});