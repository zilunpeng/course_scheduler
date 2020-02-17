"use strict";
var chai_1 = require("chai");
var Util_1 = require("../src/Util");
var InsightFacade_1 = require("../src/controller/InsightFacade");
var QueryController_1 = require("../src/controller/QueryController");
var DatasetController_1 = require("../src/controller/DatasetController");
describe('datasetControllerSpec', function () {
    var fs = require("fs");
    var datasetController = new DatasetController_1.default();
    var insightFacade = null;
    var data = null;
    var roomsdata = null;
    var emptyObjects = null;
    var emptyArrays = null;
    var notazip = null;
    var emptyZip = null;
    var emptyFolders = null;
    var noJSONobj = null;
    var only_result = null;
    var only_rank = null;
    var json_invalid_section_key = null;
    var json_incomplete_section = null;
    var rooms_no_indexHtm = null;
    var cacheDir = './src/cache/';
    var queryController = new QueryController_1.default();
    before(function () {
        try {
            Util_1.default.test('Before: ' + this.test.parent.title);
            data = fs.readFileSync("./data/courses.zip", { encoding: 'base64' });
            roomsdata = fs.readFileSync("./data/rooms.zip", { encoding: 'base64' });
            emptyObjects = fs.readFileSync("./data/emptyObjects.zip", { encoding: 'base64' });
            emptyArrays = fs.readFileSync("./data/emptyArrays.zip", { encoding: 'base64' });
            notazip = fs.readFileSync("./data/NotAZip.txt", { encoding: 'base64' });
            emptyZip = fs.readFileSync("./data/emptyZip.zip", { encoding: 'base64' });
            emptyFolders = fs.readFileSync("./data/emptyFolders.zip", { encoding: 'base64' });
            noJSONobj = fs.readFileSync("./data/noJSONobj.zip", { encoding: 'base64' });
            only_result = fs.readFileSync("./data/only_result.zip", { encoding: 'base64' });
            only_rank = fs.readFileSync("./data/only_rank.zip", { encoding: 'base64' });
            json_invalid_section_key = fs.readFileSync("./data/json_invalid_section_key.zip", { encoding: 'base64' });
            json_incomplete_section = fs.readFileSync("./data/json_incomplete_section.zip", { encoding: 'base64' });
            rooms_no_indexHtm = fs.readFileSync("./data/rooms_no_indexHtm.zip", { encoding: 'base64' });
        }
        catch (e) {
            console.log(e);
        }
    });
    beforeEach(function () {
        Util_1.default.test('BeforeTest: ' + this.currentTest.title);
        insightFacade = new InsightFacade_1.default();
    });
    after(function () {
        Util_1.default.test('After: ' + this.test.parent.title);
        insightFacade = null;
    });
    afterEach(function () {
        Util_1.default.test('AfterTest: ' + this.currentTest.title);
    });
    it("readdir on empty directory should read 'courses' after adding data set courses.zip", function () {
        insightFacade.addDataset('courses', data).then(function (response) {
            var filenames = fs.readdirSync(cacheDir);
            Util_1.default.info(filenames);
            chai_1.expect(filenames).to.eql(['courses.txt']);
        })
            .catch(function (err) {
            Util_1.default.error(err);
            chai_1.expect.fail(err);
        });
    });
    it("readdir on empty directory should only contain courses once after adding it twice", function () {
        return insightFacade.addDataset('courses', data).then(function (response) {
            var filenames = fs.readdirSync(cacheDir);
            Util_1.default.info(filenames);
            chai_1.expect(filenames).to.eql(['courses.txt']);
        })
            .catch(function (err) {
            Util_1.default.error(err);
            chai_1.expect.fail(err);
        });
    });
    it("readdir on empty directory should return nothing after removing data set courses.zip", function () {
        return insightFacade.removeDataset('courses').then(function (response) {
            var filenames = fs.readdirSync(cacheDir);
            chai_1.expect(filenames).to.eql([]);
        })
            .catch(function (err) {
            chai_1.expect(err).to.eql([]);
        });
    });
    it("readdir on empty directory should return rooms after adding data set rooms.zip", function () {
        return insightFacade.addDataset('rooms', roomsdata).then(function (response) {
            var filenames = fs.readdirSync(cacheDir);
            chai_1.expect(filenames).to.eql(['rooms.txt']);
        })
            .catch(function (err) {
            chai_1.expect(err).to.eql([]);
        });
    });
    it("should throw an error when adding a rooms zip without index.htm", function () {
        return insightFacade.addDataset('rooms', rooms_no_indexHtm).then(function (response) {
            console.log(response);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "no index.htm" } });
        });
    });
    it("should remove an existing courses dataset", function () {
        return insightFacade.addDataset('courses', data).then(function (response) {
            Util_1.default.test(response);
            return insightFacade.removeDataset("courses");
        })
            .catch(function (err) {
            chai_1.expect(err).to.to.deep.equal({ code: 204, body: {} });
        });
    });
    it("should remove an existing rooms dataset", function () {
        return insightFacade.addDataset('rooms', roomsdata).then(function (response) {
            Util_1.default.test(response);
            return insightFacade.removeDataset('rooms');
        })
            .catch(function (err) {
            chai_1.expect(err).to.to.deep.equal({ code: 204, body: {} });
        });
    });
    it("should throw an error when no dataset is in memory", function () {
        return insightFacade.removeDataset("no_dataset_in_memory").then(function (response) {
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 404, body: {} });
        });
    });
    it("AddDataSet should return response code error 400 if no ZIP file is provided", function () {
        return insightFacade.addDataset('courses', null).then(function (response) {
            chai_1.expect(response.code).to.equal(400);
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err.code).to.equal(400);
        });
    });
    it("AddDataSet should return response code error 400 if given invalid content", function () {
        return insightFacade.addDataset('courses', 'invalid').then(function (response) {
            chai_1.expect(response.code).to.equal(400);
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err.code).to.equal(400);
        });
    });
    it("AddDataSet should return response code error 400 if no id is given", function () {
        return insightFacade.addDataset("", data).then(function (response) {
            chai_1.expect(response).to.deep.equal({ code: 400, body: { "error": "id is empty." } });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "id is empty." } });
        });
    });
    it("AddDataSet should return response code error 400 if given a zip with empty json objects", function () {
        return insightFacade.addDataset('courses', emptyObjects).then(function (response) {
            chai_1.expect(response).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        });
    });
    it("AddDataSet should return response code error 400 if given an empty zip", function () {
        return insightFacade.addDataset('courses', emptyZip).then(function (response) {
            chai_1.expect(response).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        });
    });
    it("AddDataSet should return response code error 400 if given a zip with empty folders", function () {
        return insightFacade.addDataset('courses', emptyFolders).then(function (response) {
            chai_1.expect(response).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        });
    });
    it("AddDataSet should return response code error 400 if Zip file has non-json content", function () {
        return insightFacade.addDataset('courses', noJSONobj).then(function (response) {
            chai_1.expect(response.code).to.equal(400);
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err.code).to.equal(400);
        });
    });
    it("AddDataSet should return response code error 400 if not given a zip file", function () {
        return insightFacade.addDataset('courses', notazip).then(function (response) {
            chai_1.expect(response.code).to.equal(400);
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err.code).to.equal(400);
        });
    });
    it("AddDataSet should return response code error 400 if not given a zip file", function () {
        return insightFacade.addDataset('courses', emptyArrays).then(function (response) {
            chai_1.expect(response).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        });
    });
    it("AddDataSet should return response code error 400 if not given a zip file", function () {
        return insightFacade.addDataset('courses', only_result).then(function (response) {
            chai_1.expect(response).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        });
    });
    it("AddDataSet should return response code error 400 if not given a zip file", function () {
        return insightFacade.addDataset('courses', only_rank).then(function (response) {
            chai_1.expect(response).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        });
    });
    it("AddDataSet should return response code error 400 if not given a zip file", function () {
        return insightFacade.addDataset('courses', json_invalid_section_key).then(function (response) {
            chai_1.expect(response).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        });
    });
    it("AddDataSet should return response code error 400 if not given a zip file", function () {
        return insightFacade.addDataset('courses', json_incomplete_section).then(function (response) {
            chai_1.expect(response).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect(err).to.deep.equal({ code: 400, body: { "error": "zip is not valid" } });
        });
    });
    it("AddDataSet courses should return response code 204 if added successfully and it does not already exist", function () {
        return insightFacade.addDataset('courses', data).then(function (response) {
            Util_1.default.test('response: ' + response);
            chai_1.expect(response.code).to.equal(204);
        })
            .catch(function (err) {
            Util_1.default.error(err);
            chai_1.expect.fail();
        });
    });
    it("AddDataSet courses should return response code 201 if added successfully and it already exists", function () {
        return insightFacade.addDataset('courses', data).then(function (response) {
            Util_1.default.test('response: ' + response);
            chai_1.expect(response.code).to.equal(201);
        })
            .catch(function (err) {
            Util_1.default.error(err);
            chai_1.expect.fail();
        });
    });
    it("should remove an existing rooms dataset", function () {
        return insightFacade.addDataset('rooms', roomsdata).then(function (response) {
            Util_1.default.test(response);
            return insightFacade.removeDataset("rooms");
        })
            .catch(function (err) {
            chai_1.expect(err).to.to.deep.equal({ code: 204, body: {} });
        });
    });
    it("AddDataSet rooms should return response code 204 if added successfully and it does not already exist", function () {
        return insightFacade.addDataset('rooms', roomsdata).then(function (response) {
            Util_1.default.test('response: ' + response);
            chai_1.expect(response.code).to.equal(204);
        })
            .catch(function (err) {
            Util_1.default.error(err);
            chai_1.expect.fail();
        });
    });
    it("AddDataSet rooms should return response code 201 if added successfully and it already exists", function () {
        return insightFacade.addDataset('rooms', roomsdata).then(function (response) {
            Util_1.default.test('response: ' + response);
            chai_1.expect(response.code).to.equal(201);
        })
            .catch(function (err) {
            Util_1.default.error(err);
            chai_1.expect.fail();
        });
    });
    it("check if addDataSet overwrites file with same id by checking date modified", function () {
        var filepath = './src/cache/courses.txt';
        var time1 = (fs.fstatSync(fs.openSync(filepath, 'r'))['mtime'].getTime());
        return insightFacade.addDataset('courses', data).then(function (response) {
            var time2 = (fs.fstatSync(fs.openSync(filepath, 'r'))['mtime'].getTime());
            var difference = time2 - time1;
            var filenames = fs.readdirSync(cacheDir);
            Util_1.default.info(filenames);
            chai_1.expect(difference).to.greaterThan(0);
        })
            .catch(function (err) {
            chai_1.expect.fail(err);
        });
    });
    it("should throw an error when removing a nonexistent dataset", function () {
        return insightFacade.addDataset('courses', data).then(function (response) {
            Util_1.default.test(response);
            return insightFacade.removeDataset("no_such_dataset");
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 404, body: {} });
            Util_1.default.trace(err);
            Util_1.default.info(err);
            Util_1.default.warn(err);
            Util_1.default.error(err);
        });
    });
    it("getLatLon with invalid address should return error 400", function () {
        return (datasetController.getLatLong(3)).then(function (response) {
            chai_1.expect.fail();
        })
            .catch(function (err) {
            Util_1.default.info(err);
            chai_1.expect(err.toString()).to.deep.equal('TypeError: address.replace is not a function');
        });
    });
    it("getLatLon with valid string but invalid address should return 'address not found' ", function () {
        return (datasetController.getLatLong("invalid")).then(function (response) {
            chai_1.expect(response).to.deep.equal({ error: 'Address not found (invalid)' });
        })
            .catch(function (err) {
        });
    });
    it("getLatLon with valid address should return response 200", function () {
        return (datasetController.getLatLong("1822 East Mall")).then(function (response) {
            chai_1.expect(response).to.deep.equal({ lat: 49.2699, lon: -123.25318 });
        })
            .catch(function (err) {
            Util_1.default.test('Error: ' + err);
            chai_1.expect.fail(err);
        });
    });
    it("test isFiledSStore", function () {
        chai_1.expect(datasetController.isFileDSStore('./src/cache/')).to.equal(false);
    });
    it("test isZipValid single section", function () {
        chai_1.expect(datasetController.isZipValid({ "result": [], "rank": 0 })).to.eql(true);
    });
    it("test isZipValid two sections", function () {
        chai_1.expect(datasetController.isZipValid({ result: [
                {
                    "tier_eighty_five": 1,
                    "tier_ninety": 0,
                    "Title": "fish diseases",
                    "Section": "99c",
                    "Detail": "",
                    "tier_seventy_two": 1,
                    "Other": 0,
                    "Low": 33,
                    "tier_sixty_four": 0,
                    "id": 24569,
                    "tier_sixty_eight": 0,
                    "tier_zero": 0,
                    "tier_seventy_six": 1,
                    "tier_thirty": 1,
                    "tier_fifty": 1,
                    "Professor": "ackerman, paige adrienne",
                    "Audit": 0,
                    "tier_g_fifty": 1,
                    "tier_forty": 0,
                    "Withdrew": 1,
                    "Year": "2013",
                    "tier_twenty": 0,
                    "Stddev": 16.74,
                    "Enrolled": 13,
                    "tier_fifty_five": 1,
                    "tier_eighty": 5,
                    "tier_sixty": 1,
                    "tier_ten": 0,
                    "High": 89,
                    "Course": "419",
                    "Session": "w",
                    "Pass": 11,
                    "Fail": 1,
                    "Avg": 71.5,
                    "Campus": "ubc",
                    "Subject": "apbi"
                },
                {
                    "tier_eighty_five": 1,
                    "tier_ninety": 0,
                    "Title": "fish diseases",
                    "Section": "overall",
                    "Detail": "",
                    "tier_seventy_two": 1,
                    "Other": 0,
                    "Low": 33,
                    "tier_sixty_four": 0,
                    "id": 24570,
                    "tier_sixty_eight": 0,
                    "tier_zero": 0,
                    "tier_seventy_six": 1,
                    "tier_thirty": 1,
                    "tier_fifty": 1,
                    "Professor": "",
                    "Audit": 0,
                    "tier_g_fifty": 1,
                    "tier_forty": 0,
                    "Withdrew": 1,
                    "Year": "2013",
                    "tier_twenty": 0,
                    "Stddev": 16.74,
                    "Enrolled": 13,
                    "tier_fifty_five": 1,
                    "tier_eighty": 5,
                    "tier_sixty": 1,
                    "tier_ten": 0,
                    "High": 89,
                    "Course": "419",
                    "Session": "w",
                    "Pass": 11,
                    "Fail": 1,
                    "Avg": 71.5,
                    "Campus": "ubc",
                    "Subject": "apbi"
                }
            ], "rank": 0 })).to.eql(true);
    });
    it("test isZipValid two sections", function () {
        chai_1.expect(datasetController.isZipValid({ result: [
                {
                    "NOTVALIDKEY": 1,
                    "tier_ninety": 0,
                    "Title": "fish diseases",
                    "Section": "99c",
                    "Detail": "",
                    "tier_seventy_two": 1,
                    "Other": 0,
                    "Low": 33,
                    "tier_sixty_four": 0,
                    "id": 24569,
                    "tier_sixty_eight": 0,
                    "tier_zero": 0,
                    "tier_seventy_six": 1,
                    "tier_thirty": 1,
                    "tier_fifty": 1,
                    "Professor": "ackerman, paige adrienne",
                    "Audit": 0,
                    "tier_g_fifty": 1,
                    "tier_forty": 0,
                    "Withdrew": 1,
                    "Year": "2013",
                    "tier_twenty": 0,
                    "Stddev": 16.74,
                    "Enrolled": 13,
                    "tier_fifty_five": 1,
                    "tier_eighty": 5,
                    "tier_sixty": 1,
                    "tier_ten": 0,
                    "High": 89,
                    "Course": "419",
                    "Session": "w",
                    "Pass": 11,
                    "Fail": 1,
                    "Avg": 71.5,
                    "Campus": "ubc",
                    "Subject": "apbi"
                }
            ], "rank": 0 })).to.eql(false);
    });
    it("test isZipValid invalid no rank", function () {
        chai_1.expect(datasetController.isZipValid([{ "result": [] }])).to.eql(false);
    });
    it("test isZipValid invalid no rank", function () {
        chai_1.expect(datasetController.isZipValid([{ "rank": 0 }])).to.eql(false);
    });
});
//# sourceMappingURL=datasetControllerSpec.js.map