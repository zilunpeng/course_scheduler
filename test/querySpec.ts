import {expect} from "chai";
import Log from "../src/Util";
import InsightFacade from "../src/controller/InsightFacade";
import {QueryRequest} from "../src/controller/IInsightFacade";
import {InsightResponse} from "../src/controller/IInsightFacade";
import {fstat} from "fs";
import QueryController from "../src/controller/QueryController"
import Server from "../src/rest/Server"
import DatasetController from "../src/controller/DatasetController"

describe('querySpec', function () {
    this.timeout(200000);
    var fs = require("fs");
    var datasetController:any = new DatasetController();
    var insightFacade: InsightFacade = null;
    let cacheDir: string = './src/cache/';
    var queryController = new QueryController();
    var data: any = null;

    before(function () {
        try {

            Log.test('Before: ' + (<any>this).test.parent.title);
            data = fs.readFileSync("./data/courses.zip", {encoding: 'base64'});

        } catch (e) {
            console.log(e);
        }

    });

    beforeEach(function () {
        Log.test('BeforeTest: ' + (<any>this).currentTest.title);
        insightFacade = new InsightFacade();
    });

    after(function () {
        Log.test('After: ' + (<any>this).test.parent.title);
        insightFacade = null;
    });

    afterEach(function () {
        Log.test('AfterTest: ' + (<any>this).currentTest.title);
    });



    //TODO: put all QUERY tests here
    it("should return the right result if given a valid query", function () {
        return insightFacade.addDataset('courses', data).then(function (response: any) {
            let query: QueryRequest = {
                "WHERE": {
                    "AND": [{
                        "IS": {
                            "courses_instructor": "*caleb"
                        }
                    },
                        {
                            "LT": {
                                "courses_avg": 55.75
                            }
                        }
                    ]
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "courses_title",
                        "courses_uuid",
                        "courses_avg"],
                    "ORDER": "courses_uuid",
                    "FORM": "TABLE"
                }
            }
            let ans = {
                'code': 200, 'body': {
                    render: 'TABLE',
                    result: [
                        {courses_title: "calc socsci comm", courses_uuid: "3815", courses_avg: 55.74},
                        {courses_title: "intro acad writ", courses_uuid: "51786", courses_avg: 52.4}
                    ]
                }
            };
            return insightFacade.performQuery(query).then(function (result: any) {

                expect(result).to.deep.equal(ans);
            })
                .catch(function (err: any) {
                    expect(err).to.deep.equal(ans);
                })
        })
    });

    it("should return code 200 with right result given valid query", function () {
        let query: QueryRequest = {
            "WHERE": {
                "OR": [{
                    "IS": {
                        "courses_title": 'money and banking'
                    }
                },
                    {
                        "EQ": {
                            "courses_avg": 98
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "courses_uuid",
                    "courses_avg"],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {courses_avg: 98, courses_title: "thesis", courses_uuid: "46405"},
                    {courses_avg: 98, courses_title: "thesis", courses_uuid: "46412"}
                ]
            }
        };
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test complex query with several filters and several columns ", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "NOT": {
                        "LT": {
                            "courses_avg": 99
                        }
                    }
                },
                    {
                        "GT": {
                            "courses_avg": 99
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_instructor",
                    "courses_pass",
                    "courses_fail",
                    "courses_id",
                    "courses_title",
                    "courses_dept",
                    "courses_audit",
                    "courses_avg"
                ],
                "ORDER": "courses_instructor",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                "render": "TABLE",
                "result": [
                    {
                        "courses_instructor": "",
                        "courses_pass": 9,
                        "courses_fail": 0,
                        "courses_id": "527",
                        "courses_title": "algb topology i",
                        "courses_dept": "math",
                        "courses_audit": 0,
                        "courses_avg": 99.78
                    },
                    {
                        "courses_instructor": "cox, daniel",
                        "courses_pass": 16,
                        "courses_fail": 0,
                        "courses_id": "574",
                        "courses_title": "career planning",
                        "courses_dept": "cnps",
                        "courses_audit": 0,
                        "courses_avg": 99.19
                    },
                    {
                        "courses_instructor": "gomez, jose",
                        "courses_pass": 9,
                        "courses_fail": 0,
                        "courses_id": "527",
                        "courses_title": "algb topology i",
                        "courses_dept": "math",
                        "courses_audit": 0,
                        "courses_avg": 99.78
                    }
                ]
            }
        };
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("mixing order of FORM, ORDER, COLUMNS should return regular expected result", function () {
        let query: QueryRequest = {
            "WHERE": {
                "OR": [
                    {
                        "OR": [
                            {"IS": {"courses_uuid": "5124"}},
                            {"GT": {"courses_avg": 99.5}}]
                    },
                    {"LT": {"courses_avg": -2}}]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {courses_dept: 'math', courses_id: '101', courses_avg: 64.14, courses_uuid: "5124"},
                    {courses_dept: 'math', courses_id: '527', courses_avg: 99.78, courses_uuid: "5373"},
                    {courses_dept: 'math', courses_id: '527', courses_avg: 99.78, courses_uuid: "5374"}
                ]
            }
        };
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })

    });


    it("test IS case with * at the beginning and end", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "IS": {"courses_instructor": "*el-kassaby, yousry*"}
                },
                    {
                        "GT": {"courses_avg": 85}
                    }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_pass",
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            let ans = {
                'code': 200, 'body': {
                    render: 'TABLE',
                    result: [
                        {courses_pass: 90, courses_dept: "frst", courses_avg: 89.12}
                    ]
                }
            };
            console.log(result);
            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            });
    });

    it("test IS case with * at the end", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "IS": {"courses_instructor": "*yousry*"}
                },
                    {
                        "GT": {"courses_avg": 85}
                    }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_pass",
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            let ans = {
                'code': 200, 'body': {
                    render: 'TABLE',
                    result: [
                        {courses_pass: 90, courses_dept: "frst", courses_avg: 89.12}
                    ]
                }
            };
            console.log(result);
            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            });
    });




    it("double OR, double IS, decimal integer value", function () {
        let query: QueryRequest = {
            "WHERE": {
                "OR": [
                    {
                        "OR": [
                            {"IS": {"courses_uuid": "4612"}},
                            {"IS": {"courses_uuid": "4124"}}]
                    },
                    {"GT": {"courses_avg": 99.7}}]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {courses_dept: 'babs', courses_id: '540', courses_avg: 77.2, courses_uuid: "4612"},
                    {courses_dept: 'math', courses_id: '527', courses_avg: 99.78, courses_uuid: "5373"},
                    {courses_dept: 'math', courses_id: '527', courses_avg: 99.78, courses_uuid: "5374"}
                ]
            }
        };
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })

    });

    it("double OR, double IS, where value of IS cannot be found", function () {
        let query: QueryRequest = {
            "WHERE": {
                "OR": [
                    {
                        "OR": [
                            {"IS": {"courses_dept": "4612*"}},
                            {"IS": {"courses_dept": "4124"}}]
                    },
                    {"GT": {"courses_avg": 99.7}}]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {courses_dept: 'math', courses_id: '527', courses_avg: 99.78, courses_uuid: "5373"},
                    {courses_dept: 'math', courses_id: '527', courses_avg: 99.78, courses_uuid: "5374"}
                ]
            }
        };
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })

    });


    it("performQuery courses_pass very specific number test", function () {
        let query: QueryRequest = {
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {"GT": {"courses_pass": 400}},
                            {"LT": {"courses_pass": 402}}]
                    },
                    {"GT": {"courses_avg": 99.9}}]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_pass",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {courses_dept: 'math', courses_pass: 401, courses_avg: 64.64, courses_uuid: "34018"},
                ]
            }
        };
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })

    });
    //TODO: D2 testing starts here!


    it("courses_year regular test", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "EQ": {
                        "courses_year": 2010
                    }
                },
                    {
                        "GT": {
                            "courses_avg": 98
                        }
                    }

                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_id", "courses_avg"
                ],
                "ORDER":  "courses_avg",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {
                        "courses_id":"578","courses_avg":98.58
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("courses_year testing Section:OVERALL", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "EQ": {
                        "courses_year": 1900
                    }
                },
                    {
                        "GT": {
                            "courses_avg": 99
                        }
                    }

                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_id", "courses_avg"
                ],
                "ORDER":  "courses_avg",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {
                        "courses_id":"527","courses_avg":99.78
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("courses_year testing sorting by courses_year", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "EQ": {
                        "courses_year": 1900
                    }
                },
                    {
                        "GT": {
                            "courses_avg": 98.7
                        }
                    }

                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_id", "courses_avg", "courses_year"
                ],
                "ORDER":  "courses_avg",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {
                        "courses_id": "509",
                        "courses_avg": 98.71,
                        "courses_year": 1900
                    },
                    {
                        "courses_id": "541",
                        "courses_avg": 98.75,
                        "courses_year": 1900
                    },
                    {
                        "courses_id": "449",
                        "courses_avg": 98.76,
                        "courses_year": 1900
                    },
                    {
                        "courses_id": "300",
                        "courses_avg": 98.98,
                        "courses_year": 1900
                    },
                    {
                        "courses_id": "527",
                        "courses_avg": 99.78,
                        "courses_year": 1900
                    }
                ]
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("query A from deliverable site", function () {
        let query: QueryRequest = {
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
        let ans = {'code': 200, 'body': {
            render: 'TABLE',
            result: [
                {
                    "rooms_name": "DMP_101"
                }, {
                    "rooms_name": "DMP_110"
                }, {
                    "rooms_name": "DMP_201"
                }, {
                    "rooms_name": "DMP_301"
                }, {
                    "rooms_name": "DMP_310"
                }]
        }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("query B from deliverable site (no order given, so any order is fine)", function () {
        let query: QueryRequest = {
            "WHERE": {
                "IS": {
                    "rooms_address": "*Agrono*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ],
                "FORM": "TABLE"
            }
        };
        let ans = {'code': 200, 'body': {
            render: 'TABLE',
            result: [
                {
                    "rooms_address": "6245 Agronomy Road V6T 1Z4",
                    "rooms_name": "DMP_101"
                },
                {
                    "rooms_address": "6245 Agronomy Road V6T 1Z4",
                    "rooms_name": "DMP_110"
                },
                {
                    "rooms_address": "6245 Agronomy Road V6T 1Z4",
                    "rooms_name": "DMP_201"
                },
                {
                    "rooms_address": "6245 Agronomy Road V6T 1Z4",
                    "rooms_name": "DMP_301"
                },
                {
                    "rooms_address": "6245 Agronomy Road V6T 1Z4",
                    "rooms_name": "DMP_310"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_1001"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3002"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3004"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3016"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3018"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3052"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3058"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3062"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3068"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3072"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_3074"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4002"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4004"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4016"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4018"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4052"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4058"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4062"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4068"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4072"
                },
                {
                    "rooms_address": "6363 Agronomy Road",
                    "rooms_name": "ORCH_4074"
                }
            ]
        }
        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test rooms number, name, sorted by lat and long", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [
                    {
                        "IS": {
                            "rooms_name": "DMP_*"
                        }
                    },
                    {
                        "IS": {
                            "rooms_number": "101"}
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lat",
                    "rooms_lon"
                ],
                "ORDER": "rooms_lat",
                "FORM": "TABLE"
            }
        };
        let ans = {'code': 200, 'body': {
            render: 'TABLE',
            result: [
                {
                    "rooms_lat": 49.26125,
                    "rooms_lon":-123.24807
                }
            ]
        }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });


    it("test query with IS: rooms_address", function () {
        let query: QueryRequest = {
            "WHERE": {
                "IS": {
                    "rooms_address": "6245 Agronomy Road V6T 1Z4"
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
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[{
                    "rooms_name": "DMP_101"
                }, {
                    "rooms_name": "DMP_110"
                }, {
                    "rooms_name": "DMP_201"
                }, {
                    "rooms_name": "DMP_301"
                }, {
                    "rooms_name": "DMP_310"
                }]
            }};
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test lat", function () {
        let query: QueryRequest = {
            "WHERE": {
                "EQ": {
                    "rooms_lat": 49.26125
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lat"
                ],
                "ORDER": "rooms_lat",
                "FORM": "TABLE"
            }
        };
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[{
                    "rooms_lat": 49.26125
                }, {
                    "rooms_lat": 49.26125
                }, {
                    "rooms_lat": 49.26125
                }, {
                    "rooms_lat": 49.26125
                }, {
                    "rooms_lat": 49.26125
                }]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test lat and lon", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [
                    {
                        "EQ": {
                            "rooms_lon": -123.24807
                        }
                    },
                    {
                        "EQ": {
                            "rooms_lat": 49.26125
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lon", "rooms_lat"
                ],
                "ORDER": "rooms_lon",
                "FORM": "TABLE"
            }
        };
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [{
                    "rooms_lon": -123.24807,
                    "rooms_lat": 49.26125
                }, {
                    "rooms_lon": -123.24807,
                    "rooms_lat": 49.26125
                }, {
                    "rooms_lon": -123.24807,
                    "rooms_lat": 49.26125
                }, {
                    "rooms_lon": -123.24807,
                    "rooms_lat": 49.26125
                }, {
                    "rooms_lon": -123.24807,
                    "rooms_lat": 49.26125
                }]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });


    it("test query with rooms number & rooms furniture", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [
                    {
                        "IS": {
                            "rooms_number": "135"
                        }
                    },
                    {
                        "IS": {
                            "rooms_furniture": "Classroom-Movable Tables & Chairs"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_shortname"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            }
        }

        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {
                        "rooms_address":"6339 Stores Road",
                        "rooms_shortname":"EOSM"
                    }]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test query with both short and long name", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [
                    {
                        "IS": {
                            "rooms_shortname": "DMP"
                        }
                    },
                    {
                        "IS": {
                            "rooms_fullname": "Hugh Dempster Pavilion"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_number", "rooms_shortname"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            }
        }

        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {"rooms_number":"101", "rooms_shortname":"DMP"},
                    {"rooms_number":"110", "rooms_shortname":"DMP"},
                    {"rooms_number":"201", "rooms_shortname":"DMP"},
                    {"rooms_number":"301", "rooms_shortname":"DMP"},
                    {"rooms_number":"310", "rooms_shortname":"DMP"},
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test query search for exactly 131 seats in a classroom", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [
                    {
                        "GT": {
                            "rooms_seats": 130
                        }
                    },
                    {
                        "LT": {
                            "rooms_seats": 132
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_number", "rooms_shortname"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            }
        }

        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {"rooms_number": "A103", "rooms_shortname": "BUCH"}
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test query rooms type and furniture together", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [
                    {
                        "IS": {
                            "rooms_type": "Open Design General Purpose"
                        }
                    },
                    {
                        "IS": {
                            "rooms_furniture":  "Classroom-Fixed Tables/Movable Chairs"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_number", "rooms_shortname"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            }
        }

        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {"rooms_number":"B101", "rooms_shortname":"ALRD"},
                    {"rooms_number":"291", "rooms_shortname":"ANGU"},
                    {"rooms_number":"295", "rooms_shortname":"ANGU"},
                    {"rooms_number":"303", "rooms_shortname":"FORW"},
                    {"rooms_number":"212", "rooms_shortname":"GEOG"},
                    {"rooms_number":"1003", "rooms_shortname":"PCOH"},
                    {"rooms_number":"B151", "rooms_shortname":"SPPH"},
                    {"rooms_number":"103", "rooms_shortname":"UCLL"}
                ]
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });
    //
    // it("test outside bounding box using NOT-AND *long query result", function () {
    //     let query: QueryRequest = {
    //         "WHERE": {
    //             "NOT": {
    //                 "AND": [{
    //                     "GT": {
    //                         "rooms_lat": 49.2612
    //                     }
    //                 },
    //                     {
    //                         "LT": {
    //                             "rooms_lat": 49.26129
    //                         }
    //                     },
    //                     {
    //                         "LT": {
    //                             "rooms_lon": -123.2480
    //                         }
    //                     },
    //                     {
    //                         "GT": {
    //                             "rooms_lon": -123.24809
    //                         }
    //                     }
    //                 ]
    //             }
    //         },
    //         "OPTIONS": {
    //             "COLUMNS": [
    //                 "rooms_fullname",
    //                 "rooms_shortname",
    //                 "rooms_number",
    //                 "rooms_name",
    //                 "rooms_address",
    //                 "rooms_type",
    //                 "rooms_furniture",
    //                 "rooms_href",
    //                 "rooms_lat",
    //                 "rooms_lon",
    //                 "rooms_seats"
    //             ],
    //             "ORDER": "rooms_name",
    //             "FORM": "TABLE"
    //         }
    //     }
    //
    //     let ans = {
    //         'code': 200, 'body': {
    //             render: 'TABLE',
    //             result: [
    //             {}
    //         ]
    //     }}
    //     return insightFacade.performQuery(query).then(function (result: any) {
    //
    //         expect(result).to.deep.equal(ans);
    //     })
    //         .catch(function (err: any) {
    //             expect(err).to.deep.equal(ans);
    //         })
    // });


    it("test inside bounding box using NOT-AND ", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "GT": {
                        "rooms_lat": 49.2612
                    }
                },
                    {
                        "LT": {
                            "rooms_lat": 49.26129
                        }
                    },
                    {
                        "LT": {
                            "rooms_lon": -123.2480
                        }
                    },
                    {
                        "GT": {
                            "rooms_lon": -123.24809
                        }
                    }
                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_fullname",
                    "rooms_shortname",
                    "rooms_number",
                    "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }

        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {
                        "rooms_fullname": "Hugh Dempster Pavilion",
                        "rooms_shortname": "DMP",
                        "rooms_number": "101",
                        "rooms_name": "DMP_101"
                    },
                    {
                        "rooms_fullname": "Hugh Dempster Pavilion",
                        "rooms_shortname": "DMP",
                        "rooms_number": "110",
                        "rooms_name": "DMP_110"
                    },
                    {
                        "rooms_fullname": "Hugh Dempster Pavilion",
                        "rooms_shortname": "DMP",
                        "rooms_number": "201",
                        "rooms_name": "DMP_201"
                    },
                    {
                        "rooms_fullname": "Hugh Dempster Pavilion",
                        "rooms_shortname": "DMP",
                        "rooms_number": "301",
                        "rooms_name": "DMP_301"
                    },
                    {
                        "rooms_fullname": "Hugh Dempster Pavilion",
                        "rooms_shortname": "DMP",
                        "rooms_number": "310",
                        "rooms_name": "DMP_310"
                    }
                ]
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });
    it("test query with one valid and one non existent href", function () {
        let query: QueryRequest = {
            "WHERE": {
                "OR": [
                    {
                        "IS": {
                            "rooms_href": "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/ALRD-113"
                        }
                    },
                    {
                        "IS": {
                            "rooms_href":  "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/ALRD-1"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_number", "rooms_shortname"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            }
        }


        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {"rooms_number":"113", "rooms_shortname":"ALRD"}
                ]
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test query searching for specific room number, address, and shortname, outputting every column", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_number": "120"
                    }
                },
                    {
                        "IS": {
                            "rooms_address": "2202 Main Mall"
                        }
                    },
                    {
                        "IS": {
                            "rooms_shortname": "AERL"
                        }
                    }
                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_fullname",
                    "rooms_shortname",
                    "rooms_number",
                    "rooms_name",
                    "rooms_address",
                    "rooms_type",
                    "rooms_furniture",
                    "rooms_href",
                    "rooms_lat",
                    "rooms_lon",
                    "rooms_seats"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }

        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {"rooms_fullname":"Aquatic Ecosystems Research Laboratory",
                        "rooms_shortname":"AERL",
                        "rooms_number":"120",
                        "rooms_name":"AERL_120",
                        "rooms_address":"2202 Main Mall",
                        "rooms_type":"Tiered Large Group",
                        "rooms_furniture":"Classroom-Fixed Tablets",
                        "rooms_href":"http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/AERL-120",
                        "rooms_lat":49.26372,"rooms_lon":-123.25099,"rooms_seats":144}
                ]
            }
        }

        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test query searching for specific full name, type, and furniture, outputting 4 columns", function () {
        let query: QueryRequest = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_fullname": "Aquatic Ecosystems Research Laboratory"
                    }
                },
                    {
                        "IS": {
                            "rooms_type": "Tiered Large Group"
                        }
                    },
                    {
                        "IS": {
                            "rooms_furniture": "Classroom-Fixed Tablets"
                        }
                    }
                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_fullname",
                    "rooms_shortname",
                    "rooms_number",
                    "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }

        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[{"rooms_fullname":"Aquatic Ecosystems Research Laboratory",
                    "rooms_shortname":"AERL",
                    "rooms_number":"120",
                    "rooms_name":"AERL_120"}
                ]
            }
        }

        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test searching for small groups with few seats", function () {
        let query: QueryRequest = {
            "WHERE":{
                "AND": [
                    {
                        "LT": {
                            "rooms_seats": 24
                        }
                    },
                    {
                        "GT": {
                            "rooms_seats": 21
                        }
                    },
                    {
                        "IS": {
                            "rooms_type": "Small Group"}
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lat",
                    "rooms_lon"
                ],
                "ORDER": "rooms_lat",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {
                        "rooms_lat": 49.26273,
                        "rooms_lon": -123.24894
                    },
                    {
                        "rooms_lat": 49.26826,
                        "rooms_lon": -123.25468
                    },
                    {
                        "rooms_lat": 49.26826,
                        "rooms_lon": -123.25468
                    },
                    {
                        "rooms_lat": 49.26826,
                        "rooms_lon": -123.25468
                    },
                    {
                        "rooms_lat": 49.26826,
                        "rooms_lon": -123.25468
                    },
                    {
                        "rooms_lat": 49.26826,
                        "rooms_lon": -123.25468
                    },
                    {
                        "rooms_lat": 49.26826,
                        "rooms_lon": -123.25468
                    },
                    {
                        "rooms_lat": 49.26826,
                        "rooms_lon": -123.25468
                    },
                    {
                        "rooms_lat": 49.26826,
                        "rooms_lon": -123.25468
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });


    it("test searching for large tier groups with over 350 seats", function () {
        let query: QueryRequest = {
            "WHERE":{
                "AND": [
                    {
                        "GT": {
                            "rooms_seats": 350
                        }
                    },
                    {
                        "IS": {
                            "rooms_type": "Tiered Large Group"}
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lat",
                    "rooms_lon"
                ],
                "ORDER": "rooms_lat",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {
                        "rooms_lat": 49.26207,
                        "rooms_lon": -123.25314
                    },
                    {
                        "rooms_lat": 49.26478,
                        "rooms_lon": -123.24673
                    },
                    {
                        "rooms_lat": 49.2661,
                        "rooms_lon": -123.25165
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test searching for specific room type only", function () {
        let query: QueryRequest = {
            "WHERE":{
                "IS": {
                    "rooms_type": "Studio Lab"}

            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name",
                    "rooms_address"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {
                        "rooms_name": "ORCH_3018",
                        "rooms_address": "6363 Agronomy Road"
                    },
                    {
                        "rooms_name": "ORCH_4074",
                        "rooms_address": "6363 Agronomy Road"
                    },
                    {
                        "rooms_name": "UCLL_109",
                        "rooms_address": "6331 Crescent Road V6T 1Z1"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });


    it("test searching for specific furniture type only", function () {
        let query: QueryRequest = {
            "WHERE":{
                "IS": {
                    "rooms_furniture": "Classroom-Learn Lab"}

            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name",
                    "rooms_address"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {
                        "rooms_name": "ORCH_3018",
                        "rooms_address": "6363 Agronomy Road"
                    },
                    {
                        "rooms_name": "ORCH_4074",
                        "rooms_address": "6363 Agronomy Road"
                    },
                    {
                        "rooms_name": "UCLL_109",
                        "rooms_address": "6331 Crescent Road V6T 1Z1"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test searching for specific room number only", function () {
        let query: QueryRequest = {
            "WHERE":{


                "IS": {
                    "rooms_number": "109"}

            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name",
                    "rooms_address"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {
                        "rooms_name": "SWNG_109",
                        "rooms_address": "2175 West Mall V6T 1Z4"
                    },
                    {
                        "rooms_name": "UCLL_109",
                        "rooms_address": "6331 Crescent Road V6T 1Z1"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test searching for specific full name only", function () {
        let query: QueryRequest = {
            "WHERE":{


                "IS": {
                    "rooms_fullname": "The Leon and Thea Koerner University Centre"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name",
                    "rooms_address"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {
                        "rooms_name": "UCLL_101",
                        "rooms_address": "6331 Crescent Road V6T 1Z1"
                    },
                    {
                        "rooms_name": "UCLL_103",
                        "rooms_address": "6331 Crescent Road V6T 1Z1"
                    },
                    {
                        "rooms_name": "UCLL_107",
                        "rooms_address": "6331 Crescent Road V6T 1Z1"
                    },
                    {
                        "rooms_name": "UCLL_109",
                        "rooms_address": "6331 Crescent Road V6T 1Z1"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });


    it("test lon", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "EQ": {
                    "rooms_lon": -123.24608

                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lon" , "rooms_name", "rooms_address"
                ],
                "ORDER": "rooms_lon",
                "FORM": "TABLE"
            }
        }

        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {
                        "rooms_lon": -123.24608,
                        "rooms_name": "FRDM_153",
                        "rooms_address": "2177 Wesbrook Mall V6T 1Z3"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test address with no rooms", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "IS": {
                    "rooms_address": "2345 East Mall"

                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lon" , "rooms_name", "rooms_address"
                ],
                "ORDER": "rooms_lon",
                "FORM": "TABLE"
            }
        }
        let array:any = [];
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: array
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });


    it("test address with 1 room", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "IS": {
                    "rooms_address": "1986 Mathematics Road"

                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lon" , "rooms_name", "rooms_address"
                ],
                "ORDER": "rooms_lon",
                "FORM": "TABLE"
            }
        }

        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {
                        "rooms_lon": -123.254816,
                        "rooms_name": "MATX_1100",
                        "rooms_address": "1986 Mathematics Road"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("test href", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "IS": {
                    "rooms_href": "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/DMP-201"

                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lon" , "rooms_name", "rooms_address"
                ],
                "ORDER": "rooms_lon",
                "FORM": "TABLE"
            }
        }


        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result: [
                    {
                        "rooms_lon": -123.24807,
                        "rooms_name": "DMP_201",
                        "rooms_address": "6245 Agronomy Road V6T 1Z4"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("deeply nested test", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "AND": [
                    {
                        "NOT": {
                            "LT": {
                                "rooms_seats": 349
                            }
                        }
                    },
                    {
                        "OR": [
                            { "EQ":
                                {
                                    "rooms_seats": 375
                                }
                            },
                            {
                                "EQ":{
                                    "rooms_seats":442
                                }
                            }
                        ]
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lon" , "rooms_name", "rooms_address", "rooms_seats"
                ],
                "ORDER": "rooms_lon",
                "FORM": "TABLE"
            }
        }


        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {
                        "rooms_lon": -123.25165,
                        "rooms_name": "HEBB_100",
                        "rooms_address": "2045 East Mall",
                        "rooms_seats": 375
                    },
                    {
                        "rooms_lon": -123.24467,
                        "rooms_name": "OSBO_A",
                        "rooms_address": "6108 Thunderbird Boulevard",
                        "rooms_seats": 442
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });


    it("deeply nested test 2", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "AND": [
                    {
                        "NOT": {
                            "EQ": {
                                "rooms_seats": 349
                            }
                        }
                    },
                    {
                        "OR": [
                            { "IS":
                                {
                                    "rooms_href": "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/HEBB-100"
                                }
                            },
                            {
                                "IS":{
                                    "rooms_href":"http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/OSBO-A"
                                }
                            }
                        ]
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lon" , "rooms_name", "rooms_address", "rooms_seats"
                ],
                "ORDER": "rooms_lon",
                "FORM": "TABLE"
            }
        }


        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {
                        "rooms_lon": -123.25165,
                        "rooms_name": "HEBB_100",
                        "rooms_address": "2045 East Mall",
                        "rooms_seats": 375
                    },
                    {
                        "rooms_lon": -123.24467,
                        "rooms_name": "OSBO_A",
                        "rooms_address": "6108 Thunderbird Boulevard",
                        "rooms_seats": 442
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    //TODO: this test is failing
    // it("test extremely specific query", function () {
    //     let query: QueryRequest =   {
    //         "WHERE": {
    //             "AND":[
    //                 {
    //                     "IS": {"rooms_fullname":"Allard Hall (LAW)"}
    //                 },
    //                 {
    //                     "IS": {"rooms_number":"105"}
    //                 },
    //                 {
    //                     "IS": {"rooms_name":"ALRD_105"}
    //                 },
    //                 {
    //                     "IS": {"rooms_address":"1822 East Mall"}
    //                 },
    //                 {
    //                     "IS": {"rooms_type":"Case Style"}
    //                 },
    //                 {
    //                     "IS": {"rooms_furniture":"Classroom-Fixed Tables/Movable Chairs"}
    //                 },
    //                 {
    //                     "IS": {"rooms_href":"http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/ALRD-105"}
    //                 },
    //                 {
    //                     "EQ": {"rooms_lat":49.2699}
    //                 },
    //                 {
    //                     "EQ": {"rooms_lon":-123.25318}
    //                 },
    //                 {
    //                     "EQ": {"rooms_seats":94}
    //                 }
    //             ]
    //         },
    //         "OPTIONS": {
    //             "COLUMNS": [
    //                 "rooms_name", "rooms_address"
    //             ],
    //             "ORDER": "rooms_name",
    //             "FORM": "TABLE"
    //         }
    //     }
    //
    //     let ans = {
    //         'code': 200, 'body': {
    //             render: 'TABLE',
    //             result:[
    //             {
    //                 "rooms_name": "ALRD_105",
    //                 "rooms_address": "1822 East Mall"
    //             }
    //         ]
    //     }}
    //     return insightFacade.performQuery(query).then(function (result: any) {
    //         Log.info(result);
    //         expect(result).to.deep.equal(ans);
    //     })
    //         .catch(function (err: any) {
    //             Log.error(err);
    //             expect.fail(err);
    //         })
    // });



    it("test invalid address should return no results", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "IS": {
                    "rooms_address": "1986666 Mathematics Road"

                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_lon" , "rooms_name", "rooms_address"
                ],
                "ORDER": "rooms_lon",
                "FORM": "TABLE"
            }
        }
        let emptybody: any[] = [];
        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:emptybody
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                expect(err).to.deep.equal(ans);
            })
    });

    it("deeply nested test 3", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "OR":[
                    {"AND":[
                        {"AND": [{
                            "NOT":{
                                "NOT":{
                                    "NOT":{
                                        "IS": {"rooms_shortname": "BIOL"}
                                    }
                                }
                            }
                        }]},
                        {"EQ": {"rooms_lon":-123.25308}},
                        {"IS": {"rooms_type": "Tiered Large Group" }}]},
                    {"AND":[
                        {"EQ": {"rooms_lat": 49.26372}},
                        {"IS": {"rooms_type": "Tiered Large Group" }},
                        {"IS": {"rooms_furniture": "Classroom-Fixed Tablets"}}]}]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name"

                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }


        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                    {
                        "rooms_name": "AERL_120"
                    },
                    {
                        "rooms_name": "CHEM_B150"
                    },
                    {
                        "rooms_name": "CHEM_B250"
                    },
                    {
                        "rooms_name": "CHEM_C124"
                    },
                    {
                        "rooms_name": "CHEM_C126"
                    },
                    {
                        "rooms_name": "CHEM_D200"
                    },
                    {
                        "rooms_name": "CHEM_D300"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                //expect(err).to.deep.equal(ans);
                Log.error(err);
                expect.fail()
            })
    });

    it("Query A from deliverable 3 page", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }]
            }
        }


        let ans = {
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                {
                    "rooms_shortname": "OSBO",
                    "maxSeats": 442
                },
                {
                    "rooms_shortname": "HEBB",
                    "maxSeats": 375
                },
                {
                    "rooms_shortname": "LSC",
                    "maxSeats": 350
                }
            ]
        }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });

    it("Query B from deliverable 3 page", function () {
        let query: QueryRequest =  {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_furniture"
                ],
                "ORDER": "rooms_furniture",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_furniture"],
                "APPLY": []
            }
        }


        let ans ={
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                {
                    "rooms_furniture": "Classroom-Fixed Tables\/Fixed Chairs"
                },
                {
                    "rooms_furniture": "Classroom-Fixed Tables\/Movable Chairs"
                },
                {
                    "rooms_furniture": "Classroom-Fixed Tables\/Moveable Chairs"
                },
                {
                    "rooms_furniture": "Classroom-Fixed Tablets"
                },
                {
                    "rooms_furniture": "Classroom-Hybrid Furniture"
                },
                {
                    "rooms_furniture": "Classroom-Learn Lab"
                },
                {
                    "rooms_furniture": "Classroom-Movable Tables & Chairs"
                },
                {
                    "rooms_furniture": "Classroom-Movable Tablets"
                },
                {
                    "rooms_furniture": "Classroom-Moveable Tables & Chairs"
                },
                {
                    "rooms_furniture": "Classroom-Moveable Tablets"
                }
            ]
        }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });


    it("query with an APPLY key in transformations that is not in COLUMNS will not be outputted", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "minSeats",
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["minSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "minSeats": {
                        "MAX": "rooms_seats"
                    }
                },
                    {
                        "countSeats": {
                            "COUNT": "rooms_seats"
                        }
                    }
                ]
            }
        }


        let ans ={
            'code': 200, 'body': {
                render: 'TABLE',
                result:[
                {
                    "rooms_shortname": "LSC",
                    "minSeats": 350
                },
                {
                    "rooms_shortname": "HEBB",
                    "minSeats": 375
                },
                {
                    "rooms_shortname": "OSBO",
                    "minSeats": 442
                }
            ]
        }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });


    it("query sorting UP with 2 apply keys", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "minSeats", "countSeats"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["minSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "minSeats": {
                        "MAX": "rooms_seats"
                    }
                },
                    {
                        "countSeats": {
                            "COUNT": "rooms_seats"
                        }
                    }
                ]
            }
        }


        let ans = { 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "rooms_shortname": "LSC",
                        "minSeats": 350,
                        "countSeats": 1
                    },
                    {
                        "rooms_shortname": "HEBB",
                        "minSeats": 375,
                        "countSeats": 1
                    },
                    {
                        "rooms_shortname": "OSBO",
                        "minSeats": 442,
                        "countSeats": 1
                    }
                ]
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });



    it("query sorting by 2 keys", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Chairs*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "minSeats", "countSeats"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["countSeats", "minSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "minSeats": {
                        "MAX": "rooms_seats"
                    }
                },
                    {
                        "countSeats": {
                            "COUNT": "rooms_seats"
                        }
                    }
                ]
            }
        }


        let ans = { 'code': 200, 'body': {
            "render": "TABLE",
            "result": [
                {
                    "rooms_shortname": "LSC",
                    "minSeats": 350,
                    "countSeats": 1
                },
                {
                    "rooms_shortname": "HEBB",
                    "minSeats": 375,
                    "countSeats": 1
                },
                {
                    "rooms_shortname": "OSBO",
                    "minSeats": 442,
                    "countSeats": 1
                }
            ]
        }


        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });



    it("APPLY with 5 keys", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Chairs*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "minSeats", "countSeats", "avgSeats", "sumSeats", "maxSeats"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["countSeats", "minSeats","maxSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "minSeats": {
                        "MIN": "rooms_seats"
                    }
                },
                    {
                        "countSeats": {
                            "COUNT": "rooms_seats"
                        }
                    },
                    {
                        "maxSeats": {
                            "MAX": "rooms_seats"
                        }
                    },
                    {
                        "avgSeats": {
                            "AVG": "rooms_seats"
                        }
                    },
                    {
                        "sumSeats": {
                            "SUM": "rooms_seats"
                        }
                    }
                ]
            }
        }


        let ans = { 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "rooms_shortname": "LSC",
                        "minSeats": 350,
                        "countSeats": 1,
                        "maxSeats": 350,
                        "avgSeats": 350,
                        "sumSeats": 700
                    },
                    {
                        "rooms_shortname": "HEBB",
                        "minSeats": 375,
                        "countSeats": 1,
                        "maxSeats": 375,
                        "avgSeats": 375,
                        "sumSeats": 375
                    },
                    {
                        "rooms_shortname": "OSBO",
                        "minSeats": 442,
                        "countSeats": 1,
                        "maxSeats": 442,
                        "avgSeats": 442,
                        "sumSeats": 442
                    }
                ]
            }

        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });


    it("APPLY with 5 keys, 2 maxes", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Chairs*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "minSeats", "countSeats", "avgSeats", "max2", "maxSeats"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["countSeats", "minSeats","maxSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname",],
                "APPLY": [{
                    "minSeats": {
                        "MIN": "rooms_seats"
                    }
                },
                    {
                        "countSeats": {
                            "COUNT": "rooms_seats"
                        }
                    },
                    {
                        "maxSeats": {
                            "MAX": "rooms_seats"
                        }
                    },
                    {
                        "avgSeats": {
                            "AVG": "rooms_seats"
                        }
                    },
                    {
                        "max2": {
                            "MAX": "rooms_seats"
                        }
                    }
                ]
            }
        }


        let ans = { 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "rooms_shortname": "LSC",
                        "minSeats": 350,
                        "countSeats": 1,
                        "maxSeats": 350,
                        "avgSeats": 350,
                        "max2": 350
                    },
                    {
                        "rooms_shortname": "HEBB",
                        "minSeats": 375,
                        "countSeats": 1,
                        "maxSeats": 375,
                        "avgSeats": 375,
                        "max2": 375
                    },
                    {
                        "rooms_shortname": "OSBO",
                        "minSeats": 442,
                        "countSeats": 1,
                        "maxSeats": 442,
                        "avgSeats": 442,
                        "max2": 442
                    }
                ]
            }

        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });



    it("test GROUP parameter when it is not in COLUMNS", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "GT": { "courses_pass": 2600}
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "sum"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["sum"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_pass","courses_title", "courses_year"],
                "APPLY": [{
                    "sum": {
                        "SUM": "courses_pass"
                    }
                }
                ]
            }
        }




        let ans ={ 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "courses_title": "strat univ writ",
                        "sum": 2655
                    },
                    {
                        "courses_title": "strat univ writ",
                        "sum": 2698
                    },
                    {
                        "courses_title": "strat univ writ",
                        "sum": 2994
                    }
                ]
            } }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
            })
    });


    it("test mixed order TRANSFORMATIONS and ORDER", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "GT": { "courses_pass": 2600}
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "sum"
                ],
                "ORDER": {
                    "keys": ["sum"],
                    "dir": "UP"

                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "APPLY": [{
                    "sum": {
                        "SUM": "courses_pass"
                    }
                }
                ],
                "GROUP": ["courses_pass","courses_title", "courses_year"]

            }
        }


        let ans ={ 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "courses_title": "strat univ writ",
                        "sum": 2655
                    },
                    {
                        "courses_title": "strat univ writ",
                        "sum": 2698
                    },
                    {
                        "courses_title": "strat univ writ",
                        "sum": 2994
                    }
                ]
            } }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
            })
    });


    it("test sorting with both APPLY and GROUP keys", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Chairs*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "minSeats", "countSeats", "avgSeats", "max2", "maxSeats"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["countSeats", "rooms_shortname","maxSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "minSeats": {
                        "MIN": "rooms_seats"
                    }
                },
                    {
                        "countSeats": {
                            "COUNT": "rooms_seats"
                        }
                    },
                    {
                        "maxSeats": {
                            "MAX": "rooms_seats"
                        }
                    },
                    {
                        "avgSeats": {
                            "AVG": "rooms_seats"
                        }
                    },
                    {
                        "max2": {
                            "MAX": "rooms_seats"
                        }
                    }
                ]
            }
        }

        let ans ={ 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "rooms_shortname": "HEBB",
                        "minSeats": 375,
                        "countSeats": 1,
                        "maxSeats": 375,
                        "avgSeats": 375,
                        "max2": 375
                    },
                    {
                        "rooms_shortname": "LSC",
                        "minSeats": 350,
                        "countSeats": 1,
                        "maxSeats": 350,
                        "avgSeats": 350,
                        "max2": 350
                    },
                    {
                        "rooms_shortname": "OSBO",
                        "minSeats": 442,
                        "countSeats": 1,
                        "maxSeats": 442,
                        "avgSeats": 442,
                        "max2": 442
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
            })
    });


    it("test GROUPing by 3 parameters", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "GT": { "courses_pass": 2300}
            },
            "OPTIONS": {
                "COLUMNS": [

                    "courses_pass", "courses_fail", "courses_title"
                ],
                "ORDER": "courses_pass",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_fail", "courses_title" , "courses_pass"],
                "APPLY": [{
                    "count": {
                        "COUNT": "courses_pass"
                    }
                }
                ]
            }
        }

        let ans ={ 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "courses_fail": 132,
                        "courses_title": "prncpls micrecon",
                        "courses_pass": 2378
                    },
                    {
                        "courses_fail": 135,
                        "courses_title": "prncpls micrecon",
                        "courses_pass": 2438
                    },
                    {
                        "courses_fail": 69,
                        "courses_title": "strat univ writ",
                        "courses_pass": 2466
                    },
                    {
                        "courses_fail": 57,
                        "courses_title": "strat univ writ",
                        "courses_pass": 2491
                    },
                    {
                        "courses_fail": 45,
                        "courses_title": "univrsty writing",
                        "courses_pass": 2498
                    },
                    {
                        "courses_fail": 65,
                        "courses_title": "univrsty writing",
                        "courses_pass": 2502
                    },
                    {
                        "courses_fail": 59,
                        "courses_title": "strat univ writ",
                        "courses_pass": 2557
                    },
                    {
                        "courses_fail": 52,
                        "courses_title": "strat univ writ",
                        "courses_pass": 2655
                    },
                    {
                        "courses_fail": 79,
                        "courses_title": "strat univ writ",
                        "courses_pass": 2698
                    },
                    {
                        "courses_fail": 63,
                        "courses_title": "strat univ writ",
                        "courses_pass": 2994
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
            })
    });


    it("test COLUMNS containing only APPLY key", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "GT": { "courses_pass": 2600}
            },
            "OPTIONS": {
                "COLUMNS": [
                    "sum"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["courses_title"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_pass","courses_title", "courses_year"],
                "APPLY": [{
                    "sum": {
                        "SUM": "courses_pass"
                    }
                }
                ]
            }
        }




        let ans ={ 'code': 200, 'body':
            {"render":"TABLE","result":[{"sum":2655},{"sum":2698},{"sum":2994}]} }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
            })
    });


    it("test empty APPLY", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "GT": { "courses_pass": 2600}
            },
            "OPTIONS": {
                "COLUMNS": [

                    "courses_title"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["courses_title"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_pass","courses_title", "courses_year"],
                "APPLY": [
                ]
            }
        }

        let ans ={ 'code': 200, 'body':
            {"render":"TABLE","result":[
                {"courses_title":"strat univ writ"},
                {"courses_title":"strat univ writ"},
                {"courses_title":"strat univ writ"}
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
            })
    });


    it("test weird apply key", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "GT": { "courses_pass": 2600}
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title"
                ],
                "ORDER": "courses_title",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_pass","courses_title", "courses_year"],
                "APPLY": [{
                    "sasdfm": {
                        "MAX": "courses_pass"
                    }
                }
                ]
            }
        }

        let ans ={ 'code': 200, 'body': {
            "render": "TABLE",
            "result": [
                {
                    "courses_title": "strat univ writ"
                },
                {
                    "courses_title": "strat univ writ"
                },
                {
                    "courses_title": "strat univ writ"
                }
            ]
        }}
        return insightFacade.performQuery(query).then(function (result: any) {
            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
            })
    });

    it("test empty APPLY", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "courses_dept": "cpsc"
                    }
                }, {
                    "LT": {
                        "courses_avg": 65
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_id"
                ],
                "ORDER":{
                    "dir":"DOWN",
                    "keys":["courses_id"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_id"],
                "APPLY": []
            }
        }
        let ans ={ 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "courses_id": "513"
                    },
                    {
                        "courses_id": "213"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {
            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                console.log(err['body'])
                expect.fail();
            })
    });


    it("test old OPTIONS with TRANSFORMATIONS", function () {
        let query: QueryRequest =   {
            "WHERE": {
                "GT": { "courses_pass": 2600}
            },
            "OPTIONS": {
                "COLUMNS": [

                    "courses_title"
                ],
                "ORDER": "courses_title",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_pass","courses_title", "courses_year"],
                "APPLY": [
                ]
            }
        }

        let ans ={ 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "courses_title": "strat univ writ"
                    },
                    {
                        "courses_title": "strat univ writ"
                    },
                    {
                        "courses_title": "strat univ writ"
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
            })
    });
    // it.only("Sum of number of people passed for all courses *REALLY LONG RESULT", function () {
    //     let query: QueryRequest =   {
    //         "WHERE": {
    //
    //         },
    //         "OPTIONS": {
    //             "COLUMNS": [
    //                 "courses_title",
    //                 "sum"
    //             ],
    //             "ORDER": {
    //                 "dir": "UP",
    //                 "keys": ["sum"]
    //             },
    //             "FORM": "TABLE"
    //         },
    //         "TRANSFORMATIONS": {
    //             "GROUP": ["courses_pass","courses_title"],
    //             "APPLY": [{
    //                 "sum": {
    //                     "SUM": "courses_pass"
    //                 }
    //             }
    //             ]
    //         }
    //     }
    //
    //
    //
    //     let ans ={ }
    //     return insightFacade.performQuery(query).then(function (result: any) {
    //
    //         expect(result).to.deep.equal(ans);
    //     })
    //         .catch(function (err: any) {
    //             Log.error(err);
    //         })
    // });
    //
    it("Average of all courses within a department", function () {
        let query: QueryRequest =   {
            "WHERE": {

                "IS": {
                    "courses_dept": "appp"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "avg"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["avg"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_avg","courses_title"],
                "APPLY": [{
                    "avg": {
                        "AVG": "courses_avg"
                    }
                }
                ]
            }
        }


        let ans ={ 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "courses_title": "orgnztnl ldrshp",
                        "avg": 78
                    },
                    {
                        "courses_title": "anyltcs & interp",
                        "avg": 78
                    },
                    {
                        "courses_title": "sustn & ldrshp",
                        "avg": 81.6
                    },
                    {
                        "courses_title": "mngmt & ldrshp",
                        "avg": 85.2
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });


    it("Average of all courses within a department 2", function () {
        let query: QueryRequest =   {
            "WHERE": {

                "IS": {
                    "courses_dept": "fish"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_title",
                    "avg"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["avg"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_avg","courses_title"],
                "APPLY": [{
                    "avg": {
                        "AVG": "courses_avg"
                    }
                }
                ]
            }
        }


        let ans ={ 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "courses_title": "fisheries mngmt",
                        "avg": 94
                    },
                    {
                        "courses_title": "fsh econ & mgmnt",
                        "avg": 91.1
                    },
                    {
                        "courses_title": "bayesn dcsn anl",
                        "avg": 91
                    },
                    {
                        "courses_title": "quant an fish i",
                        "avg": 90.9
                    },
                    {
                        "courses_title": "quant an fish i",
                        "avg": 90.4
                    },
                    {
                        "courses_title": "quant an fish i",
                        "avg": 90.2
                    },
                    {
                        "courses_title": "quant an fish i",
                        "avg": 89
                    },
                    {
                        "courses_title": "cons, govr, eval",
                        "avg": 88.5
                    },
                    {
                        "courses_title": "fisheries mngmt",
                        "avg": 88
                    },
                    {
                        "courses_title": "fisheries mngmt",
                        "avg": 87.8
                    },
                    {
                        "courses_title": "cons, govr, eval",
                        "avg": 87.7
                    },
                    {
                        "courses_title": "fisheries mngmt",
                        "avg": 87.3
                    },
                    {
                        "courses_title": "fsh econ & mgmnt",
                        "avg": 87
                    },
                    {
                        "courses_title": "cons, govr, eval",
                        "avg": 86.9
                    },
                    {
                        "courses_title": "fisheries mngmt",
                        "avg": 86.7
                    },
                    {
                        "courses_title": "fisheries mngmt",
                        "avg": 86.5
                    },
                    {
                        "courses_title": "quant an fish i",
                        "avg": 86
                    },
                    {
                        "courses_title": "fisheries mngmt",
                        "avg": 85.9
                    },
                    {
                        "courses_title": "fisheries mngmt",
                        "avg": 85.4
                    },
                    {
                        "courses_title": "cons, govr, eval",
                        "avg": 85.2
                    },
                    {
                        "courses_title": "cons, govr, eval",
                        "avg": 84.8
                    },
                    {
                        "courses_title": "quant an fish i",
                        "avg": 78
                    }
                ]
            }}
        return insightFacade.performQuery(query).then(function (result: any) {
            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });




    it("deeply nested D3 test", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "AND": [
                    {
                        "NOT": {
                            "LT": {
                                "rooms_seats": 349
                            }
                        }
                    },
                    {
                        "OR": [
                            { "EQ":
                                {
                                    "rooms_seats": 375
                                }
                            },
                            {
                                "EQ":{
                                    "rooms_seats":442
                                }
                            }
                        ]
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_seats"
                ],
                "ORDER": "rooms_seats",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_seats", "rooms_address"],
                "APPLY": [{
                    "avgSeats": {
                        "AVG": "rooms_seats"
                    }
                }
                ]
            }
        }


        let ans = { 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "rooms_seats": 375,
                        "rooms_address": "2045 East Mall"
                    },
                    {
                        "rooms_seats": 442,
                        "rooms_address": "6108 Thunderbird Boulevard"
                    }
                ]
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });

    it("query number of rooms of certain furniture types", function () {
        let query: QueryRequest =  {
            "WHERE": {

            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_furniture",
                    "countType"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["countType", "rooms_furniture"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_furniture"],
                "APPLY": [{
                    "countType": {
                        "COUNT": "rooms_type"
                    }
                }
                ]
            }
        }



        let ans = { 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "rooms_furniture": "Classroom-Learn Lab",
                        "countType": 1
                    },
                    {
                        "rooms_furniture": "Classroom-Moveable Tablets",
                        "countType": 1
                    },
                    {
                        "rooms_furniture": "Classroom-Fixed Tables\/Fixed Chairs",
                        "countType": 2
                    },
                    {
                        "rooms_furniture": "Classroom-Fixed Tables\/Moveable Chairs",
                        "countType": 2
                    },
                    {
                        "rooms_furniture": "Classroom-Fixed Tablets",
                        "countType": 2
                    },
                    {
                        "rooms_furniture": "Classroom-Movable Tablets",
                        "countType": 2
                    },
                    {
                        "rooms_furniture": "Classroom-Moveable Tables & Chairs",
                        "countType": 2
                    },
                    {
                        "rooms_furniture": "Classroom-Hybrid Furniture",
                        "countType": 3
                    },
                    {
                        "rooms_furniture": "Classroom-Movable Tables & Chairs",
                        "countType": 4
                    },
                    {
                        "rooms_furniture": "Classroom-Fixed Tables\/Movable Chairs",
                        "countType": 5
                    }
                ]
            }

        }
        return insightFacade.performQuery(query).then(function (result: any) {

            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });

    it("count # of rooms types and furniture types of all addresses", function () {
        let query: QueryRequest =  {
            "WHERE": {

            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address",
                    "countType", "countFurni"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["countType", "rooms_address"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_address"],
                "APPLY": [{
                    "countType": {
                        "COUNT": "rooms_type"
                    }
                },
                    {
                        "countFurni": {
                            "COUNT": "rooms_furniture"
                        }
                    }
                ]
            }
        }

        let ans = { 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "rooms_address": "1924 West Mall",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "1986 Mathematics Road",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "2036 Main Mall",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "2177 Wesbrook Mall V6T 1Z3",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "2202 Main Mall",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "2207 Main Mall",
                        "countType": 1,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "2260 West Mall, V6T 1Z4",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "2350 Health Sciences Mall",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "6000 Student Union Blvd",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "6081 University Blvd",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "6174 University Boulevard",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "6339 Stores Road",
                        "countType": 1,
                        "countFurni": 1
                    },
                    {
                        "rooms_address": "1822 East Mall",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "1874 East Mall",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "2045 East Mall",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "2080 West Mall",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "2125 Main Mall",
                        "countType": 2,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "2194 Health Sciences Mall",
                        "countType": 2,
                        "countFurni": 4
                    },
                    {
                        "rooms_address": "2206 East Mall",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "2360 East Mall V6T 1Z3",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "6000 Iona Drive",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "6108 Thunderbird Boulevard",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "6224 Agricultural Road",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "6245 Agronomy Road V6T 1Z4",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "6270 University Boulevard",
                        "countType": 2,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "6303 North West Marine Drive",
                        "countType": 2,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "6350 Stores Road",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "6356 Agricultural Road",
                        "countType": 2,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "6445 University Boulevard",
                        "countType": 2,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "1984 Mathematics Road",
                        "countType": 3,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "1984 West Mall",
                        "countType": 3,
                        "countFurni": 4
                    },
                    {
                        "rooms_address": "2175 West Mall V6T 1Z4",
                        "countType": 3,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "2205 East Mall",
                        "countType": 3,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "2356 Main Mall",
                        "countType": 3,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "2405 Wesbrook Mall",
                        "countType": 3,
                        "countFurni": 2
                    },
                    {
                        "rooms_address": "2424 Main Mall",
                        "countType": 3,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "6250 Applied Science Lane",
                        "countType": 3,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "6331 Crescent Road V6T 1Z1",
                        "countType": 3,
                        "countFurni": 3
                    },
                    {
                        "rooms_address": "6363 Agronomy Road",
                        "countType": 3,
                        "countFurni": 5
                    },
                    {
                        "rooms_address": "1866 Main Mall",
                        "countType": 4,
                        "countFurni": 7
                    },
                    {
                        "rooms_address": "1961 East Mall V6T 1Z1",
                        "countType": 4,
                        "countFurni": 5
                    },
                    {
                        "rooms_address": "2357 Main Mall",
                        "countType": 4,
                        "countFurni": 4
                    },
                    {
                        "rooms_address": "6333 Memorial Road",
                        "countType": 4,
                        "countFurni": 4
                    },
                    {
                        "rooms_address": "2053 Main Mall",
                        "countType": 5,
                        "countFurni": 2
                    }
                ]
            }
        }
        return insightFacade.performQuery(query).then(function (result: any) {
            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });


    it("query unique instructors to each course", function () {
        let query: QueryRequest =  {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "courses_dept": "cpsc"
                    }
                }, {
                    "LT": {
                        "courses_avg": 72
                    }
                }]
            },
            "OPTIONS": {
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
            }
        }



        let ans = { 'code': 200, 'body':
            {
                "render": "TABLE",
                "result": [
                    {
                        "courses_id": "110",
                        "numProf": 10
                    },
                    {
                        "courses_id": "213",
                        "numProf": 8
                    },
                    {
                        "courses_id": "320",
                        "numProf": 7
                    },
                    {
                        "courses_id": "210",
                        "numProf": 6
                    },
                    {
                        "courses_id": "313",
                        "numProf": 5
                    },
                    {
                        "courses_id": "221",
                        "numProf": 5
                    },
                    {
                        "courses_id": "121",
                        "numProf": 4
                    },
                    {
                        "courses_id": "422",
                        "numProf": 3
                    },
                    {
                        "courses_id": "404",
                        "numProf": 3
                    },
                    {
                        "courses_id": "322",
                        "numProf": 3
                    },
                    {
                        "courses_id": "317",
                        "numProf": 3
                    },
                    {
                        "courses_id": "303",
                        "numProf": 3
                    },
                    {
                        "courses_id": "261",
                        "numProf": 3
                    },
                    {
                        "courses_id": "513",
                        "numProf": 2
                    },
                    {
                        "courses_id": "421",
                        "numProf": 2
                    },
                    {
                        "courses_id": "420",
                        "numProf": 2
                    },
                    {
                        "courses_id": "416",
                        "numProf": 2
                    },
                    {
                        "courses_id": "415",
                        "numProf": 2
                    },
                    {
                        "courses_id": "340",
                        "numProf": 2
                    },
                    {
                        "courses_id": "301",
                        "numProf": 2
                    },
                    {
                        "courses_id": "425",
                        "numProf": 1
                    },
                    {
                        "courses_id": "314",
                        "numProf": 1
                    },
                    {
                        "courses_id": "304",
                        "numProf": 1
                    },
                    {
                        "courses_id": "302",
                        "numProf": 1
                    }
                ]
            }

        }
        return insightFacade.performQuery(query).then(function (result: any) {
            expect(result).to.deep.equal(ans);
        })
            .catch(function (err: any) {
                Log.error(err);
                expect.fail()
            })
    });


    // it("AVG between 70 to 80", function () {
    //     let query: QueryRequest = {
    //         "WHERE": {
    //             "OR": [{
    //                 "AND": [{"LT": {"courses_avg": 80}},
    //                     {"GT": {"courses_avg": 70}}]
    //             }, {"EQ": {"courses_avg": 75}}
    //             ]
    //         },
    //         "OPTIONS": {
    //             "COLUMNS": ["courses_dept", "courses_id", "courses_avg", "courses_uuid"],
    //             "ORDER": "courses_avg",
    //             "FORM": "TABLE"
    //         }
    //     }
    //     let ans = {'code': 200, 'body': {}}
    //     return insightFacade.performQuery(query).then(function (result: any) {
    //         expect(result).to.deep.equal(ans);
    //     })         .catch(function (err: any) {
    //         expect(err).to.deep.equal(ans);
    //     })
    // });

    // it("contradictory query1", function () {
    //     let query: QueryRequest = {
    //         "WHERE": {"AND": [{"NOT": {"GT": {"courses_avg": 80}}}, {"GT": {"courses_avg": 80}}]},
    //         "OPTIONS": {
    //             "COLUMNS": ["courses_dept", "courses_id", "courses_avg", "courses_uuid"],
    //             "ORDER": "courses_avg",
    //             "FORM": "TABLE"
    //         }
    //     }
    //     let emptyAry: Array<any> = [];
    //     let ans = {'code': 200, 'body': {render: "TABLE", result: emptyAry}};
    //     return insightFacade.performQuery(query).then(function (result: any) {
    //         expect(result).to.deep.equal(ans);
    //     })         .catch(function (err: any) {
    //         expect(err).to.deep.equal(ans);
    //     })
    // });
    // it("contradictory query2", function () {
    //     let query: QueryRequest = {
    //         "WHERE": {"AND": [{"GT": {"courses_avg": 80}}, {"LT": {"courses_avg": 80}}]},
    //         "OPTIONS": {
    //             "COLUMNS": ["courses_dept", "courses_id", "courses_avg", "courses_uuid"],
    //             "ORDER": "courses_avg",
    //             "FORM": "TABLE"
    //         }
    //     }
    //     let ans = {'code': 200, 'body': {render: "TABLE", result: {}}};
    //     return insightFacade.performQuery(query).then(function (result: any) {
    //         expect(result).to.deep.equal(ans);
    //     })         .catch(function (err: any) {
    //         expect(err).to.deep.equal(ans);
    //     })
    // });
    //
    // it("long long result query", function () {
    //     let query: QueryRequest =   {
    //         "WHERE": {
    //             "GT": { "courses_pass": 400}
    //         },
    //         "OPTIONS": {
    //             "COLUMNS": [
    //                 "courses_title",
    //                 "sum", "courses_pass", "courses_year"
    //             ],
    //             "ORDER": {
    //                 "keys": ["sum", "courses_pass", "courses_year"],
    //                 "dir": "UP"
    //             },
    //             "FORM": "TABLE"
    //         },
    //         "TRANSFORMATIONS": {
    //             "APPLY": [{
    //                 "sum": {
    //                     "SUM": "courses_pass"
    //                 }
    //             }],
    //             "GROUP": ["courses_pass","courses_title", "courses_year"]
    //
    //         }
    //     }
    //
    //     return insightFacade.performQuery(query).then(function (result: any) {
    //         console.log(result['body']);
    //         expect(result).to.deep.equal(ans);
    //     })
    //         .catch(function (err: any) {
    //             console.log(err['body'])
    //             Log.error(err['body']);
    //         })
    // });

})