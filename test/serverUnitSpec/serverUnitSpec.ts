import Log from "../../src/Util";
import Server from "../../src/rest/Server";
import {expect} from "chai"


describe('serverUnitSpec', function () {

    var port = 4321;
    var server = new Server(port);
    var chai = require('chai')
    var chaiHttp = require('chai-http');
    chai.use(chaiHttp);

    var fs = require("fs");
    var roomsdata: any = null;
    var json_incomplete_section: any = null;

    /**
     * Set up
     */
    before(function () {
        Log.test('Before: ' + (<any>this).test.parent.title);
        roomsdata = fs.readFileSync("./data/rooms.zip");
        json_incomplete_section = fs.readFileSync("./data/json_incomplete_section.zip");

        //remove datasets from cache if there is any
        if (fs.existsSync("./src/cache/rooms.txt")) {
            fs.unlinkSync("./src/cache/rooms.txt");
        }

        server.start().then(function (res) {
            if (res) {
                Log.test('server is running');
            } else {
                expect.fail('server is not running');
            }
        });
    });

    beforeEach(function () {
        Log.test('BeforeTest: ' + (<any>this).currentTest.title);
    });

    after(function () {
        Log.test('After: ' + (<any>this).test.parent.title);
        server.stop();
    });

    afterEach(function () {
        Log.test('AfterTest: ' + (<any>this).currentTest.title);
    });

    it('should return 200 when request is GET /', function () {
        chai.request('http://localhost:' + port).get('/')
            .end(function (err: any, res: any) {
                expect(res.statusCode).to.eql(200);
            });
    });

    it('should return 204 when user requests to PUT a valid zip for the first time', function () {
        return chai.request('http://localhost:' + port)
            .put('/dataset/rooms')
            .attach("body", roomsdata, "rooms.zip")
            .then(function (res: any) {
                expect(res).to.eql(204);
            })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            });
    });

    let query: any = {
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
    }

    it('should return 200 when user requests to POST a valid query', function () {
        return chai.request('http://localhost:' + port)
            .post('/query')
            .send(query)
            .then(function (res: any) {
                expect(res).to.be.eql(200);
            })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            });
    });

    let invalid_id_query: any = {
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
    }

    it('should return 424 when user requests to POST a query which requires dataset that has not been added', function () {
        return chai.request('http://localhost:' + port)
            .post('/query')
            .send(invalid_id_query)
            .then(function (res: any) {
                console.log(res);
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err).to.be.eql(424);
            });
    });

    let invalid_mcomparator_query: any = {
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
    }

    it('should return 400 when user requests to POST a query which contains an invalid mcomparator', function () {
        return chai.request('http://localhost:' + port)
            .post('/query')
            .send(invalid_mcomparator_query)
            .then(function (res: any) {
                console.log(res);
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err).to.be.eql(400);
            });
    });

    it('should return 201 when user requests to PUT a valid zip for the second time', function () {
        return chai.request('http://localhost:' + port)
            .put('/dataset/rooms')
            .attach("body", roomsdata, "rooms.zip")
            .then(function (res: any) {
                expect(res).to.be.eql(201);
            })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            });
    });

    it('should return 204 when user requests to DELETE a zip for the first time', function () {
        return chai.request('http://localhost:' + port)
            .del('/dataset/rooms')
            .then(function (res: any) {
                expect(res).to.be.eql(204);
            })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            });
    });

    it('should return 404 when user requests to DELETE a zip for the second time', function () {
        return chai.request('http://localhost:' + port)
            .del('/dataset/rooms')
            .then(function (res: any) {
                console.log(res);
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err).to.be.eql(404);
            });
    });

    it('should return 400 when user requests to PUT a invalid zip', function () {
        return chai.request('http://localhost:' + port)
            .put('/dataset/invalidZip')
            .attach("body", json_incomplete_section, "json_incomplete_section.zip")
            .then(function (res: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                console.log(err);
                expect(err).to.be.eql(400);
            });
    });


})