// see: http://www.w3.org/TR/XMLHttpRequest/
import util from 'util';
import extend from 'extend';

import server from './server';

import {
    statusMessages,
    responseTypes,
    notAllowedHeaders,
    unsupportedMethods,
    supportedMethods,
    parseUri,
    makeXMLResponse,
    createProgressEvent,
    Event,
    XMLHttpRequestUpload,
    XMLHttpRequestEventTarget
} from './request-helpers';


export default function XMLHttpRequest() {
    XMLHttpRequestEventTarget.call(this);

    // These are internal flags and data structures
    this._requestHeaders = {};
    this._responseHeaders = {};
    this._method = '';
    this._url = '';
    this._urlParts = { };
    this._async = false;
    this._user = null;
    this._password = null;
    this._loaded = 0;
    this._total = 0;

    this.response = null;
    this.responseText = null;

    this.upload = new XMLHttpRequestUpload();
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

        this._url = url + '';
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
        this.dispatchEvent(createProgressEvent('loadstart', {
            loaded: 0,
            total: 0,
            position: 0,
            totalSize: 0
        }));

        var headers = this._requestHeaders;
        var origin = '';

        if(this.timeout) {
            setTimeout(function() {
                this.readyState = this.DONE;

                this.dispatchEvent(new Event('readystatechange'));
                this.dispatchEvent(new Event('progress'));
                this.dispatchEvent(new Event('timeout'));
                this.dispatchEvent(createProgressEvent('loadend', this));
            }.bind(this), this.timeout);
        }

        server.receive({
            async: this._async,
            url: this._url,
            method: this._method,
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
            onprogress: function (progress) {
                this.readyState = this.LOADING;

                this.dispatchEvent(new Event('readystatechange'));
                this.dispatchEvent(createProgressEvent('progress', progress));
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
                this.dispatchEvent(createProgressEvent('load', this));
                this.dispatchEvent(createProgressEvent('loadend', this));
            }.bind(this),
            onerror: function (exception) {
                this.readyState = this.DONE;

                this.dispatchEvent(new Event('readystatechange'));
                this.dispatchEvent(createProgressEvent('progress', this));
                this.dispatchEvent(createProgressEvent('error', this));
                this.dispatchEvent(createProgressEvent('loadend', this));

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

        this.dispatchEvent(new Event('readystatechange'));
        this.dispatchEvent(createProgressEvent('progress', this));
        this.dispatchEvent(createProgressEvent('abort', this));
        this.dispatchEvent(createProgressEvent('loadend', this));

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
