"use strict";
var Util_1 = require("../src/Util");
var Server_1 = require("../src/rest/Server");
describe('queryControllerUnitSpec', function () {
    var server = new Server_1.default(1);
    before(function () {
        Util_1.default.test('Before: ' + this.test.parent.title);
    });
    beforeEach(function () {
        Util_1.default.test('BeforeTest: ' + this.currentTest.title);
    });
    after(function () {
        Util_1.default.test('After: ' + this.test.parent.title);
    });
    afterEach(function () {
        Util_1.default.test('AfterTest: ' + this.currentTest.title);
    });
    it('test Server', function () {
        server.start();
        Server_1.default.performEcho("perform echo");
        server.start();
        Server_1.default.performEcho("");
        server.stop();
        server.start();
        server.stop();
    });
});
//# sourceMappingURL=ServerSpec.js.map