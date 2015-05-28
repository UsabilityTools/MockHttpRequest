'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

exports.parseUri = parseUri;
exports.makeXMLResponse = makeXMLResponse;
exports.callOldSchoolCallbackOnEvent = callOldSchoolCallbackOnEvent;
exports.createProgressEvent = createProgressEvent;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _eventTarget = require('event-target');

var _eventTarget2 = _interopRequireDefault(_eventTarget);

var _eventShim = require('event-shim');

var _eventShim2 = _interopRequireDefault(_eventShim);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var ProgressEvent = (function (_Event) {
    function ProgressEvent() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        _classCallCheck(this, ProgressEvent);

        _get(Object.getPrototypeOf(ProgressEvent.prototype), 'constructor', this).call(this);

        this.lengthComputable = 0;
        this.loaded = 0;
        this.total = 0;
    }

    _inherits(ProgressEvent, _Event);

    return ProgressEvent;
})(_eventShim2['default']);

exports.ProgressEvent = ProgressEvent;

var XMLHttpRequestProgressEvent = (function (_ProgressEvent) {
    function XMLHttpRequestProgressEvent() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        _classCallCheck(this, XMLHttpRequestProgressEvent);

        _get(Object.getPrototypeOf(XMLHttpRequestProgressEvent.prototype), 'constructor', this).call(this);

        this.position = 0;
        this.totalSize = 0;
    }

    _inherits(XMLHttpRequestProgressEvent, _ProgressEvent);

    return XMLHttpRequestProgressEvent;
})(ProgressEvent);

exports.XMLHttpRequestProgressEvent = XMLHttpRequestProgressEvent;

var XMLHttpRequestEventTarget = (function (_EventTarget) {
    function XMLHttpRequestEventTarget() {
        _classCallCheck(this, XMLHttpRequestEventTarget);

        _get(Object.getPrototypeOf(XMLHttpRequestEventTarget.prototype), 'constructor', this).call(this);

        ['onabort', 'onerror', 'onload', 'onloadend', 'onloadstart', 'onprogress', 'ontimeout'].forEach(callOldSchoolCallbackOnEvent, this);
    }

    _inherits(XMLHttpRequestEventTarget, _EventTarget);

    _createClass(XMLHttpRequestEventTarget, [{
        key: 'onabort',
        value: function onabort() {}
    }, {
        key: 'onerror',
        value: function onerror() {}
    }, {
        key: 'onload',
        value: function onload() {}
    }, {
        key: 'onloadend',
        value: function onloadend() {}
    }, {
        key: 'onloadstart',
        value: function onloadstart() {}
    }, {
        key: 'onprogress',
        value: function onprogress() {}
    }, {
        key: 'ontimeout',
        value: function ontimeout() {}
    }]);

    return XMLHttpRequestEventTarget;
})(_eventTarget2['default']);

exports.XMLHttpRequestEventTarget = XMLHttpRequestEventTarget;

var XMLHttpRequestUpload = (function (_XMLHttpRequestEventTarget) {
    function XMLHttpRequestUpload() {
        _classCallCheck(this, XMLHttpRequestUpload);

        _get(Object.getPrototypeOf(XMLHttpRequestUpload.prototype), 'constructor', this).call(this);
    }

    _inherits(XMLHttpRequestUpload, _XMLHttpRequestEventTarget);

    return XMLHttpRequestUpload;
})(XMLHttpRequestEventTarget);

exports.XMLHttpRequestUpload = XMLHttpRequestUpload;
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

exports.statusMessages = statusMessages;
var responseTypes = {
    'default': '',
    ArrayBuffer: 'arraybuffer',
    Blob: 'blob',
    Document: 'document',
    JSON: 'json',
    text: 'text',
    MozBlob: 'moz-blob',
    MozChunkedTest: 'moz-chunked-text',
    MozChunkedArrayBuffer: 'moz-chunked-arraybuffer'
};

exports.responseTypes = responseTypes;
var notAllowedHeaders = ['accept-charset', 'accept-encoding', 'connection', 'content-length', 'cookie', 'cookie2', 'content-transfer-encoding', 'date', 'expect', 'host', 'keep-alive', 'referer', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'];

exports.notAllowedHeaders = notAllowedHeaders;
var unsupportedMethods = ['CONNECT', 'TRACE', 'TRACK'];
exports.unsupportedMethods = unsupportedMethods;
var supportedMethods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

exports.supportedMethods = supportedMethods;
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
        } else {
            // Internet Explorer
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
    if (xmlDoc && xmlDoc.parseError && xmlDoc.parseError._errorCode !== 0 || xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName === 'parsererror' || xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName === 'html' && xmlDoc.documentElement.firstChild && xmlDoc.documentElement.firstChild.nodeName === 'body' && xmlDoc.documentElement.firstChild.firstChild && xmlDoc.documentElement.firstChild.firstChild.nodeName === 'parsererror') {
        xmlDoc = null;
    }

    return xmlDoc;
}

function callOldSchoolCallbackOnEvent(eventName) {
    var self = this;
    self.addEventListener(eventName, function (e) {
        var fn = self['on' + eventName];

        if ('function' === typeof fn) {
            fn.call(self, e);
        }
    }, false);
}

function createProgressEvent(eventName, progress) {
    return (0, _extend2['default'])(new XMLHttpRequestProgressEvent(eventName), {
        loaded: progress._loaded,
        total: progress._total,
        position: progress._loaded,
        totalSize: progress._total
    });
}