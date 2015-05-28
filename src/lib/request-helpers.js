import extend from 'extend';


export class Event {
    constructor(type, data) {
        if (data) {
            this.setData(data);
        }

        this.type = type;
        this.isPropagationStopped = false;
    }

    setData(data) {
        if ('object' !== typeof data) {
            throw new Error('Event data is not an object.');
        }

        for (let property in data) {
            if (data.hasOwnProperty(property)) {
                this[property] = data[property];
            }
        }
    }

    stopPropagation() {
        this.isPropagationStopped = true;
    }
}


export class ProgressEvent extends Event {
    constructor(...args) {
        super(...args);

        this.lengthComputable = 0;
        this.loaded = 0;
        this.total = 0;
    }
}


export class XMLHttpRequestProgressEvent extends ProgressEvent {
    constructor(...args) {
        super(...args);

        this.position = 0;
        this.totalSize = 0;
    }
}


class EventTarget {
    constructor() {
        this._listeners = {};
    }

    addEventListener(type, listener) {
        if(!listener) {
            return;
        }

        if(!this._listeners.hasOwnProperty(type)) {
            this._listeners[type] = [];
        }

        if(this._listeners[type].indexOf(listener) === -1) {
            this._listeners[type].push(listener);
        }
    }

    dispatchEvent(event) {
        if(event._dispatched) {
            throw 'InvalidStateError';
        }

        event._dispatched = true;

        let type = event.type;
        if(('undefined' === typeof type) || (type === '')) {
            throw 'UNSPECIFIED_EVENT_TYPE_ERR';
        }

        let listenerArray = (this._listeners[type] || []);

        let dummyListener = this['on' + type];
        if('function' === typeof dummyListener) {
            listenerArray = listenerArray.concat(dummyListener);
        }

        let stopImmediatePropagation = false;

        event.cancelable = true;
        event.defaultPrevented = false;
        event.isTrusted = false;
        event.preventDefault = function() {
            if(this.cancelable) {
                this.defaultPrevented = true;
            }
        };

        event.stopImmediatePropagation = function() {
            stopImmediatePropagation = true;
        };

        event.target = this;
        event.timeStamp = new Date().getTime();

        listenerArray.every((listener) => {
            if(stopImmediatePropagation) {
                return false;
            }

            listener.call(this, event);
        });
          
        return !event.defaultPrevented;
    }

    removeEventListener(type, listener) {
        if(!listener || !this._listeners.hasOwnProperty(type)) {
            return;
        }

        let index = this._listeners[type].indexOf(listener);

        if(index !== -1) {
            this._listeners[type].splice(index, 1);
        }

        if(!this._listeners[type].length) {
            delete this._listeners[type];
        }
    }
}


export class XMLHttpRequestEventTarget extends EventTarget {
    constructor() {
        super();
    }

    onabort() { }

    onerror() { }

    onload() { }

    onloadend() { }

    onloadstart() { }

    onprogress() { }

    ontimeout() { }
}


export class XMLHttpRequestUpload extends XMLHttpRequestEventTarget {
    constructor() {
        super();
    }
}


export const statusMessages = {
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

export const responseTypes = {
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

export const notAllowedHeaders = [
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

export const unsupportedMethods = [ 'CONNECT', 'TRACE', 'TRACK' ];
export const supportedMethods = [ 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT' ];


// Parse RFC 3986 compliant URIs.
// Based on parseUri by Steven Levithan <stevenlevithan.com>
// See http://blog.stevenlevithan.com/archives/parseuri
export function parseUri(str) {
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


export function makeXMLResponse(data) {
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
            xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
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

export function callOldSchoolCallbackOnEvent(eventName) {
    var self = this;
    self.addEventListener(eventName, function(e) {
        var fn = self['on' + eventName];

        if('function' === typeof fn) {
            fn.call(self, e);
        }
    }, false);
}


export function createProgressEvent(eventName, progress) {
    return extend(
        new XMLHttpRequestProgressEvent(eventName), {
        loaded: progress._loaded,
        total: progress._total,
        position: progress._loaded,
        totalSize: progress._total
    });
}