"use strict";
var chai_1 = require("chai");
var Util_1 = require("../../src/Util");
var InsightFacade_1 = require("../../src/controller/InsightFacade");
var QueryController_1 = require("../../src/controller/QueryController");
describe('queryControllerUnitSpec', function () {
    var fs = require("fs");
    var queryController = new QueryController_1.default();
    var insightFacade = new InsightFacade_1.default();
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
    it("should return invalid logic comparison error if no filter given for logic comparison", function () {
        var query = {
            "WHERE": {
                "AND": []
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "courses_uuid",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({
                code: 400,
                body: { error: 'invalid LOGICCOMPARISON. Must contain at least 1 FILTER' }
            });
        });
    });
    it("should return error if mcomparator (LT/EQ/GT) contains more than 1 parameter", function () {
        var query = {
            "WHERE": {
                "AND": [{
                        "LT": {
                            "courses_avg": 99,
                            "courses_pass": 20
                        }
                    },
                    { "GT": { "courses_avg": 99 } }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({
                code: 400,
                body: { error: 'invalid MCOMPARISON. Cannot contain more than 1 MCOMPARATOR' }
            });
        });
    });
    it("should return error if mcomparitor tries to compare a non numerical key", function () {
        var query = {
            "WHERE": {
                "AND": [{
                        "LT": { "courses_avg": "2", }
                    },
                    { "GT": { "courses_avg": 99 } }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({
                code: 400,
                body: { error: 'invalid MCOMPARISON. Must compare with a number' }
            });
        });
    });
    it("should return error if scomparison tries to compare with more than 1 object", function () {
        var query = {
            "WHERE": {
                "AND": [{
                        "IS": {
                            "courses_avg": 50,
                            "courses_pass": 99
                        }
                    },
                    { "GT": { "courses_avg": 99 } }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({
                code: 400,
                body: { error: 'invalid SCOMPARISON. Cannot contain more than 1 IS' }
            });
        });
    });
    it("should return error if scomparison tries to compare with an int", function () {
        var query = {
            "WHERE": {
                "AND": [
                    { "IS": { "courses_title": 50 } },
                    { "GT": { "courses_avg": 99 } }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({
                code: 400,
                body: { error: 'invalid SCOMPARISON. Must compare with a string' }
            });
        });
    });
    it("should return error if negation with more than 1 filter is inputted", function () {
        var query = {
            "WHERE": {
                "NOT": { "GT": { "courses_avg": 97 }, "LT": { "courses_pass": 97 } }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({
                code: 400,
                body: { error: 'invalid NEGATION. Cannot contain more than 1 FILTER' }
            });
        });
    });
    it("should return error if invalid order in form of a string is inputted", function () {
        var query = {
            "WHERE": {
                "NOT": { "GT": { "courses_avg": 97 } }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": 5,
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'invalid ORDER. Must be a string or object' } });
        });
    });
    it("should return error if given invalid ORDER", function () {
        var query = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_avg"
                ],
                "ORDER": 2,
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'invalid ORDER. Must be a string or object' } });
        });
    });
    it("should return error if key given in order is not in columns", function () {
        var query = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "courses_uuid",
                    "courses_avg"
                ],
                "ORDER": "courses_pass",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'invalid ORDER. Not in COLUMN' } });
        });
    });
    it("should return error if given invalid ORDER", function () {
        var query = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "courses_avg"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'invalid ORDER. Not in COLUMN' } });
        });
    });
    it("should return error if given invalid FORM", function () {
        var query = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "s"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'invalid FORM. Must be TABLE.' } });
        });
    });
    it("should return error if not given FORM and COLUMNS", function () {
        var query = {
            "WHERE": {},
            "OPTIONS": {
                "ORDER": "courses_uuid"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'invalid OPTION. Must contain COLUMNS and FORM.' } });
        });
    });
    it("should return error if invalid form in form of a string is inputted", function () {
        var query = {
            "WHERE": {
                "NOT": { "GT": { "courses_avg": 97 } }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_dept",
                "FORM": "i dunno"
            }
        };
        return insightFacade.performQuery(query).then(function (result) {
            console.log(result);
            chai_1.expect.fail();
        })
            .catch(function (err) {
            chai_1.expect(err).to.deep.equal({ code: 400, body: { error: 'invalid FORM. Must be TABLE.' } });
        });
    });
    it("handleOr: three same objects", function () {
        var testArray = [
            [{ "test": 0 }],
            [{ "test": 0 }],
            [{ "test": 0 }]
        ];
        chai_1.expect(queryController.handleOr(testArray)).to.deep.equal([{ "test": 0 }]);
    });
    it("handleOr", function () {
        var testArray = [
            [{ "test": 0 }, { "course": 1 }],
            [{ "test": 0 }],
            [{ "test": 0 }]
        ];
        chai_1.expect(queryController.handleOr(testArray)).to.deep.equal([{ 'test': 0 }, { 'course': 1 }]);
    });
    it("handleOr", function () {
        var testArray = [
            [{ "test": 0 }, { "course": 1 }],
            [{ "section": 2 }]
        ];
        chai_1.expect(queryController.handleOr(testArray)).to.deep.equal([{ 'test': 0 }, { 'course': 1 }, { "section": 2 }]);
    });
    it("handleNot delete none", function () {
        var deleteArray = [];
        var fromArray = {
            "courses": [
                { 'Avg': 60, 'Course': 100 }, { 'Avg': 90, 'Course': 200 }, { 'Avg': 95, 'Course': 250 }
            ]
        };
        var ans = [
            { 'Avg': 60, 'Course': 100 }, { 'Avg': 90, 'Course': 200 }, { 'Avg': 95, 'Course': 250 }
        ];
        chai_1.expect(queryController.handleNegation(deleteArray, fromArray)).to.deep.equal(ans);
    });
    it("handleNot delete single object", function () {
        var deleteArray = [{ "Avg": 60, 'Course': 300 }];
        var fromArray = {
            "courses": [
                { "Avg": 60, 'Course': 300 }, { 'Avg': 90, 'Course': 200 }, { 'Avg': 95, 'Course': 250 }
            ]
        };
        var ans = [{ 'Avg': 90, 'Course': 200 }, { 'Avg': 95, 'Course': 250 }];
        chai_1.expect(queryController.handleNegation(deleteArray, fromArray)).to.deep.equal(ans);
    });
    it("handleNot delete multiple", function () {
        var deleteArray = [{ 'Avg': 60, 'Course': 100 }, { 'Avg': 90, 'Course': 200 }];
        var fromArray = {
            "courses": [
                { 'Avg': 60, 'Course': 100 }, { 'Avg': 90, 'Course': 200 }, { 'Avg': 95, 'Course': 250 }
            ]
        };
        var ans = [{ 'Avg': 95, 'Course': 250 }];
        chai_1.expect(queryController.handleNegation(deleteArray, fromArray)).to.deep.equal(ans);
    });
    it("handleMComp LT no matched result case", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Course': 300 }, { 'Avg': 90, 'Course': 200 }, { 'Avg': 95, 'Course': 250 }
            ]
        };
        var testSubQuery = { "courses_avg": 59 };
        chai_1.expect(queryController.handleMComp('LT', testSubQuery, testArray)).to.deep.equal([]);
    });
    it("handleMComp LT single result case", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Course': 300 }, { 'Avg': 90, 'Course': 200 }, { 'Avg': 95, 'Course': 250 }
            ]
        };
        var testSubQuery = { "courses_avg": 85 };
        chai_1.expect(queryController.handleMComp('LT', testSubQuery, testArray)).to.deep.equal([{ Avg: 60, Course: 300 }]);
    });
    it("handleMComp GT double result case", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Course': 300 }, { 'Avg': 90, 'Course': 200 }, { 'Avg': 95, 'Course': 250 }
            ]
        };
        var testSubQuery = { "courses_avg": 85 };
        chai_1.expect(queryController.handleMComp('GT', testSubQuery, testArray)).to.deep.equal([{ Avg: 90, Course: 200 },
            { 'Avg': 95, 'Course': 250 }]);
    });
    it("handleMComp EQ double result case", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Course': 300 }, { 'Avg': 90, 'Course': 200 }, { 'Avg': 90, 'Course': 250 }
            ]
        };
        var testSubQuery = { "courses_avg": 90 };
        chai_1.expect(queryController.handleMComp('EQ', testSubQuery, testArray)).to.deep.equal([{ 'Avg': 90, 'Course': 200 },
            { 'Avg': 90, 'Course': 250 }]);
    });
    it("handleSComp single result", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Subject': '300' }, { 'Avg': 90, 'Subject': '200' }, { 'Avg': 90, 'Subject': '250' }
            ]
        };
        var testSubQuery = { "courses_dept": '300' };
        chai_1.expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{ Avg: 60, Subject: '300' }]);
    });
    it("handleSComp double result", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Subject': '300' }, { 'Avg': 90, 'Subject': '200' }, { 'Avg': 90, 'Subject': '300' }
            ]
        };
        var testSubQuery = { "courses_dept": '300' };
        chai_1.expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{ Avg: 60, Subject: '300' },
            { Avg: 90, Subject: '300' }]);
    });
    it("handleSComp no result", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Subject': '300' }, { 'Avg': 90, 'Subject': '200' }, { 'Avg': 90, 'Subject': '300' }
            ]
        };
        var testSubQuery = { "courses_dept": '240' };
        chai_1.expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([]);
    });
    it("handleSComp invalid subquery should result in blank object", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Subject': '300' }, { 'Avg': 90, 'Subject': '200' }, { 'Avg': 90, 'Subject': '250' }
            ]
        };
        var testSubQuery = { "Subject": '300' };
        chai_1.expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([]);
    });
    it("handleSComp using contains (2 *'s)", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Subject': '200 3' }, { 'Avg': 90, 'Subject': '3002' }, {
                    'Avg': 90,
                    'Subject': '132'
                }, { 'Avg': 90, 'Subject': '250' }
            ]
        };
        var testSubQuery = { "courses_dept": '*3*' };
        chai_1.expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{
                'Avg': 60, 'Subject': '200 3'
            }, { 'Avg': 90, 'Subject': '3002' }, { 'Avg': 90, 'Subject': '132' }]);
    });
    it("handleSComp begins with *", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Subject': '300 s' }, { 'Avg': 90, 'Subject': '200' }, { 'Avg': 90, 'Subject': '250' }
            ]
        };
        var testSubQuery = { "courses_dept": '300*' };
        chai_1.expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{ 'Avg': 60, 'Subject': '300 s' }]);
    });
    it("handleSComp ends with * ", function () {
        var testArray = {
            "courses": [
                { 'Avg': 60, 'Subject': '300 s' }, { 'Avg': 90, 'Subject': '200' }, { 'Avg': 90, 'Subject': '250' }
            ]
        };
        var testSubQuery = { "courses_dept": '*s' };
        chai_1.expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{ 'Avg': 60, 'Subject': '300 s' }]);
    });
    it("handleAnd: Return empty array given empty subFilteredResults", function () {
        chai_1.expect(queryController.handleAnd([])).to.deep.equal([]);
    });
    it("handleAnd: Return single object given a single intersection in multiple arrays", function () {
        var testArray = [
            [{ "test": 0 }],
            [{ "test": 0 }],
            [{ "test": 0 }]
        ];
        chai_1.expect(queryController.handleAnd(testArray)).to.deep.equal([{ "test": 0 }]);
    });
    it("handleAnd: Return single object given a multiple intersection in multiple arrays", function () {
        var testArray = [
            [{ "test": 0 }, { "course1": 1 }],
            [{ "test": 0 }, { "course1": 1 }],
            [{ "test": 0 }, { "course1": 1 }]
        ];
        chai_1.expect(queryController.handleAnd(testArray)).to.deep.equal([{ "test": 0 }, { "course1": 1 }]);
    });
    it("handleAnd: Return single object given a single intersection in multiple arrays with multiple objects", function () {
        var testArray = [
            [{ "test": 0 }, { "course1": 1 }],
            [{ "test": 0 }, { "course2": 2 }],
            [{ "test": 0 }, { "course3": 3 }]
        ];
        chai_1.expect(queryController.handleAnd(testArray)).to.deep.equal([{ "test": 0 }]);
    });
    it("handleAnd: Return empty object given a no intersection in multiple arrays with multiple objects", function () {
        var testArray = [
            [{ "test": 1 }, { "course1": 1 }],
            [{ "test": 2 }, { "course2": 2 }],
            [{ "test": 0 }, { "course3": 3 }]
        ];
        chai_1.expect(queryController.handleAnd(testArray)).to.deep.equal([]);
    });
    it("handleAnd: Return empty object given a no intersection in multiple arrays with multiple objects", function () {
        var testArray = [
            [{ "test1": 0 }, { "course1": 1 }],
            [{ "test2": 0 }, { "course2": 2 }],
            [{ "test": 0 }, { "course3": 3 }]
        ];
        chai_1.expect(queryController.handleAnd(testArray)).to.deep.equal([]);
    });
    it("handleAnd: Return intersection given arrays that contain multiple pairs of duplicate objects", function () {
        var testArray = [
            [{ "test1": 0 }, { "course1": 1 }, { "course2": 2 }],
            [{ "test1": 0 }, { "course2": 2 }],
            [{ "test": 0 }, { "course2": 3 }]
        ];
        chai_1.expect(queryController.handleAnd(testArray)).to.deep.equal([]);
    });
    it("handleAnd: Return intersection (just itself) given 1 array with no duplicates", function () {
        var testArray = [
            [{ "test1": 0 }, { "course1": 1 }, { "course2": 2 }],
        ];
        chai_1.expect(queryController.handleAnd(testArray)).to.deep.equal([{ "test1": 0 }, { "course1": 1 }, { "course2": 2 }]);
    });
    it("handleAnd: Return intersection given 1 array with some duplicates", function () {
        var testArray = [
            [{ "test1": 0 }, { "course1": 1 }, { "course1": 1 }],
        ];
        chai_1.expect(queryController.handleAnd(testArray)).to.deep.equal([{ "test1": 0 }, { "course1": 1 }]);
    });
    it("getId should parse key given", function () {
        var result = queryController.getId('instructor');
        chai_1.expect(result).to.eq("instructor");
    });
    it("parseFilter should correctly return an array ", function () {
        var result = queryController.parseFilter({ GT: { course_avg: 97 } }, []);
        chai_1.expect(result).to.deep.equal([]);
    });
    it("parseKey should parse the correct output given valid id and key", function () {
        var result = queryController.parseKey('dept', 'courses');
        chai_1.expect(result).to.eq("Subject");
    });
    it("parseKey should parse the correct output given valid id and key", function () {
        var result = queryController.parseKey('id', 'courses');
        chai_1.expect(result).to.eq("Course");
    });
    it("parseKey should parse the correct output given valid id and key", function () {
        var result = queryController.parseKey('avg', 'courses');
        chai_1.expect(result).to.eq("Avg");
    });
    it("parseKey should parse the correct output given valid id and key", function () {
        var result = queryController.parseKey('instructor', 'courses');
        chai_1.expect(result).to.eq("Professor");
    });
    it("parseKey should parse the correct output given valid id and key", function () {
        var result = queryController.parseKey('title', 'courses');
        chai_1.expect(result).to.eq("Title");
    });
    it("parseKey should parse the correct output given valid id and key", function () {
        var result = queryController.parseKey('pass', 'courses');
        chai_1.expect(result).to.eq("Pass");
    });
    it("parseKey should parse the correct output given valid id and key", function () {
        var result = queryController.parseKey('fail', 'courses');
        chai_1.expect(result).to.eq("Fail");
    });
    it("parseKey should parse the correct output given valid id and key", function () {
        var result = queryController.parseKey('audit', 'courses');
        chai_1.expect(result).to.eq("Audit");
    });
    it("parseKey should parse the correct output given valid id and key", function () {
        var result = queryController.parseKey('uuid', 'courses');
        chai_1.expect(result).to.eq("id");
    });
    it("parseKey should not parse the key given invalid key and valid id", function () {
        var result = queryController.parseKey('idd', 'courses');
        chai_1.expect(result).to.eq("idd");
    });
    it("parseKey should not parse the key given invalid id and valid key", function () {
        var result = queryController.parseKey('instructor', 'ccourses');
        chai_1.expect(result).to.eq("instructor");
    });
    it("isKeyValid should be true given invalid key and invalid", function () {
        chai_1.expect(queryController.isKeyValid('courses_avg', 'f')).to.be.true;
    });
    it("isKeyValid should be true given valid key and id", function () {
        chai_1.expect(queryController.isKeyValid('courses_avg', 'courses')).to.be.true;
    });
    it("isKeyValid should be false given invalid key and valid id", function () {
        chai_1.expect(queryController.isKeyValid('courses_a', 'courses')).to.be.false;
    });
    it("isKeyValid should be false given valid key and invalid id", function () {
        chai_1.expect(queryController.isKeyValid('courses_a', 'courses')).to.be.false;
    });
    it("isLogicComp should return TRUE given AND", function () {
        chai_1.expect(queryController.isLogicComp('AND')).to.be.true;
    });
    it("isLogicComp should return TRUE given OR", function () {
        chai_1.expect(queryController.isLogicComp('OR')).to.be.true;
    });
    it("isLogicComp should return false given neither AND nor OR", function () {
        chai_1.expect(queryController.isLogicComp('NOT')).to.be.false;
    });
    it("isMComp should return true given  LT/GT/EQ", function () {
        chai_1.expect(queryController.isMComp('LT')).to.be.true;
    });
    it("isMComp should return false given neither LT/GT/EQ", function () {
        chai_1.expect(queryController.isMComp('OR')).to.be.false;
    });
    it("isSComp should return true given  IS", function () {
        chai_1.expect(queryController.isSComp('IS')).to.be.true;
    });
    it("isSComp should return false given anything other than IS", function () {
        chai_1.expect(queryController.isSComp('OR')).to.be.false;
    });
    it("isNegation should return false given anything other than NOT", function () {
        chai_1.expect(queryController.isNegation('OR')).to.be.false;
    });
    it("isNegation should return true given NOT", function () {
        chai_1.expect(queryController.isNegation('NOT')).to.be.true;
    });
    it("isColumns should return true given COLUMNS", function () {
        chai_1.expect(queryController.isColumns('COLUMNS')).to.be.true;
    });
    it("isColumns should return false if not given COLUMNS", function () {
        chai_1.expect(queryController.isColumns('NOT')).to.be.false;
    });
    it("isOrder should return true if given ORDER", function () {
        chai_1.expect(queryController.isOrder('ORDER')).to.be.true;
    });
    it("isColumns should return false if not given ORDER", function () {
        chai_1.expect(queryController.isOrder('NOT')).to.be.false;
    });
    it("isForm should return true if given FORM", function () {
        chai_1.expect(queryController.isForm('FORM')).to.be.true;
    });
    it("isColumns should return false if not given FORM", function () {
        chai_1.expect(queryController.isForm('NOT')).to.be.false;
    });
    it("sortData should sort data base on courses_avg as given key UP", function () {
        var result = queryController.sortData("avg", [{ courses_dept: 'adhe', courses_id: '329', avg: 93.33 },
            { courses_dept: 'adhe', courses_id: '329', avg: 90.02 },
            { courses_dept: 'adhe', courses_id: '329', avg: 96.11 },
            { courses_dept: 'adhe', courses_id: '329', avg: 92.54 },
            { courses_dept: 'adhe', courses_id: '329', avg: 90.82 },
            { courses_dept: 'adhe', courses_id: '330', avg: 91.29 }], 'UP');
        chai_1.expect(result).to.deep.equal([{ courses_dept: 'adhe', courses_id: '329', avg: 90.02 },
            { courses_dept: 'adhe', courses_id: '329', avg: 90.82 },
            { courses_dept: 'adhe', courses_id: '330', avg: 91.29 },
            { courses_dept: 'adhe', courses_id: '329', avg: 92.54 },
            { courses_dept: 'adhe', courses_id: '329', avg: 93.33 },
            { courses_dept: 'adhe', courses_id: '329', avg: 96.11 }
        ]);
    });
    it("sortData should sort data base on courses_avg as given key DOWN", function () {
        var result = queryController.sortData("avg", [{ courses_dept: 'adhe', courses_id: '329', avg: "B" },
            { courses_dept: 'adhe', courses_id: '329', avg: "F" },
            { courses_dept: 'adhe', courses_id: '329', avg: "A" },
            { courses_dept: 'adhe', courses_id: '329', avg: "C" },
            { courses_dept: 'adhe', courses_id: '329', avg: "E" },
            { courses_dept: 'adhe', courses_id: '330', avg: "D" }], 'DOWN');
        chai_1.expect(result).to.deep.equal([{ courses_dept: 'adhe', courses_id: '329', avg: "F" },
            { courses_dept: 'adhe', courses_id: '329', avg: "E" },
            { courses_dept: 'adhe', courses_id: '330', avg: "D" },
            { courses_dept: 'adhe', courses_id: '329', avg: "C" },
            { courses_dept: 'adhe', courses_id: '329', avg: "B" },
            { courses_dept: 'adhe', courses_id: '329', avg: "A" }
        ]);
    });
    it("sortData should correctly sort data based on multiple keys 1", function () {
        var result = queryController.sortData(["keyA", "keyB", "keyC"], [{ keyA: 'B', keyB: 10, keyC: 'A' },
            { keyA: 'A', keyB: 5, keyC: 'Z' },
            { keyA: 'C', keyB: 20, keyC: 'E' },
            { keyA: 'C', keyB: 10, keyC: 'A' },
            { keyA: 'B', keyB: 5, keyC: 'C' },
            { keyA: 'A', keyB: 5, keyC: 'A' },], 'UP');
        chai_1.expect(result).to.deep.equal([
            { keyA: 'A', keyB: 5, keyC: 'A' },
            { keyA: 'A', keyB: 5, keyC: 'Z' },
            { keyA: 'B', keyB: 5, keyC: 'C' },
            { keyA: 'B', keyB: 10, keyC: 'A' },
            { keyA: 'C', keyB: 10, keyC: 'A' },
            { keyA: 'C', keyB: 20, keyC: 'E' },
        ]);
    });
    it("sortData should correctly sort data based on multiple keys 2", function () {
        var result = queryController.sortData(["keyC", "keyA", "keyB"], [{ keyA: 'B', keyB: 10, keyC: 'A' },
            { keyA: 'A', keyB: 5, keyC: 'Z' },
            { keyA: 'C', keyB: 20, keyC: 'E' },
            { keyA: 'C', keyB: 10, keyC: 'A' },
            { keyA: 'B', keyB: 5, keyC: 'C' },
            { keyA: 'A', keyB: 5, keyC: 'A' },], 'UP');
        chai_1.expect(result).to.deep.equal([
            { keyA: 'A', keyB: 5, keyC: 'A' },
            { keyA: 'B', keyB: 10, keyC: 'A' },
            { keyA: 'C', keyB: 10, keyC: 'A' },
            { keyA: 'B', keyB: 5, keyC: 'C' },
            { keyA: 'C', keyB: 20, keyC: 'E' },
            { keyA: 'A', keyB: 5, keyC: 'Z' }
        ]);
    });
    it("sortData should correctly sort data based on multiple keys 3", function () {
        var result = queryController.sortData(["keyA", "keyB", "keyC"], [{ keyA: 'B', keyB: 10, keyC: 'A' },
            { keyA: 'A', keyB: 5, keyC: 'Z' },
            { keyA: 'C', keyB: 20, keyC: 'E' },
            { keyA: 'C', keyB: 10, keyC: 'A' },
            { keyA: 'B', keyB: 5, keyC: 'C' },
            { keyA: 'A', keyB: 5, keyC: 'A' }], 'DOWN');
        chai_1.expect(result).to.deep.equal([
            { keyA: 'C', keyB: 20, keyC: 'E' },
            { keyA: 'C', keyB: 10, keyC: 'A' },
            { keyA: 'B', keyB: 10, keyC: 'A' },
            { keyA: 'B', keyB: 5, keyC: 'C' },
            { keyA: 'A', keyB: 5, keyC: 'Z' },
            { keyA: 'A', keyB: 5, keyC: 'A' }
        ]);
    });
    it("sortData should correctly sort data based on multiple keys 4", function () {
        var result = queryController.sortData(["keyA", "keyB", "keyC"], [{ keyA: 'B', keyB: 10, keyC: 'A' },
            { keyA: 'A', keyB: 5, keyC: 'Z' },
            { keyA: 'C', keyB: 20, keyC: 'E' },
            { keyA: 'C', keyB: 10, keyC: 'A' },
            { keyA: 'B', keyB: 5, keyC: 'C' },
            { keyA: 'B', keyB: 1, keyC: 'C' },
            { keyA: 'A', keyB: 5, keyC: 'A' },
            { keyA: 'C', keyB: 20, keyC: 'Z' }], 'UP');
        chai_1.expect(result).to.deep.equal([
            { keyA: 'A', keyB: 5, keyC: 'A' },
            { keyA: 'A', keyB: 5, keyC: 'Z' },
            { keyA: 'B', keyB: 1, keyC: 'C' },
            { keyA: 'B', keyB: 5, keyC: 'C' },
            { keyA: 'B', keyB: 10, keyC: 'A' },
            { keyA: 'C', keyB: 10, keyC: 'A' },
            { keyA: 'C', keyB: 20, keyC: 'E' },
            { keyA: 'C', keyB: 20, keyC: 'Z' }
        ]);
    });
    it("sortData should correctly sort data based on multiple keys 5", function () {
        var result = queryController.sortData(["avg", "courses_id", "courses_dept"], [{ Subject: 'adhe', Course: 'B', avg: 90.02 },
            { Subject: 'cpsc', Course: 'A', avg: 90.02 },
            { Subject: 'adhe', Course: 'E', avg: 96.11 },
            { Subject: 'adhe', Course: 'P', avg: 92.54 },
            { Subject: 'adhe', Course: 'F', avg: 90.82 },
            { Subject: 'adhe', Course: 'E', avg: 96.11 },
            { Subject: 'econ', Course: 'P', avg: 92.54 }], 'UP');
        chai_1.expect(result).to.deep.equal([{ Subject: 'cpsc', Course: 'A', avg: 90.02 },
            { Subject: 'adhe', Course: 'B', avg: 90.02 },
            { Subject: 'adhe', Course: 'F', avg: 90.82 },
            { Subject: 'adhe', Course: 'P', avg: 92.54 },
            { Subject: 'econ', Course: 'P', avg: 92.54 },
            { Subject: 'adhe', Course: 'E', avg: 96.11 },
            { Subject: 'adhe', Course: 'E', avg: 96.11 }]);
    });
    it("parseGroup with different values on all keys should return all unique pairings", function () {
        var p1 = ["rooms_furniture", "rooms_type"];
        var p2 = [
            { 'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 8 },
            { 'rooms_furniture': 'chair', 'rooms_type': 'medium', 'rooms_seats': 6 },
            { 'rooms_furniture': 'desk', 'rooms_type': 'small', 'rooms_seats': 3 }
        ];
        var groupedKeys = {};
        var result = queryController.parseGroup(p1, p2, groupedKeys);
        var ans = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }],
            'chair,medium': [{ rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6 }],
            'desk,small': [{ rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }]
        };
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseGroup with same values on second key but different on first should return all unique pairings", function () {
        var p1 = ["rooms_furniture", "rooms_type"];
        var p2 = [
            { 'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 8 },
            { 'rooms_furniture': 'chair', 'rooms_type': 'large', 'rooms_seats': 6 },
            { 'rooms_furniture': 'desk', 'rooms_type': 'large', 'rooms_seats': 3 }
        ];
        var groupedKeys = {};
        var result = queryController.parseGroup(p1, p2, groupedKeys);
        var ans = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }],
            'chair,large': [{ rooms_furniture: 'chair', rooms_type: 'large', rooms_seats: 6 }],
            'desk,large': [{ rooms_furniture: 'desk', rooms_type: 'large', rooms_seats: 3 }]
        };
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseGroup with same values on all keys should return a single key at the beginning", function () {
        var p1 = ["rooms_furniture", "rooms_type"];
        var p2 = [
            { 'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 8 },
            { 'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 6 },
            { 'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 3 }
        ];
        var groupedKeys = {};
        var result = queryController.parseGroup(p1, p2, groupedKeys);
        var ans = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 },
                { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 6 },
                { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 3 }]
        };
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseGroup with same values on all keys should return a 2 keys at the beginning", function () {
        var p1 = ["rooms_furniture", "rooms_type"];
        var p2 = [
            { 'rooms_furniture': 'table', 'rooms_type': 'small', 'rooms_seats': 8 },
            { 'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 6 },
            { 'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 3 }
        ];
        var groupedKeys = {};
        var result = queryController.parseGroup(p1, p2, groupedKeys);
        var ans = {
            'table,small': [{ rooms_furniture: 'table', rooms_type: 'small', rooms_seats: 8 }],
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 6 },
                { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 3 }]
        };
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseApply with single item per unique grouping, applying only MAX", function () {
        var p1 = [{
                "maxSeats": {
                    "MAX": "rooms_seats"
                }
            }];
        var groupedData = {
            'table,large': [{ rooms_seats: 8 }],
            'chair,medium': [{ rooms_seats: 6 }],
            'desk,small': [{ rooms_seats: 3 }]
        };
        var result = queryController.parseApply(p1, groupedData);
        var ans = [
            { "maxSeats": 8, 'rooms_seats': 8 },
            { "maxSeats": 6, 'rooms_seats': 6 },
            { "maxSeats": 3, 'rooms_seats': 3 }
        ];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseApply with multiple items per unique grouping, applying only MIN", function () {
        var p1 = [{
                "minSeats": {
                    "MIN": "rooms_seats"
                }
            }];
        var groupedData = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 9 }, {
                    rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 1
                },
                { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }],
            'chair,medium': [{
                    rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6
                },
                { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 10 }],
            'desk,small': [{ rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }]
        };
        var result = queryController.parseApply(p1, groupedData);
        var ans = [
            { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 9, minSeats: 1 },
            { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, minSeats: 6 },
            { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, minSeats: 3 }
        ];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseApply with multiple items per unique grouping, applying only AVG", function () {
        var p1 = [{
                "avgSeats": {
                    "AVG": "rooms_seats"
                }
            }];
        var groupedData = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }, { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10 }],
            'chair,medium': [{ rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6 }],
            'desk,small': [{ rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }, { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }]
        };
        var result = queryController.parseApply(p1, groupedData);
        var ans = [
            { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, avgSeats: 9 },
            { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, avgSeats: 6 },
            { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, avgSeats: 3 }
        ];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseApply with multiple items per unique grouping, applying only COUNT", function () {
        var p1 = [{
                "countSeats": {
                    "COUNT": "rooms_seats"
                }
            }];
        var groupedData = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }, { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10 }],
            'chair,medium': [{ rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6 }],
            'desk,small': [{ rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }, { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }]
        };
        var result = queryController.parseApply(p1, groupedData);
        var ans = [
            { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, countSeats: 2 },
            { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, countSeats: 1 },
            { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, countSeats: 1 }
        ];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseApply with multiple items per unique grouping, applying only COUNT", function () {
        var p1 = [{
                "countTypes": {
                    "COUNT": "rooms_type"
                }
            }];
        var groupedData = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }, { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10 }],
            'chair,medium': [{ rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6 }],
            'desk,small': [{ rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }, { rooms_furniture: 'desk', rooms_type: 'medium', rooms_seats: 3 }]
        };
        var result = queryController.parseApply(p1, groupedData);
        var ans = [
            { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, countTypes: 1 },
            { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, countTypes: 1 },
            { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, countTypes: 2 }
        ];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseApply with multiple items per unique grouping, applying only SUM", function () {
        var p1 = [{
                "sumSeats": {
                    "SUM": "rooms_seats"
                }
            }];
        var groupedData = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }, { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10 }],
            'chair,medium': [{ rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6 }],
            'desk,small': [{ rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }, { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }]
        };
        var result = queryController.parseApply(p1, groupedData);
        var ans = [
            { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, sumSeats: 18 },
            { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, sumSeats: 6 },
            { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, sumSeats: 6 }
        ];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseApply with multiple items per unique grouping, applying MIN and MAX", function () {
        var p1 = [{
                "maxSeats": {
                    "MAX": "rooms_seats"
                }
            },
            {
                "minSeats": {
                    "MIN": "rooms_seats"
                }
            }];
        var groupedData = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }, { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10 }],
            'chair,medium': [{ rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6 }],
            'desk,small': [{ rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }, { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 4 }, { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 5 }]
        };
        var result = queryController.parseApply(p1, groupedData);
        var ans = [
            { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, maxSeats: 10, minSeats: 8 },
            { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, maxSeats: 6, minSeats: 6 },
            { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, maxSeats: 5, minSeats: 3 }
        ];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseApply with 2 item in one unique grouping, applying COUNT AND AVG", function () {
        var p1 = [{
                "countSeats": {
                    "COUNT": "rooms_seats"
                }
            },
            {
                "avgSeats": {
                    "AVG": "rooms_seats"
                }
            }];
        var groupedData = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }, { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10 }],
            'chair,medium': [{ rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6 }],
            'desk,small': [{ rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }, { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 4 }, { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 5 }]
        };
        var result = queryController.parseApply(p1, groupedData);
        var ans = [
            { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, countSeats: 2, avgSeats: 9 },
            { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, countSeats: 1, avgSeats: 6 },
            { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, countSeats: 3, avgSeats: 4 }
        ];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseApply with 2 item in one unique grouping, applying COUNT, SUM AND AVG", function () {
        var p1 = [{
                "countSeats": {
                    "COUNT": "rooms_seats"
                }
            },
            {
                "sumSeats": {
                    "SUM": "rooms_seats"
                }
            },
            {
                "avgSeats": {
                    "AVG": "rooms_seats"
                }
            }];
        var groupedData = {
            'table,large': [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8 }, { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10 }],
            'chair,medium': [{ rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6 }],
            'desk,small': [{ rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3 }, { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 4 }, { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 5 }]
        };
        var result = queryController.parseApply(p1, groupedData);
        var ans = [
            { rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, countSeats: 2, sumSeats: 18, avgSeats: 9 },
            { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, countSeats: 1, sumSeats: 6, avgSeats: 6 },
            { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, countSeats: 3, sumSeats: 12, avgSeats: 4 }
        ];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("calculateCount", function () {
        var group = [{ "keyA": "valA", "keyB": "val1" }, { "keyA": "valA", "keyB": "val2" }, { "keyA": "valA", "keyB": "val3" }, { "keyA": "valA", "keyB": "val2" }, { "keyA": "valA", "keyB": "val1" }];
        var result = queryController.calculateCount(group, "keyB", 'appKey');
        chai_1.expect(result).to.deep.eq({ "keyA": "valA", "keyB": "val1", "appKey": 3 });
    });
    it("calculateCount", function () {
        var group = [{ "keyA": "valA", "keyB": "val1" }, { "keyA": "valA", "keyB": "val2" }, { "keyA": "valA", "keyB": "val3" }, { "keyA": "valA", "keyB": "val2" }, { "keyA": "valA", "keyB": "val1" }, { "keyA": "valA", "keyB": 0 }, { "keyA": "valA", "keyB": 0 }, { "keyA": "valA", "keyB": 1 }];
        var result = queryController.calculateCount(group, "keyB", 'appKey');
        chai_1.expect(result).to.deep.eq({ "keyA": "valA", "keyB": "val1", "appKey": 5 });
    });
    var testingDataParseGroup = [
        { "keyA": "valA", "keyB": "valB", "keyC": "valC" },
        { "keyA": "valD", "keyB": "valB", "keyC": "valC" },
        { "keyA": "valE", "keyB": "valF", "keyC": "valD" },
        { "keyA": "valA", "keyB": "valF", "keyC": "valD" },
        { "keyA": "valD", "keyB": "valB", "keyC": "valD" },
        { "keyA": "valE", "keyB": "valD", "keyC": "valD" }
    ];
    it("should group items based on a single key", function () {
        var ans = {
            "valA": [{ "keyA": "valA", "keyB": "valB", "keyC": "valC" }, {
                    "keyA": "valA",
                    "keyB": "valF",
                    "keyC": "valD"
                }],
            "valD": [{ "keyA": "valD", "keyB": "valB", "keyC": "valC" }, {
                    "keyA": "valD",
                    "keyB": "valB",
                    "keyC": "valD"
                }],
            "valE": [{ "keyA": "valE", "keyB": "valF", "keyC": "valD" }, {
                    "keyA": "valE",
                    "keyB": "valD",
                    "keyC": "valD"
                }],
        };
        var result = queryController.parseGroup(['keyA'], testingDataParseGroup, {});
        chai_1.expect(result).deep.eq(ans);
    });
    it("should group items based on multiple keys", function () {
        var ans = {
            "valB,valC": [{ "keyA": "valA", "keyB": "valB", "keyC": "valC" }, {
                    "keyA": "valD",
                    "keyB": "valB",
                    "keyC": "valC"
                }],
            "valF,valD": [{ "keyA": "valE", "keyB": "valF", "keyC": "valD" }, {
                    "keyA": "valA",
                    "keyB": "valF",
                    "keyC": "valD"
                }],
            "valB,valD": [{ "keyA": "valD", "keyB": "valB", "keyC": "valD" }],
            "valD,valD": [{ "keyA": "valE", "keyB": "valD", "keyC": "valD" }]
        };
        var result = queryController.parseGroup(['keyB', 'keyC'], testingDataParseGroup, {});
        chai_1.expect(result).deep.eq(ans);
    });
    it("parseTransformations should return the correct format", function () {
        var p1 = {
            "GROUP": ["rooms_furniture", "rooms_type"],
            "APPLY": [{
                    "countseats": {
                        "COUNT": "rooms_seats"
                    }
                },
                {
                    "avgSeats": {
                        "AVG": "rooms_seats"
                    }
                }]
        };
        var p2 = [{ 'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 8 },
            { 'rooms_furniture': 'chair', 'rooms_type': 'medium', 'rooms_seats': 6 },
            { 'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 10 },
            { 'rooms_furniture': 'desk', 'rooms_type': 'small', 'rooms_seats': 3 }];
        var result = queryController.parseTransformations(p1, p2);
        var ans = [{ rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, countseats: 2, avgSeats: 9 },
            { rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, countseats: 1, avgSeats: 6 },
            { rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, countseats: 1, avgSeats: 3 }];
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseOptions sorting DOWN with one key in ORDER", function () {
        var queryOption = {
            "COLUMNS": [
                "rooms_type",
                "minSeats"
            ],
            "ORDER": {
                "dir": "DOWN",
                "keys": ["minSeats"]
            },
            "FORM": "TABLE"
        };
        var data = [{
                rooms_furniture: 'table',
                rooms_type: 'large',
                countseats: 1,
                minSeats: 8
            },
            {
                rooms_furniture: 'chair',
                rooms_type: 'medium',
                countseats: 1,
                minSeats: 6
            },
            {
                rooms_furniture: 'desk',
                rooms_type: 'small',
                countseats: 1,
                minSeats: 3
            }];
        var result = queryController.parseOptions(queryOption, data);
        var ans = {
            render: 'TABLE',
            result: [{ rooms_type: 'large', minSeats: 8 },
                { rooms_type: 'medium', minSeats: 6 },
                { rooms_type: 'small', minSeats: 3 }]
        };
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseOptionsTrans sorting UP with multiple keys in ORDER", function () {
        var p1 = {
            "COLUMNS": [
                "rooms_type",
                "minSeats",
                "countseats"
            ],
            "ORDER": {
                "dir": "UP",
                "keys": ["minSeats", "countseats"]
            },
            "FORM": "TABLE"
        };
        var p2 = [{
                rooms_furniture: 'table',
                rooms_type: 'large',
                countseats: 1,
                minSeats: 8
            },
            {
                rooms_furniture: 'chair',
                rooms_type: 'medium',
                countseats: 2,
                minSeats: 6
            },
            {
                rooms_furniture: 'chair',
                rooms_type: 'medium',
                countseats: 1,
                minSeats: 6
            },
            {
                rooms_furniture: 'desk',
                rooms_type: 'small',
                countseats: 1,
                minSeats: 3
            }];
        var result = queryController.parseOptions(p1, p2);
        var ans = {
            render: 'TABLE',
            result: [{ rooms_type: 'small', minSeats: 3, countseats: 1 },
                { rooms_type: 'medium', minSeats: 6, countseats: 1 },
                { rooms_type: 'medium', minSeats: 6, countseats: 2 },
                { rooms_type: 'large', minSeats: 8, countseats: 1 }]
        };
        chai_1.expect(result).to.deep.eq(ans);
    });
    it("parseOptionsTrans sorting UP with multiple keys in ORDER", function () {
        var p1 = {
            "COLUMNS": [
                "rooms_type",
                "minSeats",
                "countseats"
            ],
            "ORDER": {
                "dir": "UP",
                "keys": ["minSeats", "countseats"]
            },
            "FORM": "TABLE"
        };
        var p2 = [{
                rooms_furniture: 'table',
                rooms_type: 'large',
                countseats: 1,
                minSeats: 8
            },
            {
                rooms_furniture: 'chair',
                rooms_type: 'medium',
                countseats: 2,
                minSeats: 6
            },
            {
                rooms_furniture: 'chair',
                rooms_type: 'medium',
                countseats: 1,
                minSeats: 7
            },
            {
                rooms_furniture: 'desk',
                rooms_type: 'small',
                countseats: 1,
                minSeats: 3
            }];
        var result = queryController.parseOptions(p1, p2);
        var ans = {
            render: 'TABLE',
            result: [{ rooms_type: 'small', minSeats: 3, countseats: 1 },
                { rooms_type: 'medium', minSeats: 6, countseats: 2 },
                { rooms_type: 'medium', minSeats: 7, countseats: 1 },
                { rooms_type: 'large', minSeats: 8, countseats: 1 }]
        };
        chai_1.expect(result).to.deep.eq(ans);
    });
});
//# sourceMappingURL=queryControllerUnitSpec.js.map