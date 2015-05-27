var EventTarget = require('event-target');
var server = require('./server');

var statusMessages = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Moved Temporarily',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Time-out',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Large',
    415: 'Unsupported Media Type',
    416: 'Requested range not satisfiable',
    417: 'Expectation Failed',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Time-out',
    505: 'HTTP Version not supported',
    507: 'Insufficient Storage'
};

var responseTypes = {
    default: '',
    ArrayBuffer: 'arraybuffer',
    Blob: 'blob',
    Document: 'document',
    JSON: 'json',
    text: 'text',
    MozBlob: 'moz-blob',
    MozChunkedTest: 'moz-chunked-text',
    MozChunkedArrayBuffer: 'moz-chunked-arraybuffer'
};

var notAllowedHeaders = [
    'accept-charset',
    'accept-encoding',
    'connection',
    'content-length',
    'cookie',
    'cookie2',
    'content-transfer-encoding',
    'date',
    'expect',
    'host',
    'keep-alive',
    'referer',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'user-agent',
    'via'
];

var unsupportedMethods = [ 'CONNECT', 'TRACE', 'TRACK' ];
var supportedMethods = [ 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT' ];

function randomAsync (fn, context) {
    window.setTimeout(function() {
        fn.call(context);
    }, Math.floor(Math.random() * 50));
}


// Parse RFC 3986 compliant URIs.
// Based on parseUri by Steven Levithan <stevenlevithan.com>
// See http://blog.stevenlevithan.com/archives/parseuri
function parseUri(str) {
    var pattern = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
    var key = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];
    var querypattern = /(?:^|&)([^&=]*)=?([^&]*)/g;

    var match = pattern.exec(str);
    var uri = {};
    var i = 14;
    while (i--) {
        uri[key[i]] = match[i] || '';
    }

    uri.queryKey = {};
    uri[key[12]].replace(querypattern, function ($0, $1, $2) {
        if ($1) {
            uri.queryKey[$1] = $2;
        }
    });

    return uri;
}


function makeXMLResponse(data) {
    var xmlDoc = null;
    // according to specs from point 3.7.5:
    // '1. If the response entity body is null terminate these steps
    //     and return null.
    //  2. If final MIME type is not null, text/xml, application/xml,
    //     and does not end in +xml terminate these steps and return null.
    
    // Attempt to produce an xml response
    // and it will fail if not a good xml
    try {
        if (window.DOMParser) {
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(data, 'text/xml');
        } else { // Internet Explorer
            xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
            xmlDoc.async = 'false';
            xmlDoc.loadXML(data);
        }
    } catch (err) {
        // according to specs from point 3.7.5:
        // '3. Let document be a cookie-free Document object that
        // represents the result of parsing the response entity body
        // into a document tree following the rules from the XML
        //  specifications. If this fails (unsupported character
        // encoding, namespace well-formedness error etc.), terminate
        // these steps return null.'
        xmlDoc = null;
    }

    // parse errors also yield a null.
    if ((xmlDoc && xmlDoc.parseError && xmlDoc.parseError._errorCode !== 0) ||
        (xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName === 'parsererror') ||
        (xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName === 'html' &&
            xmlDoc.documentElement.firstChild &&  xmlDoc.documentElement.firstChild.nodeName === 'body' &&
            xmlDoc.documentElement.firstChild.firstChild && xmlDoc.documentElement.firstChild.firstChild.nodeName === 'parsererror')) {
        xmlDoc = null;
    }

    return xmlDoc;
}


function _callOldSchoolCallbackOnEvent(eventName) {
    var self = this;
    self.addEventListener(eventName, function(e) {
        var fn = self['on' + eventName];

        if('function' === typeof fn) {
            fn.call(self, e);
        }
    }, false);
}

/*
 * Mock XMLHttpRequest (see http://www.w3.org/TR/XMLHttpRequest)
 *
 * Written by Philipp von Weitershausen <philipp@weitershausen.de>
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * For test interaction it exposes the following attributes:
 *
 * - method, url, urlParts, async, user, password
 * - requestText
 *
 * as well as the following methods:
 *
 * - getRequestHeader(header)
 * - setResponseHeader(header, value)
 * - receive(status, data)
 * - err(exception)
 * - authenticate(user, password)
 *
 */
function XMLHttpRequest () {
    // These are internal flags and data structures
    this._error = false;
    this._sent = false;
    this._requestHeaders = {};
    this._responseHeaders = {};

    this.response = null;
    this.responseText = null;

    this.upload = new XMLHttpRequestUpload();

    _callOldSchoolCallbackOnEvent.call(this, 'readystatechange');
}

util.inherits(XMLHttpRequest, XMLHttpRequestEventTarget);

extend(XMLHttpRequest, {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
});

extend(XMLHttpRequest.prototype, {
    /*** State ***/
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4,

    readyState: XMLHttpRequest.UNSENT,
    status: 0,
    statusText: '',

    timeout: 0,
    upload: null,
    withCredentials: false,

    /*** Response ***/
    responseType: responseTypes.default,
    responseURL: '',
    responseXML: null,


    overrideMimeType: function() { },

    // instances should override this
    onreadystatechange: function() { },


    /*** Request ***/

    open: function (method, url, async, user, password) {
        if(arguments.length < 2) {
            throw new Error('2 arguments required, but only ' + arguments.length + ' present');
        }

        method = (method + '').toUpperCase();

        if(unsupportedMethods.indexOf(method) !== -1) {
            throw new Error('\'' + method + '\' HTTP method is unsupported');
        }

        if(supportedMethods.indexOf(method) !== -1) {
            this._method = method;
        }

        thsi._url = url + '';
        this._urlParts = parseUri(this._url);
        this._async = 'undefined' === typeof async ? true : async;
        this._user = 'undefined' === typeof user ? null : user + '';
        this._password = 'undefined' === typeof password ? null : password + '';

        // open no matter what was the method
        this.readyState = this.OPENED;

        // yeah, it's synchronous
        this.dispatchEvent(new Event('readystatechange'));
    },

    setRequestHeader: function (header, value) {
        if(arguments.length < 2) {
            throw new Error('2 arguments required, but only ' + arguments.length + ' present');
        }

        if(this.readyState !== this.OPENED) {
            throw new Error('The object\'s state must be OPENED');
        }

        header = header + '';

        if(
            (notAllowedHeaders.indexOf(header.toLowerCase()) !== -1)
        ) {
            throw Error('Refused to set unsafe header "' + header + '"');
        }

        header = header.toLowerCase();

        if(
            (header.toLowerCase().substr(0, 6) === 'proxy-') ||
            (header.toLowerCase().substr(0, 4) === 'sec-')
        ) {
            // silent fail
            return;
        }

        if (!this._requestHeaders.hasOwnProperty(header)) {
          this._requestHeaders[header] = [ ];
        }

        this._requestHeaders[header].push(value);
    },

    send: function (data) {
        if (this.readyState !== this.OPENED) {
            throw new Error('The object\'s state must be OPENED');
        }

        if ((this._method === 'GET') || (this._method === 'HEAD')) {
            data = null;
        }

        this.dispatchEvent(new Event('readystatechange'));
        
        var headers = this._requestHeaders;
        var origin = window.location.href;

        if(this.timeout) {
            setTimeout(function() {
                this.readyState = this.DONE;

                this.dispatchEvent(new Event('readystatechange'));
                this.dispatchEvent(new Event('timeout'));
            }.bind(this), this.timeout);
        }

        server.receive({
            url: this.url,
            data: data,
            origin: origin,
            headers: headers,
            onheaders: function(headers) {
                this.readyState = this.HEADERS_RECEIVED;

                Object.keys(headers).forEach(function(header) {
                    this._responseHeaders[header.toLowerCase()] = headers[header];
                }, this);

                // all new data have to be available for callback
                this.dispatchEvent(new Event('readystatechange'));
            }.bind(this),
            onresponse: function(status, response) {
                this.readyState = this.DONE;
                this.status = status;
                this.statusText = statusMessages[status];

                this.responseText = response + '';

                var mimetype = this.getResponseHeader('Content-Type');
                mimetype = mimetype && mimetype.split(';', 1)[0];
                if (
                    (mimetype === null) ||
                    (mimetype === 'text/xml') ||
                    (mimetype === 'application/xml') ||
                    (mimetype && mimetype.substring(mimetype.length - 4) === '+xml')
                ) {
                    this.responseXML = makeXMLResponse(response);
                }

                // all new data have to be available for callback
                this.dispatchEvent(new Event('readystatechange'));
            }.bind(this),
            onprogress: function (progress) {
                this.readyState = this.LOADING;

                var e = new XMLHttpRequestProgressEvent('progress');
                e.total = progress.total;
                e.totalSize = progress.totalSize;
                e.position = progress.position;
                e.loaded = progress.loaded;

                this.dispatchEvent(e);

                // it's not necessary to do it before callbacks, this is private data
                Object.keys(this._requestHeaders).forEach(function(header) {
                    delete this._requestHeaders[header];
                }, this);
                
                // but throw exception after
                if (!this.async) {
                    throw exception;
                }
            }.bind(this),
            onerror: function (exception, progress) {
                this.readyState = this.DONE;

                this.dispatchEvent(new Event('readystatechange'));

                var e = new XMLHttpRequestProgressEvent('error');
                e.total = progress.total;
                e.totalSize = progress.totalSize;
                e.position = progress.position;
                e.loaded = progress.loaded;

                this.dispatchEvent(e);

                // it's not necessary to do it before callbacks, this is private data
                Object.keys(this._requestHeaders).forEach(function(header) {
                    delete this._requestHeaders[header];
                }, this);
                
                // but throw exception after
                if (!this.async) {
                    throw exception;
                }
            }.bind(this)
        });
    },

    abort: function () {
        // new readyState has to be available for callbacks
        this.readyState = this.DONE;

        // yes, this is synchronous too
        this.dispatchEvent(new Event('readystatechange'));
        // abort event after readystatechnage
        this.dispatchEvent(new Event('abort'));

        // it's not necessary to do it before callbacks, this is private data
        Object.keys(this._requestHeaders).forEach(function(header) {
            delete this._requestHeaders[header];
        }, this);
    },

    getResponseHeader: function (header) {
        if(arguments.length < 1) {
            throw new Error('1 argument required, but only ' + arguments.length + ' present');
        } else if (this.readyState < this.HEADERS_RECEIVED) {
            return null;
        } else if((header.toLowerCase() === 'set-cookie') && (header.toLowerCase() === 'set-cookie2')) {
            throw new Error('Refused to get unsafe header "' + header + '"');
        } else {
            return this._responseHeaders[header.toLowerCase()].join(',');
        }
    },

    getAllResponseHeaders: function () {
        return Object.keys(this._responseHeaders).filter(function(header) {
            return ((header !== 'set-cookie') && (header !== 'set-cookie2'));
        }).map(function(header) {
            return [ header, this.getResponseHeader(header) ].join(':');
        }, this)
        .join('\r\n');
    }
});


function XMLHttpRequestUpload() {

}

util.inherits(XMLHttpRequestUpload, XMLHttpRequestEventTarget);


function XMLHttpRequestProgressEvent(eventName) {
    ProgressEvent.call(this, eventName);
}

util.inherits(XMLHttpRequestProgressEvent, ProgressEvent);

extend(XMLHttpRequestProgressEvent, {
    position: 0,
    totalSize: 0
});


function ProgressEvent(eventName) {
    Event.call(this, eventName);
}

util.inherits(ProgressEvent, Event);

extend(XMLHttpRequestProgressEvent, {
    lengthComputable: 0,
    loaded: 0,
    total: 0
});


function XMLHttpRequestEventTarget() {
    EventTarget.call(this);

    [
        'onabort',
        'onerror',
        'onload',
        'onloadend',
        'onloadstart',
        'onprogress',
        'ontimeout'
    ].forEach(_callOldSchoolCallbackOnEvent, this);
}

util.inherits(WebSocket, EventTarget);

extend(XMLHttpRequestEventTarget.prototype, {
    // instances should override these
    onabort: function() { },
    onerror: function() { },
    onload: function() { },
    onloadend: function() { },
    onloadstart: function() { },
    onprogress: function() { },
    ontimeout: function() { }
});