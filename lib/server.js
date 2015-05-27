


/*
 * A small mock "server" that intercepts XMLHttpRequest calls and
 * diverts them to your handler.
 *
 * Usage:
 *
 * 1. Initialize with either
 *       var server = new MockHttpServer(your_request_handler);
 *    or
 *       var server = new MockHttpServer();
 *       server._handle = function (request) { ... };
 *
 * 2. Call server.start() to start intercepting all XMLHttpRequests.
 *
 * 3. Do your tests.
 *
 * 4. Call server.stop() to tear down.
 *
 * 5. Profit!
 */
function MockHttpServer (handler) {
    if (handler) {
        this._handle = handler;
    }
}

MockHttpServer.prototype = {

    start: function () {
        var self = this;

        function Request() {
            this.onsend = function () {
                self._handle(this);
            };

            MockHttpRequest.apply(this, arguments);
        }

        Request.prototype = MockHttpRequest.prototype;

        window.OriginalHttpRequest = window.XMLHttpRequest;
        window.XMLHttpRequest = Request;
    },

    stop: function () {
        window.XMLHttpRequest = window.OriginalHttpRequest;
    },

    handle: function (request) {
        // Instances should override this.
    }
};