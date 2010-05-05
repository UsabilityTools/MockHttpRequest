module("MockHttpRequest");

/*
 * Call 'func' and assert that 'exception' was raised.
 */
function catches (exception, func) {
    try {
        func();
        ok(false, "Expecting exception " + exception + ", none caught");
    } catch (ex) {
        same(ex, exception, "Correct exception caught");
    }
}

test("Initial state", function () {
    var request = new MockHttpRequest();
    equals(request.readyState, request.UNSENT, "readyState is UNSENT");
});

test("open(): invalid uses", function () {
    // The first two parameters for open() are mandatory and have to be strings
    catches("INVALID_METHOD", function () {
        var request = new MockHttpRequest();
        request.open();
    });
    catches("INVALID_URL", function () {
        var request = new MockHttpRequest();
        request.open("GET");
    });
    catches("INVALID_METHOD", function () {
        var request = new MockHttpRequest();
        request.open(1);
    });
    catches("INVALID_URL", function () {
        var request = new MockHttpRequest();
        request.open("GET", 1);
    });

    // CONNECT, TRACE, TRACK are not accepted methods
    catches("SECURITY_ERR", function () {
        var request = new MockHttpRequest();
        request.open("connect", "http://some.host/path");
    });
    catches("SECURITY_ERR", function () {
        var request = new MockHttpRequest();
        request.open("trace", "http://some.host/path");
    });
    catches("SECURITY_ERR", function () {
        var request = new MockHttpRequest();
        request.open("track", "http://some.host/path");
    });
})

test("open(): method mangling", function () {
    var request;

    // Unrecognized HTTP methods are passed through verbatimly
    request = new MockHttpRequest();
    request.open("smurf", "http://some.host/path");
    equals(request.method, "smurf");

    // Whereas recognized ones are uppercased
    request = new MockHttpRequest();
    request.open("put", "http://some.host/path");
    equals(request.method, "PUT");
});

test("open(): default values for arguments", function () {
    var request = new MockHttpRequest();
    request.open("get", "http://some.host/path");
    equals(request.url, "http://some.host/path");
    equals(request.async, true, "Async flag defaults to true");
    equals(request.readyState, request.OPENED, "readyState is OPENED");
});

test("open(): explicit arguments", function () {
    var request = new MockHttpRequest();
    request.open("post", "http://some.host/path", false, "bender", "rodriguez");
    equals(request.method, "POST");
    equals(request.url, "http://some.host/path");
    equals(request.async, false, "Async flag");
    equals(request.user, "bender");
    equals(request.password, "rodriguez");
    equals(request.readyState, request.OPENED, "readyState is OPENED");
});

test("setRequestHeader(): invalid headers", function () {
    var request = new MockHttpRequest();
    request.open("GET", "http://some.host/path");

    request.setRequestHeader("Cookie", "Welcome to the world of tomorrow!");
    equals(request.getRequestHeader("Cookie"), undefined,
           "Invalid header not accepted");

    request.setRequestHeader("Proxy-Authenticate",
                             "I am Bender, please insert girder!");
    equals(request.getRequestHeader("Proxy-Authenticate"), undefined,
           "Invalid header not accepted");

    request.setRequestHeader("Proxy-", "Pathological case");
    equals(request.getRequestHeader("Proxy-"), undefined,
           "Invalid header not accepted");

    request.setRequestHeader("Sec-Something", "I am Bender!");
    equals(request.getRequestHeader("Sec-Something"), undefined,
           "Invalid header not accepted");

    request.setRequestHeader("Sec-", "Pathological case");
    equals(request.getRequestHeader("Sec-"), undefined,
           "Invalid header not accepted");

    // Case insensitivity
    request.setRequestHeader("refeRer", "http://secret.site");
    equals(request.getRequestHeader("refeRer"), undefined,
           "Invalid header not accepted (case-insensitive)");
});

test("setRequestHeader() and getRequestHeader()", function () {
    var request = new MockHttpRequest();
    request.open("GET", "http://some.host/path");

    equals(request.getRequestHeader("Content-Type"), undefined,
           "Non-existent header");

    request.setRequestHeader("Content-Type", "application/robot");
    equals(request.getRequestHeader("Content-Type"), "application/robot");
    equals(request.getRequestHeader("content-TYPE"), "application/robot",
           "Case insensitivity");
});

test("send(): invalid state", function () {
    var request;

    // Need to open a request before sending.
    request = new MockHttpRequest();
    catches("INVALID_STATE_ERR", function () {
        request.send();
    });

    // Can't use send twice
    request = new MockHttpRequest();
    request.open("HEAD", "http://some.host/path");
    request.send("Hey meatbag!");
    catches("INVALID_STATE_ERR", function () {
        request.send();
    });
});

test("send(): HEAD, GET", function () {
    var request;

    request = new MockHttpRequest();
    request.open("HEAD", "http://some.host/path");
    request.send("Hey meatbag!");
    equals(request.requestText, null, "HEAD request has no body");

    request = new MockHttpRequest();
    request.open("GET", "http://some.host/path");
    request.send("Hey meatbag!");
    equals(request.requestText, null, "GET request has no body");
});

test("send(): with data, onsend()", function () {
    var request;

    request = new MockHttpRequest();

    var sendCalled = 0;
    request.onsend = function () {
        sendCalled += 1;
    };

    request.open("POST", "http://some.host/path");
    request.send("Hey meatbag!");

    equals(request.requestText, "Hey meatbag!", "Request body is passed");
    equals(sendCalled, 1, "onsend was called exactly once");
});

test("abort(): before receiving data", function () {
    var request = new MockHttpRequest();
    request.open("POST", "http://some.host/path");
    request.setRequestHeader("Content-Type", "application/robot");
    request.send("Hey meatbag!");

    var abortCalled = 0;
    request.onabort = function () {
        abortCalled += 1;
    };
    var readyStateChangeCalled = 0;
    request.onreadystatechange = function () {
        readyStateChangeCalled += 1;
    };
    request.abort();

    equals(request.readyState, request.UNSENT, "State is UNSENT after abort");
    equals(abortCalled, 1, "onabort() was called once.");
    equals(readyStateChangeCalled, 1, "onreadystatechange() was called once");
    equals(request.getRequestHeader("Content-Type"), undefined,
           "Request headers are cleared");
    equals(request.requestText, undefined, "Request body is cleared");
});


test("abort(): after receiving data", function () {
    var request = new MockHttpRequest();
    request.open("POST", "http://some.host/path");
    request.send("Hey meatbag!");
    request.receive(200, "Yes, Bender?");
    request.abort();

    equals(request.readyState, request.UNSENT, "State is UNSENT after abort");
    equals(request.responseText, null, "Response body is cleared");
});

test("receive(): invalid state", function () {
    var request = new MockHttpRequest();
    catches("INVALID_STATE_ERR", function () {
        request.receive(200, "Yes, Bender?");
    });

    request.open("POST", "http://some.host/path");
    catches("INVALID_STATE_ERR", function () {
        request.receive(200, "Yes, Bender?");
    });
});

test("receive()", function () {
    var request = new MockHttpRequest();
    request.open("POST", "http://some.host/path");
    request.send("Hey meatbag!");

    var states = [];
    request.onreadystatechange = function () {
        states.push(request.readyState);
    };
    var progressCalled = 0;
    request.onprogress = function () {
        progressCalled += 1;
    };
    var loadCalled = 0;
    request.onload = function () {
        loadCalled += 1;
    };

    request.receive(200, "Yes, Bender?");

    equals(request.readyState, request.DONE, "State is DONE after receive");
    equals(request.status, 200, "HTTP status");
    equals(request.statusText, "200 OK", "HTTP status text");
    equals(request.responseText, "Yes, Bender?", "Response body");

    same(states, [request.HEADERS_RECEIVED, request.LOADING, request.DONE],
         "All states are visited in correct order");
    ok(progressCalled, "onprogress() was called at least once");
    equals(loadCalled, 1, "onload() was called exactly once");
});

test("err(): invalid state", function () {
    var request = new MockHttpRequest();
    catches("INVALID_STATE_ERR", function () {
        request.err("NETWORK_ERR");
    });

    request.open("POST", "http://some.host/path");
    catches("INVALID_STATE_ERR", function () {
        request.err("NETWORK_ERR");
    });
});

test("err(): async", function () {
    var request = new MockHttpRequest();
    request.open("POST", "http://some.host/path");
    request.setRequestHeader("Content-Type", "application/robot");
    request.send("Hey meatbag!");

    var errorCalled = 0;
    request.onerror = function () {
        errorCalled += 1;
    };

    request.err("NETWORK_ERR");

    equals(request.readyState, request.DONE, "State is DONE after error");
    equals(request.responseText, null, "Response body is cleared");
    equals(errorCalled, 1, "onerror() was called exactly once");
});

test("err(): synchronous", function () {
    var request = new MockHttpRequest();
    request.open("GET", "http://some.host/path", false);
    request.send();

    var errorCalled = 0;
    request.onerror = function () {
        errorCalled += 1;
    };

    catches("NETWORK_ERR", function () {
        request.err("NETWORK_ERR");
    });
    equals(request.readyState, request.DONE, "State is DONE after error");
    equals(request.responseText, null, "Response body is cleared");
    equals(errorCalled, 0, "onerror() wasn't called");
});

test("getResponseHeader(): invalid state", function () {
    var request = new MockHttpRequest();
    request.setResponseHeader("Content-Type", "application/robot");
    equals(request.getResponseHeader("Content-Type"), undefined,
          "Response header can't be read in invalid state");

    request.open("GET", "http://some.host/path");
    equals(request.getResponseHeader("Content-Type"), undefined,
          "Response header can't be read in invalid state");

    request.send();
    request.receive(200, "");
    request.abort();
    equals(request.getResponseHeader("Content-Type"), undefined,
          "Response header can't be read after abort");
});

test("getResponseHeader() et.al.", function () {
    var request = new MockHttpRequest();
    request.open("GET", "http://some.host/path");
    request.send();
    request.receive(200, "Bite my shiny metal a**");

    equals(request.getResponseHeader("Content-Type"), undefined,
           "Non-existent header");
    request.setResponseHeader("Content-Type", "application/robot");
    equals(request.getResponseHeader("Content-Type"), "application/robot");
    equals(request.getResponseHeader("CONTENT-type"), "application/robot",
           "Case insensitivity");

    request.setResponseHeader("Content-Length", "23");
    request.setResponseHeader("Set-Cookie", "Chocolate chip");
    request.setResponseHeader("Set-Cookie2", "Raisin");
    equals(request.getAllResponseHeaders(),
           "content-type: application/robot\r\ncontent-length: 23\r\n",
           "getAllResponseHeaders");
});


module("MockHttpServer");

function makeRequest (callback, errback) {
    var request = new XMLHttpRequest();
    request.open("POST", "http://some.host/path", true, "bender", "rodriguez");
    if (typeof callback === "function") {
        request.onload = callback;
    }
    if (typeof errback === "function") {
        request.onerror = errback;
    }
    request.send("Hey meatbag!");
}

test("Simple request", function () {
    var server = new MockHttpServer();

    var handleCalled = 0;
    server.handle = function (request) {
        handleCalled += 1;
        equals(request.readyState, request.OPENED, "Received open request");
        equals(request.requestText, "Hey meatbag!", "Received request body");

        request.receive(200, "Bite my shiny metal a**");
    };

    server.start();
    var loadCalled = 0;
    makeRequest(function () {
        loadCalled += 1;
    });
    server.stop();

    equals(handleCalled, 1, "One request received");
    equals(loadCalled, 1, "onload called exactly once");
});

test("Simple request, handler directly passed", function () {
    var handleCalled = 0;
    var server = new MockHttpServer(function (request) {
        handleCalled += 1;
        equals(request.readyState, request.OPENED, "Received open request");
        equals(request.requestText, "Hey meatbag!", "Received request body");

        request.receive(200, "Bite my shiny metal a**");
    });

    server.start();
    var loadCalled = 0;
    makeRequest(function () {
        loadCalled += 1;
    });
    server.stop();

    equals(handleCalled, 1, "One request received");
    equals(loadCalled, 1, "onload called exactly once");
});

test("Multiple requests", function () {
    var handleCalled = 0;
    var server = new MockHttpServer(function (request) {
        handleCalled += 1;
        equals(request.readyState, request.OPENED, "Received open request");
        equals(request.requestText, "Hey meatbag!", "Received request body");

        request.receive(200, "Bite my shiny metal a**");
    });

    server.start();
    var loadCalled = 0;
    function onload () {
        loadCalled += 1;
    };
    makeRequest(onload);
    makeRequest(onload);
    makeRequest(onload);
    server.stop();

    equals(handleCalled, 3, "Three requests received");
    equals(loadCalled, 3, "onload called exactly three times");
});

test("Network error", function () {
    var handleCalled = 0;
    var server = new MockHttpServer(function (request) {
        handleCalled += 1;
        equals(request.readyState, request.OPENED, "Received open request");
        equals(request.requestText, "Hey meatbag!", "Received request body");

        request.err("NETWORK_ERR");
    });

    server.start();
    var errorCalled = 0;
    makeRequest(undefined, function () {
        errorCalled += 1;
    });
    server.stop();

    equals(handleCalled, 1, "One request received");
    equals(errorCalled, 1, "onerror called exactly once");
});