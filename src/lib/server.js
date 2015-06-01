import 'core-js/fn/object/entries';
import { EventEmitter } from 'events';

import mapValues from 'map-values';
import Promise from 'core-js/library/fn/promise';


// queue functions to call in some unspecified future
var queuedRandomAsync = (function(min, max) {
    var timer;
    var queue = [];

    function drain() {
        timer = window.setTimeout(function() {
            var fn = queue.pop();

            fn[0].call(fn[1]);

            if(queue.length) {
                drain();
            }
        }, Math.floor(min + (Math.random() * (max - min))));
    }

    return function queuedRandomAsync(fn, context) {
        queue.push([ fn, context ]);

        if(!timer) {
            drain();
        }
    };
})(0, 50); // 0 to 50 ms


function _createRequestFacade(request, loadEndCallback) {
    var loaded = 0;
    var total = 0;
    var responseHeaders = {};
    var status = 0;
    var response = null;
    var error = null;

    function _getCurrentProgress() {
        // posiiton and totalSize are aliases for FF
        // found here: http://www.opensource.apple.com/source/WebCore/WebCore-1298/xml/XMLHttpRequestProgressEvent.h
        return {
            loaded: loaded,
            total: total,
            position: loaded,
            totalSize: total
        };
    }

    return {
        url: request.url,
        origin: request.origin,
        method: request.method,
        requestHeaders: request.headers,
        data: request.data,
        getResponse: function() {
            return {
                loaded: loaded,
                total: total,
                headers: responseHeaders,
                status: status,
                response: response,
                error: error
            };
        },
        sendHeaders: function(_responseHeaders_) {
            responseHeaders = mapValues(_responseHeaders_, function(value) {
                if(!Array.isArray(value)) {
                    return value.split(',').map(function(header) {
                        return header.trim();
                    });
                } else {
                    return value;
                }
            });

            return new Promise(function(resolve) {
                if(request.async) {
                    queuedRandomAsync(function() {
                        request.onheaders(responseHeaders);

                        resolve();
                    });
                } else {
                    request.onheaders(responseHeaders);

                    resolve();
                }
            });
        },
        sendProgress: function(_loaded_) {
            loaded = _loaded_;

            return new Promise(function(resolve) {
                if(request.async) {
                    queuedRandomAsync(function() {
                        request.onprogress(_getCurrentProgress());

                        resolve();
                    });
                } else {
                    request.onprogress(_getCurrentProgress());

                    resolve();
                }
            });
        },
        sendResponse: function(_status_, _response_) {
            status = _status_;
            response = _response_ + '';

            return new Promise(function(resolve) {
                if(request.async) {
                    queuedRandomAsync(function() {
                        request.onresponse(status, response);

                        resolve();
                    });
                } else {
                    request.onresponse(status, response);

                    resolve();
                }
            }).then(loadEndCallback);
        },
        sendError: function(_error_) {
            error = _error_;

            return new Promise(function(resolve) {
                if(request.async) {
                    queuedRandomAsync(function() {
                        request.onerror(error, _getCurrentProgress());

                        resolve();
                    });
                } else {
                    request.onerror(error, _getCurrentProgress());

                    resolve();
                }
            }).then(loadEndCallback);
        }
    };
}


class HttpServer extends EventEmitter {
    constructor() {
        super();

        this._pending = [];
        this._finished = [];
    }

    /**
     * @method receive - takes request
     * @access public
     * @param  {Object} request - request to receive
     */
    receive(request) {
        var req = _createRequestFacade(request, function() {
            var index = this._pending.indexOf(req);

            if(index !== -1) {
                this._pending.splice(index, 1);
                this._finished.push(req);
            }

            return true;
        }.bind(this));

        this._pending.push(req);
        this.emit('request', req);
    }

    getPendingRequests() {
        return this._pending;
    }

    getFinishedRequests() {
        return this._finished;
    }

    finishAll() {
        for(let [ , request] of Object.entries(this._pending)) {
            request.sendError(new Error('ERR_CONNECTION_REFUSED'));
        }
    }
}


export default new HttpServer();
