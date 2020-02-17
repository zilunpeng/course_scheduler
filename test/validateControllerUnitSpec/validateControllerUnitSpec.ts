import {expect} from "chai";
import Log from "../../src/Util";
import {QueryRequest} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import QueryController from "../../src/controller/QueryController";
import ValidateController from "../../src/controller/ValidateController"

describe('validateControllerUnitSpec',function(){
    var insightFacade = new InsightFacade();
    var queryController = new QueryController(); //instantiate validateController later
    var validateController = new ValidateController();

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

    it("query should throw error 400 if a query's OPTIONS contains both courses and rooms", function () {
        let query: QueryRequest = {
            "WHERE": {"IS": {"rooms_name": "DMP_*"}},
            "OPTIONS": {"COLUMNS": ["courses_year"], "ORDER": "courses_year", "FORM": "TABLE"}
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })

            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'query contains more than 1 dataset'}});
            });
    })

    it("query should throw error 400 if a query's WHERE contains both courses and rooms", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [
                    {"IS": {"rooms_name": "DMP_*"}},
                    {"IS": {"courses_dept": "cpsc"}}]},
            "OPTIONS": {"COLUMNS": ["rooms_name"], "FORM": "TABLE"}
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })

            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'query contains more than 1 dataset'}});

            });
    })

    it("query should throw error 400 with invalid room key in WHERE", function () {
        let query: QueryRequest = {
            "WHERE": {"IS": {"rooms_nope": "DMP*"}},
            "OPTIONS": {"COLUMNS": ["rooms_shortname"], "FORM": "TABLE"}
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'rooms_nope is not valid in dataset rooms'}});
            });
    })

    it("query should throw error 400 with invalid room key in options", function () {
        let query: QueryRequest = {
            "WHERE": {},
            "OPTIONS": {"COLUMNS": ["rooms_nope"], "FORM": "TABLE"}}
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result)
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'rooms_nope is not valid in dataset rooms'}});
            });
    })

    it("should return error if not given valid MCOMPARISON key", function () {
        let query: QueryRequest = {
            "WHERE": {"LT": {"courses_a": 99}},
            "OPTIONS": {"COLUMNS": ["courses_avg"], "FORM": "TABLE"}}
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'invalid MCOMPARISON. Require a number key'}});
            });
    });

    it("should return error if not given invalid FILTER", function () {
        let query: QueryRequest = {
            "WHERE": {"T": {"courses_avg": 99}},
            "OPTIONS": {
                "COLUMNS": ["courses_avg"], "FORM": "TABLE"}}
        return insightFacade.performQuery(query).then(function (result: any) {
            console.log(result);
            expect.fail();
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal({code: 400, body: {error: 'invalid filter'}});
            });
    });


    it("isApply should return TRUE given APPLY", function () {
        expect(validateController.isApply('APPLY')).to.be.true;
    });

    it("isApply should return FALSE given blablabla", function () {
        expect(validateController.isApply('blablabla')).to.be.false;
    });

    it("isColumns should return TRUE given COLUMNS", function () {
        expect(validateController.isColumns('COLUMNS')).to.be.true;
    });


    it("isOrder should return TRUE given ORDER", function () {
        expect(validateController.isOrder('ORDER')).to.be.true;
    });


    it("isForm should return TRUE given FORM", function () {
        expect(validateController.isForm('FORM')).to.be.true;
    });


    it("isGroup should return TRUE given GROUP", function () {
        expect(validateController.isGroup('GROUP')).to.be.true;
    });




    it('invalid logic comparison of 0 filters', function(){
        let query:any =  {
                "AND": []
            }

        try {
            validateController.getWhereKeys(query)
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid LOGICCOMPARISON. Must contain at least 1 FILTER');
        }
    })


    it('should return error if mcomparator (LT/EQ/GT) contains more than 1 parameter', function(){
        let query:any =  {
                "AND": [{
                    "LT": {
                        "courses_avg": 99,
                        "courses_pass": 20
                    }
                },
                    {"GT": {"courses_avg": 99}}]
            }
        try{
            validateController.getWhereKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid MCOMPARISON. Cannot contain more than 1 MCOMPARATOR');
            // Log.error(error);
            // console.log(error);
            // console.log(error.toString())
            // return error
        }
    })


    it('should return error if mcomparator compares nothing', function(){
        let query:any =  {
            "AND": [{
                "LT": {
                }
            },
                {"GT": {"courses_avg": 99}}]
        }
        try{
            validateController.getWhereKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid MCOMPARISON. Require a number key');

        }
    })


    it('should return error if mcomparator compares invalid key', function(){
        let query:any =  {
            "AND": [{
                "LT": { "coursesavg":0
                }
            },
                {"GT": {"courses_avg": 99}}]
        }
        try{
            validateController.getWhereKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid key.');

        }
    })


    it('should return error if IS contains more than 1 parameter', function(){
        let query:any =  {
            "AND": [{
                "IS": { "courses_title":"math", "courses_instructor":"somebody"
                }
            },
                {"GT": {"courses_avg": 99}}]
        }
        try{
            validateController.getWhereKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid SCOMPARISON. Cannot contain more than 1 IS');
        }
    })


    it('should return error if NOT contains more than 1 filter', function(){
        let query:any =  {
            "NOT": {
                "IS": {"courses_title":123} ,
                "GT": {"courses_avg": 99}
        }}

        try{
            validateController.getWhereKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid NEGATION. Cannot contain more than 1 FILTER');
        }
    })


    it('should return error filter not recognized', function(){
        let query:any =  {
            "DOTHIS": {
                "GT": {"courses_avg": 99}
            }}

        try{
            validateController.getWhereKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid filter');
        }
    })
    //
    // //change spec probably
    // it('should return error if APPLY is empty', function(){
    //     let query:any =  {"OPTIONS": {
    //         "COLUMNS": [
    //             "courses_id",
    //         ],
    //             "ORDER":{
    //             "dir":"DOWN",
    //                 "keys":["courses_id"]
    //         },
    //         "FORM": "TABLE"
    //     },
    //     "TRANSFORMATIONS": {
    //         "GROUP": ["courses_id"],
    //             "APPLY": []
    //     }}
    //
    //     try{
    //         validateController.getOptionTransKeys(query);
    //     }
    //
    //     catch(error){
    //         expect(error.toString()).to.equal('Error: invalid APPLY. Not containing objects');
    //     }
    // })


    it('should return error if more than one apply token given', function(){
        let query:any =  {"OPTIONS": {
            "COLUMNS": [
                "courses_id",
                "numProf"
            ],
            "ORDER":{
                "dir":"DOWN",
                "keys":["numProf", "courses_id"]
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
            }}

        try{
            validateController.getOptionTransKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid APPLYKEY. Must contain only 1 APPLYTOKEN');
        }
    })

    it('should return error filter not recognized', function(){
        let query:any =  {"OPTIONS": {
            "COLUMNS": [
                "courses_id",
                "numProf"
            ],
            "ORDER":{
                "dir":"DOWN",
                "keys":["numProf", "courses_id"]
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
                    {'sumPass': {
                            "SUM": "courses_pass"
                        }
                    }]
            }}

        try{
            validateController.getOptionTransKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid APPLYKEY. Must contain only 1 APPLYTOKEN');
        }
    })



    it('does this fail', function(){
        let query:any =  {"OPTIONS": {
            "COLUMNS": [
                "courses_id",
                "numProf"
            ],
            "ORDER":{
                "dir":"DOWN",
                "keys":["numProf", "courses_id"]
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
            }}

        try{
            validateController.getOptionTransKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid APPLYKEY. Must contain only 1 APPLYTOKEN');
        }
    })


    it('apply with duplicate same token should return error', function(){
        let query:any =  {"OPTIONS": {
            "COLUMNS": [
                "courses_id",
                "numProf"
            ],
            "ORDER":{
                "dir":"DOWN",
                "keys":["numProf", "courses_id"]
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
            }}

        try{
            validateController.getOptionTransKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid APPLY. Must not contain duplicate apply keys.');
        }
    })


    it('TRANSFORMATIONS with invalid keys should return error', function(){
        let query:any =  {"OPTIONS": {
            "COLUMNS": [
                "courses_id",
                "numProf"
            ],
            "ORDER":{
                "dir":"DOWN",
                "keys":["numProf", "courses_id"]
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
            }}

        try{
            validateController.getOptionTransKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid TRANSFORMATIONS');
        }
    })

    it('OPTIONS with invalid key', function(){
        let query:any =  {"OPTIONS": {
            "C": [
                "courses_id",
                "numProf"
            ],
            "O":{
                "dir":"DOWN",
                "keys":["numProf", "courses_id"]
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
            }}

        try{
            validateController.getOptionTransKeys(query);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid OPTIONS');
        }
    })

    it('checkArrUnderScore should throw error if one element doesnt have underscores', function(){
        try{
            validateController.checkArrUnderScore(['courses_id', 'courses_pass', 'courses']);
        }
        catch(error){
            expect(error.toString()).to.equal('Error: key in COLUMNS is not valid. Must contain an underscore');
        }
    })


    it('checkArrUnderScore should NOT throw error if all elements have underscores', function(){
        try{
            validateController.checkArrUnderScore(['courses_id', 'courses_pass', 'courses_fail']);
        }
        catch(error){
            expect.fail();
        }
    })


    it('checkStringUnderScore should throw error if one element doesnt have underscores', function(){
        try{
            validateController.checkStrUnderScore('courses');
        }
        catch(error){
            expect(error.toString()).to.equal('Error: courses is not valid. Must contain an underscore');
        }
    })


    it('checkStringUnderScore should NOT throw error if string has underscore', function(){
        try{
            validateController.checkStrUnderScore('courses_pass');
        }
        catch(error){
            expect.fail();
        }
    })


    // it('checkArray should throw error if non array in parameter', function(){
    //     try{
    //         validateController.checkArray({}, 'GROUP');
    //     }
    //     catch(error){
    //         expect(error.toString()).to.equal('Error: invalid GROUP. Must be an array');
    //     }
    // })


    it('checkArray should NOT throw error if array is given', function(){
        try{
            validateController.checkArray([], 'GROUP');
        }
        catch(error){
            expect.fail();
        }
    })

    it('checkNonEmptyArr should throw error if empty array given', function(){
        try{
            validateController.checkNonEmptyArr([], 'OPTIONS');
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid OPTIONS. Must specify at least 1 key');
        }
    })


    it('checkString should throw error if integer given', function(){
        try{
            validateController.checkString(3, 'GROUP');
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid GROUP. Must be a string');
        }
    })



    it('checkNoUnderScore should throw error if string with underscore given', function(){
        try{
            validateController.checkNoUnderScore('courses_pass', 'GROUP');
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid GROUP. Cannot contain underscore');
        }
    })

    it('checkUpDown should throw error if UP/DOWN not given', function(){
        try{
            validateController.checkUpDown('LEFT');
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid OPTIONS. dir must be UP or DOWN');
        }
    })


    it('checkTable should throw error if TABLE not given', function(){
        try{
            validateController.checkTable('LEFT');
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid FORM. Must be TABLE.');
        }
    })

    it('checkStringOrObj should throw error if array given', function(){
        try{
            validateController.checkStringOrObj([], 'GROUP');
        }
        catch(error){
            expect(error.toString()).to.equal('Error: invalid GROUP. Must be a string or object.');
        }
    })


    it('checkStringOrObj should NOT throw error if string given', function(){
        try{
            validateController.checkStringOrObj('courses_pass', 'GROUP');
        }
        catch(error){
            expect.fail()
        }
    })


    it('checkStringOrObj should NOT throw error if object given', function(){
        try{
            validateController.checkStringOrObj({}, 'GROUP');
        }
        catch(error){
            expect.fail()
        }
    })






})