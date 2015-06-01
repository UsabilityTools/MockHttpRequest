/* global suite, test, setup, teardown */

import { assert } from 'chai';

import server from '../src/lib/server';
import Request from '../src/lib/request';


suite('API', () => {

    test('Should be a function that can be instantiated', () => {
        assert.isFunction(Request);

        assert.doesNotThrow(() => new Request());

        assert.instanceOf(new Request(), Request);
    });

    test('Should have a bunch of properties', () => {
        assert.isDefined(Request.UNSENT);
        assert.isDefined(Request.OPENED);
        assert.isDefined(Request.HEADERS_RECEIVED);
        assert.isDefined(Request.LOADING);
        assert.isDefined(Request.DONE);
    });


    suite('instance', () => {
        let request;

        setup(() => {
            request = new Request();
        });

        teardown(() => {
            request = null;
        });


        test('Should have a bunch of methods', () => {
            assert.isFunction(request.send);
            assert.isFunction(request.open);
            assert.isFunction(request.abort);
            assert.isFunction(request.setRequestHeader);
            assert.isFunction(request.getResponseHeader);
            assert.isFunction(request.getAllResponseHeaders);
            assert.isFunction(request.overrideMimeType);

            assert.isFunction(request.onreadystatechange);
            assert.isFunction(request.onabort);
            assert.isFunction(request.onerror);
            assert.isFunction(request.onload);
            assert.isFunction(request.onloadend);
            assert.isFunction(request.onloadstart);
            assert.isFunction(request.onprogress);
            assert.isFunction(request.ontimeout);

            assert.isFunction(request.addEventListener);
            assert.isFunction(request.removeEventListener);
            assert.isFunction(request.dispatchEvent);
        });

        test('Should have a bunch of properties', () => {
            assert.isDefined(request.response);
            assert.isDefined(request.responseText);
            assert.isDefined(request.readyState);
            assert.isDefined(request.status);
            assert.isDefined(request.statusText);
            assert.isDefined(request.timeout);
            assert.isDefined(request.upload);
            assert.isDefined(request.withCredentials);
            assert.isDefined(request.responseType);
            assert.isDefined(request.responseURL);
            assert.isDefined(request.responseXML);
            assert.isDefined(request.upload);
        });

        test('Should have the same properties like class', () => {
            assert.isDefined(request.UNSENT);
            assert.isDefined(request.OPENED);
            assert.isDefined(request.HEADERS_RECEIVED);
            assert.isDefined(request.LOADING);
            assert.isDefined(request.DONE);
        });

    });

});


suite('sending request', () => {
    let request;
    let url = 'http://example.com/resource/1';

    setup((done) => {
        request = new Request();
        request.open('GET', url);
        request.send();

        setTimeout(done, 50);
    });

    teardown(() => {
        request = null;
        server.finishAll();
    });


    test('should send request to server when `open` and `send` methods were called', () => {
        let reqs = server.getPendingRequests();
        assert.equal(reqs.length, 1);

        let req = reqs[0];
        assert.isDefined(req);

        assert.equal(req.url, url);
        assert.equal(req.method, 'GET');
    });


    test('should receive response from server', (done) => {
        let req = server.getPendingRequests()[0];

        req.sendHeaders({
            'Content-type': 'text/plain'
        }).then(() =>
            req.sendResponse(200, 'my response')
        ).then(() => {
            assert.equal(req.status, 200);
            assert.equal(req.responseText, 'my response');
            
            done();
        });

    });

});
