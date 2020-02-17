import {expect} from "chai";
import Log from "../../src/Util";
import {QueryRequest} from "../../src/controller/IInsightFacade";
import {InsightResponse} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import QueryController from "../../src/controller/QueryController";

describe('queryControllerUnitSpec', function () {

    var fs = require("fs")
    var queryController = new QueryController();
    var insightFacade = new InsightFacade();

    /**
     * Set up
     */
    before(function () {
        Log.test('Before: ' + (<any>this).test.parent.title);
    });

    beforeEach(function () {
        Log.test('BeforeTest: ' + (<any>this).currentTest.title);
    });

    after(function () {
        Log.test('After: ' + (<any>this).test.parent.title);
    });

    afterEach(function () {
        Log.test('AfterTest: ' + (<any>this).currentTest.title);
    });

    /**
     *End of set up
     */

    /**
     * query.WHERE UNIT TESTS
     */

    //TODO: only unit testing methods in queryController. No need to call from InsightFacade.performQuery. Should only call queryController.getKeys


    it("should return invalid logic comparison error if no filter given for logic comparison", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": []
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "courses_uuid",
                    "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail()
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({
                    code: 400,
                    body: {error: 'invalid LOGICCOMPARISON. Must contain at least 1 FILTER'}
                });
            });
    });

    it("should return error if mcomparator (LT/EQ/GT) contains more than 1 parameter", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "LT": {
                        "courses_avg": 99,
                        "courses_pass": 20
                    }
                },
                    {"GT": {"courses_avg": 99}}]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })

            .catch(function (err: any) {
                expect(err).to.deep.equal({
                    code: 400,
                    body: {error: 'invalid MCOMPARISON. Cannot contain more than 1 MCOMPARATOR'}
                });
            });
    });

    it("should return error if mcomparitor tries to compare a non numerical key", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "LT": {"courses_avg": "2",}
                },
                    {"GT": {"courses_avg": 99}}]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })

            .catch(function (err: any) {
                expect(err).to.deep.equal({
                    code: 400,
                    body: {error: 'invalid MCOMPARISON. Must compare with a number'}
                });
            });

    });

    it("should return error if scomparison tries to compare with more than 1 object", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "courses_avg": 50,
                        "courses_pass": 99
                    }
                },
                    {"GT": {"courses_avg": 99}}]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })

            .catch(function (err: any) {
                expect(err).to.deep.equal({
                    code: 400,
                    body: {error: 'invalid SCOMPARISON. Cannot contain more than 1 IS'}
                });
            });

    });

    it("should return error if scomparison tries to compare with an int", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [
                    {"IS": {"courses_title": 50}},
                    {"GT": {"courses_avg": 99}}]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })

            .catch(function (err: any) {
                expect(err).to.deep.equal({
                    code: 400,
                    body: {error: 'invalid SCOMPARISON. Must compare with a string'}
                });
            });

    });

    it("should return error if negation with more than 1 filter is inputted", function () {
        let query: QueryRequest = {
            "WHERE": {
                "NOT": {"GT": {"courses_avg": 97}, "LT": {"courses_pass": 97}}
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({
                    code: 400,
                    body: {error: 'invalid NEGATION. Cannot contain more than 1 FILTER'}
                });
            });

    });

    /**
     * query.WHERE UNIT TESTS
     */

    /**
     * query.OPTIONS UNIT TESTS
     */

    //TODO: unit testing queryController.

    it("should return error if invalid order in form of a string is inputted", function () {
        let query: QueryRequest = {
            "WHERE": {
                "NOT": {"GT": {"courses_avg": 97}}
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": 5,
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'invalid ORDER. Must be a string or object'}});
            });
    });

    it("should return error if given invalid ORDER", function () {
        let query: QueryRequest = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_avg"],
                "ORDER": 2,
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'invalid ORDER. Must be a string or object'}});
            });
    });

    it("should return error if key given in order is not in columns", function () {
        let query: QueryRequest = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "courses_uuid",
                    "courses_avg"],
                "ORDER": "courses_pass",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'invalid ORDER. Not in COLUMN'}});
            });
    });

    it("should return error if given invalid ORDER", function () {
        let query: QueryRequest = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "courses_avg"],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'invalid ORDER. Not in COLUMN'}});
            });
    });

    it("should return error if given invalid FORM", function () {
        let query: QueryRequest = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "s"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'invalid FORM. Must be TABLE.'}});
            });
    });

    it("should return error if not given FORM and COLUMNS", function () {
        let query: QueryRequest = {
            "WHERE": {},
            "OPTIONS": {
                "ORDER": "courses_uuid"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })

            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'invalid OPTION. Must contain COLUMNS and FORM.'}});
            });
    });


    it("should return error if invalid form in form of a string is inputted", function () {
        let query: QueryRequest = {
            "WHERE": {
                "NOT": {"GT": {"courses_avg": 97}}
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_dept",
                "FORM": "i dunno"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'invalid FORM. Must be TABLE.'}});
            });
    });


    /**
     * END OF query.OPTIONS UNIT TESTS
     */


    /**
     * handleOR UNIT TESTS
     */

    it("handleOr: three same objects", function () {

        let testArray: Array<any> = [
            [{"test": 0}],
            [{"test": 0}],
            [{"test": 0}]
        ]
        expect(queryController.handleOr(testArray)).to.deep.equal([{"test": 0}]);
    })

    it("handleOr", function () {

        let testArray: Array<any> = [
            [{"test": 0}, {"course": 1}],
            [{"test": 0}],
            [{"test": 0}]
        ]
        expect(queryController.handleOr(testArray)).to.deep.equal([{'test': 0}, {'course': 1}]);
    })

    it("handleOr", function () {

        let testArray: Array<any> = [
            [{"test": 0}, {"course": 1}],
            [{"section": 2}]
        ]
        expect(queryController.handleOr(testArray)).to.deep.equal([{'test': 0}, {'course': 1}, {"section": 2}]);
    })

    /**
     * END OF handleOR UNIT TESTS
     **/

    /**
     * handleNot UNIT TESTS
     */

    it("handleNot delete none", function () {

        let deleteArray: Array<any> = [];

        let fromArray: any = {
            "courses": [
                {'Avg': 60, 'Course': 100}, {'Avg': 90, 'Course': 200}, {'Avg': 95, 'Course': 250}]
        };

        let ans: Array<any> = [
            {'Avg': 60, 'Course': 100}, {'Avg': 90, 'Course': 200}, {'Avg': 95, 'Course': 250}];
        expect(queryController.handleNegation(deleteArray, fromArray)).to.deep.equal(ans);
    })

    it("handleNot delete single object", function () {

        let deleteArray: Array<any> = [{"Avg": 60, 'Course': 300}];

        let fromArray: any = {
            "courses": [
                {"Avg": 60, 'Course': 300}, {'Avg': 90, 'Course': 200}, {'Avg': 95, 'Course': 250}]
        };

        let ans: Array<any> = [{'Avg': 90, 'Course': 200}, {'Avg': 95, 'Course': 250}];
        expect(queryController.handleNegation(deleteArray, fromArray)).to.deep.equal(ans);
    });

    it("handleNot delete multiple", function () {

        let deleteArray: Array<any> = [{'Avg': 60, 'Course': 100}, {'Avg': 90, 'Course': 200}];

        let fromArray: any = {
            "courses": [
                {'Avg': 60, 'Course': 100}, {'Avg': 90, 'Course': 200}, {'Avg': 95, 'Course': 250}]
        };
        let ans: Array<any> = [{'Avg': 95, 'Course': 250}];
        expect(queryController.handleNegation(deleteArray, fromArray)).to.deep.equal(ans);
    })

    /**
     * END OF handleNot unit tests
     **/

    /**
     * handleMComp unit tests
     */

    it("handleMComp LT no matched result case", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Course': 300}, {'Avg': 90, 'Course': 200}, {'Avg': 95, 'Course': 250}
            ]
        };

        let testSubQuery: any = {"courses_avg": 59}

        expect(queryController.handleMComp('LT', testSubQuery, testArray)).to.deep.equal([]);
    });

    it("handleMComp LT single result case", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Course': 300}, {'Avg': 90, 'Course': 200}, {'Avg': 95, 'Course': 250}
            ]
        };

        let testSubQuery: any = {"courses_avg": 85}

        expect(queryController.handleMComp('LT', testSubQuery, testArray)).to.deep.equal([{Avg: 60, Course: 300}]);
    });

    it("handleMComp GT double result case", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Course': 300}, {'Avg': 90, 'Course': 200}, {'Avg': 95, 'Course': 250}
            ]
        };

        let testSubQuery: any = {"courses_avg": 85};

        expect(queryController.handleMComp('GT', testSubQuery, testArray)).to.deep.equal([{Avg: 90, Course: 200},
            {'Avg': 95, 'Course': 250}]);
    });

    it("handleMComp EQ double result case", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Course': 300}, {'Avg': 90, 'Course': 200}, {'Avg': 90, 'Course': 250}
            ]
        };

        let testSubQuery: any = {"courses_avg": 90};

        expect(queryController.handleMComp('EQ', testSubQuery, testArray)).to.deep.equal([{'Avg': 90, 'Course': 200},
            {'Avg': 90, 'Course': 250}]);
    });

    /**
     *END OF handleMComp unit tests
     */


    /**
     * handleSComp unit tests
     */

    it("handleSComp single result", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Subject': '300'}, {'Avg': 90, 'Subject': '200'}, {'Avg': 90, 'Subject': '250'}
            ]
        };

        let testSubQuery: any = {"courses_dept": '300'};


        expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{Avg: 60, Subject: '300'}]);
    });


    it("handleSComp double result", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Subject': '300'}, {'Avg': 90, 'Subject': '200'}, {'Avg': 90, 'Subject': '300'}
            ]
        };

        let testSubQuery: any = {"courses_dept": '300'};


        expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{Avg: 60, Subject: '300'},
            {Avg: 90, Subject: '300'}]);
    });

    it("handleSComp no result", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Subject': '300'}, {'Avg': 90, 'Subject': '200'}, {'Avg': 90, 'Subject': '300'}
            ]
        };

        let testSubQuery: any = {"courses_dept": '240'};


        expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([]);
    });


    it("handleSComp invalid subquery should result in blank object", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Subject': '300'}, {'Avg': 90, 'Subject': '200'}, {'Avg': 90, 'Subject': '250'}
            ]
        };

        let testSubQuery: any = {"Subject": '300'};

        expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([]);
    });

    it("handleSComp using contains (2 *'s)", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Subject': '200 3'}, {'Avg': 90, 'Subject': '3002'}, {
                    'Avg': 90,
                    'Subject': '132'
                }, {'Avg': 90, 'Subject': '250'}
            ]
        };

        let testSubQuery: any = {"courses_dept": '*3*'};


        expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{
            'Avg': 60, 'Subject': '200 3'
        }, {'Avg': 90, 'Subject': '3002'}, {'Avg': 90, 'Subject': '132'}]);
    })

    it("handleSComp begins with *", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Subject': '300 s'}, {'Avg': 90, 'Subject': '200'}, {'Avg': 90, 'Subject': '250'}
            ]
        };

        let testSubQuery: any = {"courses_dept": '300*'};

        expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{'Avg': 60, 'Subject': '300 s'}]);
    })

    it("handleSComp ends with * ", function () {

        let testArray: any = {
            "courses": [
                {'Avg': 60, 'Subject': '300 s'}, {'Avg': 90, 'Subject': '200'}, {'Avg': 90, 'Subject': '250'}
            ]
        };

        let testSubQuery: any = {"courses_dept": '*s'};


        expect(queryController.handleSComp(testSubQuery, testArray)).to.deep.equal([{'Avg': 60, 'Subject': '300 s'}]);
    })

    /**
     * END OF handleSComp unit tests
     */

    /**
     * handleAnd UNIT TESTS
     */

    it("handleAnd: Return empty array given empty subFilteredResults", function () {
        expect(queryController.handleAnd([])).to.deep.equal([]);
    })

    it("handleAnd: Return single object given a single intersection in multiple arrays", function () {

        let testArray: Array<any> = [
            [{"test": 0}],
            [{"test": 0}],
            [{"test": 0}]
        ]
        expect(queryController.handleAnd(testArray)).to.deep.equal([{"test": 0}]);
    })

    it("handleAnd: Return single object given a multiple intersection in multiple arrays", function () {

        let testArray: Array<any> = [
            [{"test": 0}, {"course1": 1}],
            [{"test": 0}, {"course1": 1}],
            [{"test": 0}, {"course1": 1}]
        ]
        expect(queryController.handleAnd(testArray)).to.deep.equal([{"test": 0}, {"course1": 1}]);
    })

    it("handleAnd: Return single object given a single intersection in multiple arrays with multiple objects", function () {

        let testArray: Array<any> = [
            [{"test": 0}, {"course1": 1}],
            [{"test": 0}, {"course2": 2}],
            [{"test": 0}, {"course3": 3}]
        ]
        expect(queryController.handleAnd(testArray)).to.deep.equal([{"test": 0}]);
    })

    it("handleAnd: Return empty object given a no intersection in multiple arrays with multiple objects", function () {

        let testArray: Array<any> = [
            [{"test": 1}, {"course1": 1}],
            [{"test": 2}, {"course2": 2}],
            [{"test": 0}, {"course3": 3}]
        ]
        expect(queryController.handleAnd(testArray)).to.deep.equal([]);
    })

    it("handleAnd: Return empty object given a no intersection in multiple arrays with multiple objects", function () {

        let testArray: Array<any> = [
            [{"test1": 0}, {"course1": 1}],
            [{"test2": 0}, {"course2": 2}],
            [{"test": 0}, {"course3": 3}]
        ]
        expect(queryController.handleAnd(testArray)).to.deep.equal([]);
    });

    it("handleAnd: Return intersection given arrays that contain multiple pairs of duplicate objects", function () {

        let testArray: Array<any> = [
            [{"test1": 0}, {"course1": 1}, {"course2": 2}],
            [{"test1": 0}, {"course2": 2}],
            [{"test": 0}, {"course2": 3}]
        ]
        expect(queryController.handleAnd(testArray)).to.deep.equal([]);
    });

    it("handleAnd: Return intersection (just itself) given 1 array with no duplicates", function () {

        let testArray: Array<any> = [
            [{"test1": 0}, {"course1": 1}, {"course2": 2}],
        ]
        expect(queryController.handleAnd(testArray)).to.deep.equal([{"test1": 0}, {"course1": 1}, {"course2": 2}]);
    });

    it("handleAnd: Return intersection given 1 array with some duplicates", function () {

        let testArray: Array<any> = [
            [{"test1": 0}, {"course1": 1}, {"course1": 1}],
        ]
        expect(queryController.handleAnd(testArray)).to.deep.equal([{"test1": 0}, {"course1": 1}]);
    });

    /**
     * END OF handleAnd UNIT TESTS
     */

    /**
     * getId & parseFilter UNIT TESTS
     */

    it("getId should parse key given", function () {
        let result: any = queryController.getId('instructor');
        expect(result).to.eq("instructor");
    });

    it("parseFilter should correctly return an array ", function () {
        let result: any = queryController.parseFilter({GT: {course_avg: 97}}, []);
        expect(result).to.deep.equal([]);
    });


    /**
     * END OF getId & isDuplicate & parseFilter UNIT TESTS
     */

    /**
     * parseKeys UNIT TESTS
     */

    it("parseKey should parse the correct output given valid id and key", function () {
        let result: any = queryController.parseKey('dept', 'courses');
        expect(result).to.eq("Subject");
    });

    it("parseKey should parse the correct output given valid id and key", function () {
        let result: any = queryController.parseKey('id', 'courses');
        expect(result).to.eq("Course");
    });

    it("parseKey should parse the correct output given valid id and key", function () {
        let result: any = queryController.parseKey('avg', 'courses');
        expect(result).to.eq("Avg");
    });

    it("parseKey should parse the correct output given valid id and key", function () {
        let result: any = queryController.parseKey('instructor', 'courses');
        expect(result).to.eq("Professor");
    });

    it("parseKey should parse the correct output given valid id and key", function () {
        let result: any = queryController.parseKey('title', 'courses');
        expect(result).to.eq("Title");
    });

    it("parseKey should parse the correct output given valid id and key", function () {
        let result: any = queryController.parseKey('pass', 'courses');
        expect(result).to.eq("Pass");
    });

    it("parseKey should parse the correct output given valid id and key", function () {
        let result: any = queryController.parseKey('fail', 'courses');
        expect(result).to.eq("Fail");
    });

    it("parseKey should parse the correct output given valid id and key", function () {
        let result: any = queryController.parseKey('audit', 'courses');
        expect(result).to.eq("Audit");
    });

    it("parseKey should parse the correct output given valid id and key", function () {
        let result: any = queryController.parseKey('uuid', 'courses');
        expect(result).to.eq("id");
    });

    it("parseKey should not parse the key given invalid key and valid id", function () {
        let result: any = queryController.parseKey('idd', 'courses');
        expect(result).to.eq("idd");
    });

    it("parseKey should not parse the key given invalid id and valid key", function () {
        let result: any = queryController.parseKey('instructor', 'ccourses');
        expect(result).to.eq("instructor");
    });

    /**
     * END OF parseKeys UNIT TESTS
     */

    /**
     * queryController.ts helpers UNIT TESTS
     */

    it("isKeyValid should be true given invalid key and invalid", function () {
        expect(queryController.isKeyValid('courses_avg', 'f')).to.be.true;
    });

    it("isKeyValid should be true given valid key and id", function () {
        expect(queryController.isKeyValid('courses_avg', 'courses')).to.be.true;
    });

    it("isKeyValid should be false given invalid key and valid id", function () {
        expect(queryController.isKeyValid('courses_a', 'courses')).to.be.false;
    });

    it("isKeyValid should be false given valid key and invalid id", function () {
        expect(queryController.isKeyValid('courses_a', 'courses')).to.be.false;
    });

    it("isLogicComp should return TRUE given AND", function () {
        expect(queryController.isLogicComp('AND')).to.be.true;
    });

    it("isLogicComp should return TRUE given OR", function () {
        expect(queryController.isLogicComp('OR')).to.be.true;
    });

    it("isLogicComp should return false given neither AND nor OR", function () {
        expect(queryController.isLogicComp('NOT')).to.be.false;
    });

    it("isMComp should return true given  LT/GT/EQ", function () {
        expect(queryController.isMComp('LT')).to.be.true;
    });

    it("isMComp should return false given neither LT/GT/EQ", function () {
        expect(queryController.isMComp('OR')).to.be.false;
    });

    it("isSComp should return true given  IS", function () {
        expect(queryController.isSComp('IS')).to.be.true;
    });

    it("isSComp should return false given anything other than IS", function () {
        expect(queryController.isSComp('OR')).to.be.false;
    });

    it("isNegation should return false given anything other than NOT", function () {
        expect(queryController.isNegation('OR')).to.be.false;
    });

    it("isNegation should return true given NOT", function () {
        expect(queryController.isNegation('NOT')).to.be.true;
    });

    it("isColumns should return true given COLUMNS", function () {
        expect(queryController.isColumns('COLUMNS')).to.be.true;
    });

    it("isColumns should return false if not given COLUMNS", function () {
        expect(queryController.isColumns('NOT')).to.be.false;
    });

    it("isOrder should return true if given ORDER", function () {
        expect(queryController.isOrder('ORDER')).to.be.true;
    });
    it("isColumns should return false if not given ORDER", function () {
        expect(queryController.isOrder('NOT')).to.be.false;
    });

    it("isForm should return true if given FORM", function () {
        expect(queryController.isForm('FORM')).to.be.true;
    });
    it("isColumns should return false if not given FORM", function () {
        expect(queryController.isForm('NOT')).to.be.false;
    });


    it("sortData should sort data base on courses_avg as given key UP", function () {
        let result: any = queryController.sortData("avg",
            [{courses_dept: 'adhe', courses_id: '329', avg: 93.33},
                {courses_dept: 'adhe', courses_id: '329', avg: 90.02},
                {courses_dept: 'adhe', courses_id: '329', avg: 96.11},
                {courses_dept: 'adhe', courses_id: '329', avg: 92.54},
                {courses_dept: 'adhe', courses_id: '329', avg: 90.82},
                {courses_dept: 'adhe', courses_id: '330', avg: 91.29}], 'UP');
        expect(result).to.deep.equal(
            [{courses_dept: 'adhe', courses_id: '329', avg: 90.02},
                {courses_dept: 'adhe', courses_id: '329', avg: 90.82},
                {courses_dept: 'adhe', courses_id: '330', avg: 91.29},
                {courses_dept: 'adhe', courses_id: '329', avg: 92.54},
                {courses_dept: 'adhe', courses_id: '329', avg: 93.33},
                {courses_dept: 'adhe', courses_id: '329', avg: 96.11}
            ])
    });

    it("sortData should sort data base on courses_avg as given key DOWN", function () {
        let result: any = queryController.sortData("avg",
            [{courses_dept: 'adhe', courses_id: '329', avg: "B"},
                {courses_dept: 'adhe', courses_id: '329', avg: "F"},
                {courses_dept: 'adhe', courses_id: '329', avg: "A"},
                {courses_dept: 'adhe', courses_id: '329', avg: "C"},
                {courses_dept: 'adhe', courses_id: '329', avg: "E"},
                {courses_dept: 'adhe', courses_id: '330', avg: "D"}], 'DOWN');
        expect(result).to.deep.equal(
            [{courses_dept: 'adhe', courses_id: '329', avg: "F"},
                {courses_dept: 'adhe', courses_id: '329', avg: "E"},
                {courses_dept: 'adhe', courses_id: '330', avg: "D"},
                {courses_dept: 'adhe', courses_id: '329', avg: "C"},
                {courses_dept: 'adhe', courses_id: '329', avg: "B"},
                {courses_dept: 'adhe', courses_id: '329', avg: "A"}
            ])
    });

    it("sortData should correctly sort data based on multiple keys 1", function () {
        let result: any = queryController.sortData(["keyA", "keyB", "keyC"],
            [{keyA: 'B', keyB: 10, keyC: 'A'},
                {keyA: 'A', keyB: 5, keyC: 'Z'},
                {keyA: 'C', keyB: 20, keyC: 'E'},
                {keyA: 'C', keyB: 10, keyC: 'A'},
                {keyA: 'B', keyB: 5, keyC: 'C'},
                {keyA: 'A', keyB: 5, keyC: 'A'},], 'UP');
        expect(result).to.deep.equal([
            {keyA: 'A', keyB: 5, keyC: 'A'},
            {keyA: 'A', keyB: 5, keyC: 'Z'},
            {keyA: 'B', keyB: 5, keyC: 'C'},
            {keyA: 'B', keyB: 10, keyC: 'A'},
            {keyA: 'C', keyB: 10, keyC: 'A'},
            {keyA: 'C', keyB: 20, keyC: 'E'},
        ])
    })

    it("sortData should correctly sort data based on multiple keys 2", function () {
        let result: any = queryController.sortData(["keyC", "keyA", "keyB"],
            [{keyA: 'B', keyB: 10, keyC: 'A'},
                {keyA: 'A', keyB: 5, keyC: 'Z'},
                {keyA: 'C', keyB: 20, keyC: 'E'},
                {keyA: 'C', keyB: 10, keyC: 'A'},
                {keyA: 'B', keyB: 5, keyC: 'C'},
                {keyA: 'A', keyB: 5, keyC: 'A'},], 'UP');
        expect(result).to.deep.equal([
            {keyA: 'A', keyB: 5, keyC: 'A'},
            {keyA: 'B', keyB: 10, keyC: 'A'},
            {keyA: 'C', keyB: 10, keyC: 'A'},
            {keyA: 'B', keyB: 5, keyC: 'C'},
            {keyA: 'C', keyB: 20, keyC: 'E'},
            {keyA: 'A', keyB: 5, keyC: 'Z'}])
    })

    it("sortData should correctly sort data based on multiple keys 3", function () {
        let result: any = queryController.sortData(["keyA", "keyB", "keyC"],
            [{keyA: 'B', keyB: 10, keyC: 'A'},
                {keyA: 'A', keyB: 5, keyC: 'Z'},
                {keyA: 'C', keyB: 20, keyC: 'E'},
                {keyA: 'C', keyB: 10, keyC: 'A'},
                {keyA: 'B', keyB: 5, keyC: 'C'},
                {keyA: 'A', keyB: 5, keyC: 'A'}], 'DOWN');
        expect(result).to.deep.equal([
            {keyA: 'C', keyB: 20, keyC: 'E'},
            {keyA: 'C', keyB: 10, keyC: 'A'},
            {keyA: 'B', keyB: 10, keyC: 'A'},
            {keyA: 'B', keyB: 5, keyC: 'C'},
            {keyA: 'A', keyB: 5, keyC: 'Z'},
            {keyA: 'A', keyB: 5, keyC: 'A'}])
    })

    it("sortData should correctly sort data based on multiple keys 4", function () {
        let result: any = queryController.sortData(["keyA", "keyB", "keyC"],
            [{keyA: 'B', keyB: 10, keyC: 'A'},
                {keyA: 'A', keyB: 5, keyC: 'Z'},
                {keyA: 'C', keyB: 20, keyC: 'E'},
                {keyA: 'C', keyB: 10, keyC: 'A'},
                {keyA: 'B', keyB: 5, keyC: 'C'},
                {keyA: 'B', keyB: 1, keyC: 'C'},
                {keyA: 'A', keyB: 5, keyC: 'A'},
                {keyA: 'C', keyB: 20, keyC: 'Z'}], 'UP');
        expect(result).to.deep.equal([
            {keyA: 'A', keyB: 5, keyC: 'A'},
            {keyA: 'A', keyB: 5, keyC: 'Z'},
            {keyA: 'B', keyB: 1, keyC: 'C'},
            {keyA: 'B', keyB: 5, keyC: 'C'},
            {keyA: 'B', keyB: 10, keyC: 'A'},
            {keyA: 'C', keyB: 10, keyC: 'A'},
            {keyA: 'C', keyB: 20, keyC: 'E'},
            {keyA: 'C', keyB: 20, keyC: 'Z'}])
    })

    it("sortData should correctly sort data based on multiple keys 5", function () {
        let result: any = queryController.sortData(["avg", "courses_id", "courses_dept"],
            [{Subject: 'adhe', Course: 'B', avg: 90.02},
                {Subject: 'cpsc', Course: 'A', avg: 90.02},
                {Subject: 'adhe', Course: 'E', avg: 96.11},
                {Subject: 'adhe', Course: 'P', avg: 92.54},
                {Subject: 'adhe', Course: 'F', avg: 90.82},
                {Subject: 'adhe', Course: 'E', avg: 96.11},
                {Subject: 'econ', Course: 'P', avg: 92.54}], 'UP');
        expect(result).to.deep.equal(
            [{Subject: 'cpsc', Course: 'A', avg: 90.02},
                {Subject: 'adhe', Course: 'B', avg: 90.02},
                {Subject: 'adhe', Course: 'F', avg: 90.82},
                {Subject: 'adhe', Course: 'P', avg: 92.54},
                {Subject: 'econ', Course: 'P', avg: 92.54},
                {Subject: 'adhe', Course: 'E', avg: 96.11},
                {Subject: 'adhe', Course: 'E', avg: 96.11}])
    });

    /**
     * queryController.ts helpers unit tests
     */

    it("parseGroup with different values on all keys should return all unique pairings", function () {
        let p1: any = ["rooms_furniture", "rooms_type"];
        let p2: any = [
            {'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 8},
            {'rooms_furniture': 'chair', 'rooms_type': 'medium', 'rooms_seats': 6},
            {'rooms_furniture': 'desk', 'rooms_type': 'small', 'rooms_seats': 3}]
        let groupedKeys: any = {};
        let result: any = queryController.parseGroup(p1, p2, groupedKeys)
        let ans = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8}],
            'chair,medium': [{rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6}],
            'desk,small': [{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3}]
        }
        expect(result).to.deep.eq(ans);
    });

    it("parseGroup with same values on second key but different on first should return all unique pairings", function () {
        let p1: any = ["rooms_furniture", "rooms_type"];
        let p2: any = [
            {'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 8},
            {'rooms_furniture': 'chair', 'rooms_type': 'large', 'rooms_seats': 6},
            {'rooms_furniture': 'desk', 'rooms_type': 'large', 'rooms_seats': 3}]
        let groupedKeys: any = {};
        let result: any = queryController.parseGroup(p1, p2, groupedKeys)
        let ans = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8}],
            'chair,large': [{rooms_furniture: 'chair', rooms_type: 'large', rooms_seats: 6}],
            'desk,large': [{rooms_furniture: 'desk', rooms_type: 'large', rooms_seats: 3}]
        }
        expect(result).to.deep.eq(ans);
    });

    it("parseGroup with same values on all keys should return a single key at the beginning", function () {
        let p1: any = ["rooms_furniture", "rooms_type"];
        let p2: any = [
            {'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 8},
            {'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 6},
            {'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 3}]
        let groupedKeys: any = {};
        let result: any = queryController.parseGroup(p1, p2, groupedKeys)
        let ans = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8},
                {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 6},
                {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 3}]
        }
        expect(result).to.deep.eq(ans);
    });

    it("parseGroup with same values on all keys should return a 2 keys at the beginning", function () {
        let p1: any = ["rooms_furniture", "rooms_type"];
        let p2: any = [
            {'rooms_furniture': 'table', 'rooms_type': 'small', 'rooms_seats': 8},
            {'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 6},
            {'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 3}]
        let groupedKeys: any = {};
        let result: any = queryController.parseGroup(p1, p2, groupedKeys)
        let ans = {
            'table,small': [{rooms_furniture: 'table', rooms_type: 'small', rooms_seats: 8}],
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 6},
                {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 3}]
        }
        expect(result).to.deep.eq(ans);
    });


    it("parseApply with single item per unique grouping, applying only MAX", function () {
        let p1: any = [{
            "maxSeats": {
                "MAX": "rooms_seats"
            }
        }]

        let groupedData: any = {
            'table,large': [{rooms_seats: 8}],
            'chair,medium': [{rooms_seats: 6}],
            'desk,small': [{rooms_seats: 3}]
        }
        let result: any = queryController.parseApply(p1, groupedData)
        let ans = [
            {"maxSeats": 8, 'rooms_seats': 8},
            {"maxSeats": 6, 'rooms_seats': 6},
            {"maxSeats": 3, 'rooms_seats': 3}]
        expect(result).to.deep.eq(ans);
    });


    it("parseApply with multiple items per unique grouping, applying only MIN", function () {
        let p1: any = [{
            "minSeats": {
                "MIN": "rooms_seats"
            }
        }]

        let groupedData: any = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 9}, {
                             rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 1},
                            {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8}],
            'chair,medium': [{
                 rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6},
                {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 10}],
            'desk,small': [{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3}]
        }
        let result: any = queryController.parseApply(p1, groupedData)
        let ans = [
            {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 9, minSeats: 1},
            {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6,minSeats: 6},
            {rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, minSeats: 3}
        ]
        expect(result).to.deep.eq(ans);
    });


    it("parseApply with multiple items per unique grouping, applying only AVG", function () {
        let p1: any = [{
            "avgSeats": {
                "AVG": "rooms_seats"}
        }]

        let groupedData: any = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8},{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10}],
            'chair,medium': [{rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6}],
            'desk,small': [{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3},{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3}]
        }
        let result: any = queryController.parseApply(p1, groupedData)
        let ans = [
            {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, avgSeats: 9},
            {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, avgSeats: 6},
            {rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, avgSeats: 3}
        ]
        expect(result).to.deep.eq(ans);
    });


    it("parseApply with multiple items per unique grouping, applying only COUNT", function () {
        let p1: any = [{
            "countSeats": {
                "COUNT": "rooms_seats"
            }
        }]

        let groupedData: any = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8},{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10}],
            'chair,medium': [{rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6}],
            'desk,small': [{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3},{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3}]
        }
        let result: any = queryController.parseApply(p1, groupedData)
        let ans = [
            {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, countSeats: 2},
            {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, countSeats: 1},
            {rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, countSeats: 1}]
        expect(result).to.deep.eq(ans);
    });

    it("parseApply with multiple items per unique grouping, applying only COUNT", function () {
        let p1: any = [{
            "countTypes": {
                "COUNT": "rooms_type"
            }
        }]

        let groupedData: any = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8},{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10}],
            'chair,medium': [{rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6}],
            'desk,small': [{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3},{rooms_furniture: 'desk', rooms_type: 'medium', rooms_seats: 3}]
        }
        let result: any = queryController.parseApply(p1, groupedData)
        let ans = [
            {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, countTypes: 1},
            {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, countTypes: 1},
            {rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, countTypes: 2}]
        expect(result).to.deep.eq(ans);
    });


    it("parseApply with multiple items per unique grouping, applying only SUM", function () {
        let p1: any = [{
            "sumSeats": {
                "SUM": "rooms_seats"
            }
        }]

        let groupedData: any = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8},{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10}],
            'chair,medium': [{rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6}],
            'desk,small': [{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3},{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3}]
        }
        let result: any = queryController.parseApply(p1, groupedData)
        let ans = [
            {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8,sumSeats: 18},
            {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, sumSeats: 6},
            {rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, sumSeats: 6}]
        expect(result).to.deep.eq(ans);
    });

    it("parseApply with multiple items per unique grouping, applying MIN and MAX", function () {
        let p1: any = [{
            "maxSeats": {
                "MAX": "rooms_seats"
            }
        },
            {
                "minSeats": {
                    "MIN": "rooms_seats"
                }
            }]

        let groupedData: any = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8},{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10}],
            'chair,medium': [{rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6}],
            'desk,small': [{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3},{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 4},{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 5}]
        }
        let result: any = queryController.parseApply(p1, groupedData)
        let ans = [
            {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8,maxSeats: 10, minSeats:8},
            {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, maxSeats: 6, minSeats:6},
            {rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, maxSeats: 5, minSeats:3}]
        expect(result).to.deep.eq(ans);
    });

    it("parseApply with 2 item in one unique grouping, applying COUNT AND AVG", function () {
        let p1: any = [{
            "countSeats": {
                "COUNT": "rooms_seats"
            }
        },
            {
                "avgSeats": {
                    "AVG": "rooms_seats"
                }
            }]

        let groupedData: any = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8},{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10}],
            'chair,medium': [{rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6}],
            'desk,small': [{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3},{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 4},{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 5}]
        }
        let result: any = queryController.parseApply(p1, groupedData)
        let ans = [
            {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8,countSeats: 2, avgSeats:9},
            {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, countSeats: 1, avgSeats:6},
            {rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, countSeats: 3, avgSeats:4}]
        expect(result).to.deep.eq(ans);
    });


    it("parseApply with 2 item in one unique grouping, applying COUNT, SUM AND AVG", function () {
        let p1: any = [{
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
            }]

        let groupedData: any = {
            'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8},{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10}],
            'chair,medium': [{rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6}],
            'desk,small': [{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3},{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 4},{rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 5}]
        }
        let result: any = queryController.parseApply(p1, groupedData)
        let ans = [
            {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8,countSeats: 2,sumSeats: 18, avgSeats:9},
            {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6,countSeats: 1, sumSeats: 6, avgSeats:6},
            {rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3,countSeats: 3, sumSeats: 12, avgSeats:4}]
        expect(result).to.deep.eq(ans);
    });


    // it("calculateMin", function () {
    //     let p1: any = {
    //         'table,small': [{rooms_furniture: 'table', rooms_type: 'small', rooms_seats: 4}],
    //         'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10},
    //             {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 3}]
    //     }
    //     let p2: any = 'rooms_seats' //keydata
    //     let p3: any = {'table,small': {}, 'table,large': {}}            //result accumulator
    //     let p4: any = 'minSeats'    //column name
    //     let result: any = queryController.calculateMin(p1, p2, p3, p4);
    //     let ans = {
    //         'table,small': {minSeats: 4},
    //         'table,large': {minSeats: 3}
    //     }
    //     expect(result).to.deep.eq(ans);
    // });
    //
    // it("calculateMax", function () {
    //     let p1: any = {
    //         'table,small': [{rooms_furniture: 'table', rooms_type: 'small', rooms_seats: 8}],
    //         'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10},
    //             {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 3},
    //             {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 20}]
    //     }
    //     let p2: any = 'rooms_seats' //keydata
    //     let p3: any = {'table,small': {}, 'table,large': {}}            //result accumulator
    //     let p4: any = 'maxSeats'    //column name
    //     let result: any = queryController.calculateMax(p1, p2, p3, p4);
    //     let ans = {
    //         'table,small': {maxSeats: 8},
    //         'table,large': {maxSeats: 20}
    //     }
    //     expect(result).to.deep.eq(ans);
    // });
    //
    // it("calculateAvg", function () {
    //     let p1: any = {
    //         'table,small': [{rooms_furniture: 'table', rooms_type: 'small', rooms_seats: 8}],
    //         'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10},
    //             {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 3},
    //             {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 25},
    //             {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 17}]
    //     }
    //     let p2: any = 'rooms_seats' //keydata
    //     let p3: any = {'table,small': {}, 'table,large': {}}            //result accumulator
    //     let p4: any = 'avgSeats'    //column name
    //     let result: any = queryController.calculateAvg(p1, p2, p3, p4);
    //     let ans = {
    //         'table,small': {avgSeats: 8},
    //         'table,large': {avgSeats: 13.75}
    //     }
    //     expect(result).to.deep.eq(ans);
    // });
    //
    //
    it("calculateCount", function () {
        let group:any = [{"keyA":"valA", "keyB":"val1"},{"keyA":"valA", "keyB":"val2"},{"keyA":"valA", "keyB":"val3"},{"keyA":"valA", "keyB":"val2"},{"keyA":"valA", "keyB":"val1"}];
        let result: any = queryController.calculateCount(group, "keyB", 'appKey');
        expect(result).to.deep.eq({"keyA":"valA", "keyB":"val1", "appKey": 3});
    });

    it("calculateCount", function () {
        let group:any = [{"keyA":"valA", "keyB":"val1"},{"keyA":"valA", "keyB":"val2"},{"keyA":"valA", "keyB":"val3"},{"keyA":"valA", "keyB":"val2"},{"keyA":"valA", "keyB":"val1"},{"keyA":"valA", "keyB":0}, {"keyA":"valA", "keyB":0}, {"keyA":"valA", "keyB":1}];
        let result: any = queryController.calculateCount(group, "keyB", 'appKey');
        expect(result).to.deep.eq({"keyA":"valA", "keyB":"val1", "appKey": 5});
    });

    //
    //
    // it("calculateSum", function () {
    //     let p1: any = {
    //         'table,small': [{rooms_furniture: 'table', rooms_type: 'small', rooms_seats: 8}],
    //         'table,large': [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 10},
    //             {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 3},
    //             {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 25},
    //             {rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 17}]
    //     }
    //     let p2: any = 'rooms_seats' //keydata
    //     let p3: any = {'table,small': {}, 'table,large': {}}            //result accumulator
    //     let p4: any = 'sumSeats'    //column name
    //     let result: any = queryController.calculateSum(p1, p2, p3, p4);
    //     let ans = {
    //         'table,small': {sumSeats: 8},
    //         'table,large': {sumSeats: 55}
    //     }
    //     expect(result).to.deep.eq(ans);
    // });

    let testingDataParseGroup: any = [
        {"keyA": "valA", "keyB": "valB", "keyC": "valC"},
        {"keyA": "valD", "keyB": "valB", "keyC": "valC"},
        {"keyA": "valE", "keyB": "valF", "keyC": "valD"},
        {"keyA": "valA", "keyB": "valF", "keyC": "valD"},
        {"keyA": "valD", "keyB": "valB", "keyC": "valD"},
        {"keyA": "valE", "keyB": "valD", "keyC": "valD"}
    ]

    it("should group items based on a single key", function () {
        let ans: any = {
            "valA": [{"keyA": "valA", "keyB": "valB", "keyC": "valC"}, {
                "keyA": "valA",
                "keyB": "valF",
                "keyC": "valD"
            }],
            "valD": [{"keyA": "valD", "keyB": "valB", "keyC": "valC"}, {
                "keyA": "valD",
                "keyB": "valB",
                "keyC": "valD"
            }],
            "valE": [{"keyA": "valE", "keyB": "valF", "keyC": "valD"}, {
                "keyA": "valE",
                "keyB": "valD",
                "keyC": "valD"
            }],
        }
        let result: any = queryController.parseGroup(['keyA'], testingDataParseGroup, {});
        expect(result).deep.eq(ans);
    });

    it("should group items based on multiple keys", function () {
        let ans: any = {
            "valB,valC": [{"keyA": "valA", "keyB": "valB", "keyC": "valC"}, {
                "keyA": "valD",
                "keyB": "valB",
                "keyC": "valC"
            }],
            "valF,valD": [{"keyA": "valE", "keyB": "valF", "keyC": "valD"}, {
                "keyA": "valA",
                "keyB": "valF",
                "keyC": "valD"
            }],
            "valB,valD": [{"keyA": "valD", "keyB": "valB", "keyC": "valD"}],
            "valD,valD": [{"keyA": "valE", "keyB": "valD", "keyC": "valD"}]
        }
        let result: any = queryController.parseGroup(['keyB', 'keyC'], testingDataParseGroup, {});
        expect(result).deep.eq(ans);

    });

    it("parseTransformations should return the correct format", function () {
        let p1: any = {
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
        }

        let p2: any =
            [{'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 8},
                {'rooms_furniture': 'chair', 'rooms_type': 'medium', 'rooms_seats': 6},
                {'rooms_furniture': 'table', 'rooms_type': 'large', 'rooms_seats': 10},
                {'rooms_furniture': 'desk', 'rooms_type': 'small', 'rooms_seats': 3}]
        let result: any = queryController.parseTransformations(p1, p2);
        let ans = [{rooms_furniture: 'table', rooms_type: 'large', rooms_seats: 8, countseats: 2, avgSeats: 9},
            {rooms_furniture: 'chair', rooms_type: 'medium', rooms_seats: 6, countseats: 1, avgSeats: 6},
            {rooms_furniture: 'desk', rooms_type: 'small', rooms_seats: 3, countseats: 1, avgSeats: 3}];
        expect(result).to.deep.eq(ans);
    });


    it("parseOptions sorting DOWN with one key in ORDER", function () {
        let queryOption: any = {
            "COLUMNS": [
                "rooms_type",
                "minSeats"
            ],
            "ORDER": {
                "dir": "DOWN",
                "keys": ["minSeats"]
            },
            "FORM": "TABLE"
        }

        let data: any =
            [{
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
                }]
        let result: any = queryController.parseOptions(queryOption, data);
        let ans = {
            render: 'TABLE',
            result: [{rooms_type: 'large', minSeats: 8},
                {rooms_type: 'medium', minSeats: 6},
                {rooms_type: 'small', minSeats: 3}]
        };
        expect(result).to.deep.eq(ans);
    });

    it("parseOptionsTrans sorting UP with multiple keys in ORDER", function () {
        let p1: any = {
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
        }

        let p2: any =
            [{
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
                }]
        let result: any = queryController.parseOptions(p1, p2);
        let ans = {
            render: 'TABLE',
            result: [{rooms_type: 'small', minSeats: 3, countseats: 1},
                {rooms_type: 'medium', minSeats: 6, countseats: 1},
                {rooms_type: 'medium', minSeats: 6, countseats: 2},
                {rooms_type: 'large', minSeats: 8, countseats: 1}]
        };
        expect(result).to.deep.eq(ans);
    });

    it("parseOptionsTrans sorting UP with multiple keys in ORDER", function () {
        let p1: any = {
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
        }

        let p2: any =
            [{
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
                }]
        let result: any = queryController.parseOptions(p1, p2);
        let ans = {
            render: 'TABLE',
            result: [{rooms_type: 'small', minSeats: 3, countseats: 1},
                {rooms_type: 'medium', minSeats: 6, countseats: 2},
                {rooms_type: 'medium', minSeats: 7, countseats: 1},
                {rooms_type: 'large', minSeats: 8, countseats: 1}]
        };
        expect(result).to.deep.eq(ans);
    });

});



