/* global suite, test */
import { assert } from 'chai';

import server from '../src/lib/server';


suite('API', () => {

    test('Should be an object', () => {
        assert.isObject(server);
    });

    test('Should have a bunch of methods', () => {
        assert.isFunction(server.receive);
        assert.isFunction(server.getPendingRequests);
        assert.isFunction(server.getFinishedRequests);
    });

});