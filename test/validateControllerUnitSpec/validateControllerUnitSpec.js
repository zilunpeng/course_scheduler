"use strict";
var chai_1 = require("chai");
var Util_1 = require("../../src/Util");
var InsightFacade_1 = require("../../src/controller/InsightFacade");
var QueryController_1 = require("../../src/controller/QueryController");
var ValidateController_1 = require("../../src/controller/ValidateController");
describe('validateControllerUnitSpec', function () {
    var insightFacade = new InsightFacade_1.default();
    var queryController = new QueryController_1.default();
    var validateController = new ValidateController_1.default();
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
    it("query should throw error 400 if a query's OPTIONS contains both courses and rooms", function () {
        var query = {
            "WHERE": { "IS": { "rooms_name": "DMP_*" } },
            "OPTIONS": { "COLUMNS": ["courses_year"], "ORDER": "courses_year", "FORM": "TABLE" }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'query contains more than 1 dataset' } });
        });
    });
    it("query should throw error 400 if a query's WHERE contains both courses and rooms", function () {
        var query = {
            "WHERE": {
                "AND": [
                    { "IS": { "rooms_name": "DMP_*" } },
                    { "IS": { "courses_dept": "cpsc" } }
                ]
            },
            "OPTIONS": { "COLUMNS": ["rooms_name"], "FORM": "TABLE" }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'query contains more than 1 dataset' } });
        });
    });
    it("query should throw error 400 with invalid room key in WHERE", function () {
        var query = {
            "WHERE": { "IS": { "rooms_nope": "DMP*" } },
            "OPTIONS": { "COLUMNS": ["rooms_shortname"], "FORM": "TABLE" }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'rooms_nope is not valid in dataset rooms' } });
        });
    });
    it("query should throw error 400 with invalid room key in options", function () {
        var query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": ["rooms_nope"], "FORM": "TABLE" }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'rooms_nope is not valid in dataset rooms' } });
        });
    });
    it("should return error if not given valid MCOMPARISON key", function () {
        var query = {
            "WHERE": { "LT": { "courses_a": 99 } },
            "OPTIONS": { "COLUMNS": ["courses_avg"], "FORM": "TABLE" }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'invalid MCOMPARISON. Require a number key' } });
        });
    });
    it("should return error if not given invalid FILTER", function () {
        var query = {
            "WHERE": { "T": { "courses_avg": 99 } },
            "OPTIONS": {
                "COLUMNS": ["courses_avg"], "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'invalid filter' } });
        });
    });
    it("isApply should return TRUE given APPLY", function () {
        chai_1.expect(validateController.isApply('APPLY')).to.be.true;
    });
    it("isApply should return FALSE given blablabla", function () {
        chai_1.expect(validateController.isApply('blablabla')).to.be.false;
    });
    it("isColumns should return TRUE given COLUMNS", function () {
        chai_1.expect(validateController.isColumns('COLUMNS')).to.be.true;
    });
    it("isOrder should return TRUE given ORDER", function () {
        chai_1.expect(validateController.isOrder('ORDER')).to.be.true;
    });
    it("isForm should return TRUE given FORM", function () {
        chai_1.expect(validateController.isForm('FORM')).to.be.true;
    });
    it("isGroup should return TRUE given GROUP", function () {
        chai_1.expect(validateController.isGroup('GROUP')).to.be.true;
    });
    it('invalid logic comparison of 0 filters', function () {
        var query = {
            "AND": []
        };
        try {
            validateController.getWhereKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid LOGICCOMPARISON. Must contain at least 1 FILTER');
        }
    });
    it('should return error if mcomparator (LT/EQ/GT) contains more than 1 parameter', function () {
        var query = {
            "AND": [{
                    "LT": {
                        "courses_avg": 99,
                        "courses_pass": 20
                    }
                },
                { "GT": { "courses_avg": 99 } }]
        };
        try {
            validateController.getWhereKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid MCOMPARISON. Cannot contain more than 1 MCOMPARATOR');
        }
    });
    it('should return error if mcomparator compares nothing', function () {
        var query = {
            "AND": [{
                    "LT": {}
                },
                { "GT": { "courses_avg": 99 } }]
        };
        try {
            validateController.getWhereKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid MCOMPARISON. Require a number key');
        }
    });
    it('should return error if mcomparator compares invalid key', function () {
        var query = {
            "AND": [{
                    "LT": { "coursesavg": 0
                    }
                },
                { "GT": { "courses_avg": 99 } }]
        };
        try {
            validateController.getWhereKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid key.');
        }
    });
    it('should return error if IS contains more than 1 parameter', function () {
        var query = {
            "AND": [{
                    "IS": { "courses_title": "math", "courses_instructor": "somebody"
                    }
                },
                { "GT": { "courses_avg": 99 } }]
        };
        try {
            validateController.getWhereKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid SCOMPARISON. Cannot contain more than 1 IS');
        }
    });
    it('should return error if NOT contains more than 1 filter', function () {
        var query = {
            "NOT": {
                "IS": { "courses_title": 123 },
                "GT": { "courses_avg": 99 }
            }
        };
        try {
            validateController.getWhereKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid NEGATION. Cannot contain more than 1 FILTER');
        }
    });
    it('should return error filter not recognized', function () {
        var query = {
            "DOTHIS": {
                "GT": { "courses_avg": 99 }
            }
        };
        try {
            validateController.getWhereKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid filter');
        }
    });
    it('should return error if more than one apply token given', function () {
        var query = { "OPTIONS": {
                "COLUMNS": [
                    "courses_id",
                    "numProf"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["numProf", "courses_id"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_id"],
                "APPLY": [{
                        "numProf": {
                            "COUNT": "courses_instructor", "SUM": "courses_pass"
                        }
                    }]
            } };
        try {
            validateController.getOptionTransKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid APPLYKEY. Must contain only 1 APPLYTOKEN');
        }
    });
    it('should return error filter not recognized', function () {
        var query = { "OPTIONS": {
                "COLUMNS": [
                    "courses_id",
                    "numProf"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["numProf", "courses_id"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_id"],
                "APPLY": [{
                        "numProf": {
                            "COUNT": "courses_instructor"
                        }
                    },
                    { 'sumPass': {
                            "SUM": "courses_pass"
                        }
                    }]
            } };
        try {
            validateController.getOptionTransKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid APPLYKEY. Must contain only 1 APPLYTOKEN');
        }
    });
    it('does this fail', function () {
        var query = { "OPTIONS": {
                "COLUMNS": [
                    "courses_id",
                    "numProf"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["numProf", "courses_id"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_id"],
                "APPLY": [{
                        "numProf": {
                            "COUNT": "courses_instructor"
                        }
                    }]
            } };
        try {
            validateController.getOptionTransKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid APPLYKEY. Must contain only 1 APPLYTOKEN');
        }
    });
    it('apply with duplicate same token should return error', function () {
        var query = { "OPTIONS": {
                "COLUMNS": [
                    "courses_id",
                    "numProf"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["numProf", "courses_id"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_id"],
                "APPLY": [{
                        "numProf": {
                            "COUNT": "courses_instructor"
                        }
                    },
                    {
                        "numProf": {
                            "COUNT": "courses_instructor"
                        }
                    }]
            } };
        try {
            validateController.getOptionTransKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid APPLY. Must not contain duplicate apply keys.');
        }
    });
    it('TRANSFORMATIONS with invalid keys should return error', function () {
        var query = { "OPTIONS": {
                "COLUMNS": [
                    "courses_id",
                    "numProf"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["numProf", "courses_id"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "G": ["courses_id"],
                "A": [{
                        "numProf": {
                            "COUNT": "courses_instructor"
                        }
                    }]
            } };
        try {
            validateController.getOptionTransKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid TRANSFORMATIONS');
        }
    });
    it('OPTIONS with invalid key', function () {
        var query = { "OPTIONS": {
                "C": [
                    "courses_id",
                    "numProf"
                ],
                "O": {
                    "dir": "DOWN",
                    "keys": ["numProf", "courses_id"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_id"],
                "APPLY": [{
                        "numProf": {
                            "COUNT": "courses_instructor"
                        }
                    }]
            } };
        try {
            validateController.getOptionTransKeys(query);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid OPTIONS');
        }
    });
    it('checkArrUnderScore should throw error if one element doesnt have underscores', function () {
        try {
            validateController.checkArrUnderScore(['courses_id', 'courses_pass', 'courses']);
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: key in COLUMNS is not valid. Must contain an underscore');
        }
    });
    it('checkArrUnderScore should NOT throw error if all elements have underscores', function () {
        try {
            validateController.checkArrUnderScore(['courses_id', 'courses_pass', 'courses_fail']);
        }
        catch (error) {
            chai_1.expect.fail();
        }
    });
    it('checkStringUnderScore should throw error if one element doesnt have underscores', function () {
        try {
            validateController.checkStrUnderScore('courses');
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: courses is not valid. Must contain an underscore');
        }
    });
    it('checkStringUnderScore should NOT throw error if string has underscore', function () {
        try {
            validateController.checkStrUnderScore('courses_pass');
        }
        catch (error) {
            chai_1.expect.fail();
        }
    });
    it('checkArray should NOT throw error if array is given', function () {
        try {
            validateController.checkArray([], 'GROUP');
        }
        catch (error) {
            chai_1.expect.fail();
        }
    });
    it('checkNonEmptyArr should throw error if empty array given', function () {
        try {
            validateController.checkNonEmptyArr([], 'OPTIONS');
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid OPTIONS. Must specify at least 1 key');
        }
    });
    it('checkString should throw error if integer given', function () {
        try {
            validateController.checkString(3, 'GROUP');
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid GROUP. Must be a string');
        }
    });
    it('checkNoUnderScore should throw error if string with underscore given', function () {
        try {
            validateController.checkNoUnderScore('courses_pass', 'GROUP');
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid GROUP. Cannot contain underscore');
        }
    });
    it('checkUpDown should throw error if UP/DOWN not given', function () {
        try {
            validateController.checkUpDown('LEFT');
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid OPTIONS. dir must be UP or DOWN');
        }
    });
    it('checkTable should throw error if TABLE not given', function () {
        try {
            validateController.checkTable('LEFT');
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid FORM. Must be TABLE.');
        }
    });
    it('checkStringOrObj should throw error if array given', function () {
        try {
            validateController.checkStringOrObj([], 'GROUP');
        }
        catch (error) {
            chai_1.expect(error.toString()).to.equal('Error: invalid GROUP. Must be a string or object.');
        }
    });
    it('checkStringOrObj should NOT throw error if string given', function () {
        try {
            validateController.checkStringOrObj('courses_pass', 'GROUP');
        }
        catch (error) {
            chai_1.expect.fail();
        }
    });
    it('checkStringOrObj should NOT throw error if object given', function () {
        try {
            validateController.checkStringOrObj({}, 'GROUP');
        }
        catch (error) {
            chai_1.expect.fail();
        }
    });
});
//# sourceMappingURL=validateControllerUnitSpec.js.map