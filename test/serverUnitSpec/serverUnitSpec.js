"use strict";
var Util_1 = require("../../src/Util");
var Server_1 = require("../../src/rest/Server");
var chai_1 = require("chai");
describe('serverUnitSpec', function () {
    var port = 4321;
    var server = new Server_1.default(port);
    var chai = require('chai');
    var chaiHttp = require('chai-http');
    chai.use(chaiHttp);
    var fs = require("fs");
    var roomsdata = null;
    var json_incomplete_section = null;
    before(function () {
        Util_1.default.test('Before: ' + this.test.parent.title);
        roomsdata = fs.readFileSync("./data/rooms.zip");
        json_incomplete_section = fs.readFileSync("./data/json_incomplete_section.zip");
        if (fs.existsSync("./src/cache/rooms.txt")) {
            fs.unlinkSync("./src/cache/rooms.txt");
        }
        server.start().then(function (res) {
            if (res) {
                Util_1.default.test('server is running');
            }
            else {
                chai_1.expect.fail('server is not running');
            }
        });
    });
    beforeEach(function () {
        Util_1.default.test('BeforeTest: ' + this.currentTest.title);
    });
    after(function () {
        Util_1.default.test('After: ' + this.test.parent.title);
        server.stop();
    });
    afterEach(function () {
        Util_1.default.test('AfterTest: ' + this.currentTest.title);
    });
    it('should return 200 when request is GET /', function () {
        chai.request('http://localhost:' + port).get('/')
            .end(function (err, res) {
            chai_1.expect(res.statusCode).to.eql(200);
        });
    });
    it('should return 204 when user requests to PUT a valid zip for the first time', function () {
        return chai.request('http://localhost:' + port)
            .put('/dataset/rooms')
            .attach("body", roomsdata, "rooms.zip")
            .then(function (res) {
            chai_1.expect(res).to.eql(204);
        })
            .catch(function (err) {
            console.log(err);
            chai_1.expect.fail();
        });
    });
    var query = {
        "WHERE": {
            "IS": {
                "rooms_name": "DMP_*"
            }
        },
        "OPTIONS": {
            "COLUMNS": [
                "rooms_name"
            ],
            "ORDER": "rooms_name",
            "FORM": "TABLE"
        }
    };
    it('should return 200 when user requests to POST a valid query', function () {
        return chai.request('http://localhost:' + port)
            .post('/query')
            .send(query)
            .then(function (res) {
            chai_1.expect(res).to.be.eql(200);
        })
            .catch(function (err) {
            console.log(err);
            chai_1.expect.fail();
        });
    });
    var invalid_id_query = {
        "WHERE": {
            "IS": {
                "rrooms_name": "DMP_*"
            }
        },
        "OPTIONS": {
            "COLUMNS": [
                "rooms_name"
            ],
            "ORDER": "rooms_name",
            "FORM": "TABLE"
        }
    };
    it('should return 424 when user requests to POST a query which requires dataset that has not been added', function () {
        return chai.request('http://localhost:' + port)
            .post('/query')
            .send(invalid_id_query)
            .then(function (res) {
            console.log(res);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.be.eql(424);
        });
    });
    var invalid_mcomparator_query = {
        "WHERE": {
            "GT": {
                "courses_dept": 50
            }
        },
        "OPTIONS": {
            "COLUMNS": [
                "rooms_name"
            ],
            "ORDER": "rooms_name",
            "FORM": "TABLE"
        }
    };
    it('should return 400 when user requests to POST a query which contains an invalid mcomparator', function () {
        return chai.request('http://localhost:' + port)
            .post('/query')
            .send(invalid_mcomparator_query)
            .then(function (res) {
            console.log(res);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.be.eql(400);
        });
    });
    it('should return 201 when user requests to PUT a valid zip for the second time', function () {
        return chai.request('http://localhost:' + port)
            .put('/dataset/rooms')
            .attach("body", roomsdata, "rooms.zip")
            .then(function (res) {
            chai_1.expect(res).to.be.eql(201);
        })
            .catch(function (err) {
            console.log(err);
            chai_1.expect.fail();
        });
    });
    it('should return 204 when user requests to DELETE a zip for the first time', function () {
        return chai.request('http://localhost:' + port)
            .del('/dataset/rooms')
            .then(function (res) {
            chai_1.expect(res).to.be.eql(204);
        })
            .catch(function (err) {
            console.log(err);
            chai_1.expect.fail();
        });
    });
    it('should return 404 when user requests to DELETE a zip for the second time', function () {
        return chai.request('http://localhost:' + port)
            .del('/dataset/rooms')
            .then(function (res) {
            console.log(res);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.be.eql(404);
        });
    });
    it('should return 400 when user requests to PUT a invalid zip', function () {
        return chai.request('http://localhost:' + port)
            .put('/dataset/invalidZip')
            .attach("body", json_incomplete_section, "json_incomplete_section.zip")
            .then(function (res) {
            chai_1.expect.fail();
        })
            .catch(function (err) {
            console.log(err);
            chai_1.expect(err).to.be.eql(400);
        });
    });
});
//# sourceMappingURL=serverUnitSpec.js.map