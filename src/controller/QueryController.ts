import {InsightResponse, QueryRequest} from "./IInsightFacade";
import ValidateController from "./ValidateController";


export default class QueryController {

    constructor() {
    }

    /**
     * @param query
     * @param datasets: all datasets in memory
     * @returns {Promise<T>}
     * Given the input @param query, find matched data from @param datasets
     * Return matched data in a InsightResponse object if query is valid
     * Return error in a InsightResponse object if query is invalid
     *
     */
    performQuery(query: QueryRequest, datasets: any): Promise<InsightResponse> {
        var fs = require("fs");
        var that = this;
        let cacheDir: string = './src/cache/';
        let data: any = {};
        let visitedDataset: Array<string> = [];
        let invalidIds: Array<any> = [];
        let keys: Array<string> = [];
        return new Promise(function (fulfill, reject) {
            try {
                if (query.WHERE == undefined) {
                    throw new Error('invalid WHERE.');
                } else if (query.OPTIONS['COLUMNS'] == undefined || query.OPTIONS['FORM'] == undefined) {
                    throw new Error('invalid OPTION. Must contain COLUMNS and FORM.')
                } else if (query.TRANSFORMATIONS != undefined) {
                    if (query.TRANSFORMATIONS['APPLY'] == undefined || query.TRANSFORMATIONS['GROUP'] == undefined) {
                        throw new Error('Transformations needs to contain both GROUP and APPLY')
                    }
                }

                var validateController = new ValidateController();
                keys = validateController.getOptionTransKeys({
                    OPTIONS: query.OPTIONS,
                    TRANSFORMATIONS: query.TRANSFORMATIONS
                });
                keys = keys.concat(validateController.getWhereKeys(query.WHERE));

                for (let key of keys) {
                    if (key.match(/\w*_\w*/)) { //ignore those user defined keys in APPLY
                        let datasetId = that.getId(key);
                        if (!that.isKeyValid(key, datasetId)) {
                            throw new Error(key + ' is not valid in dataset ' + datasetId);
                        }
                        if (visitedDataset.indexOf(datasetId) < 0) { //if the dataset has not been visited
                            if (datasets[datasetId] != undefined) {
                                data[datasetId] = datasets[datasetId];
                            } else if (fs.existsSync(cacheDir + datasetId + '.txt')) {
                                data[datasetId] = JSON.parse(fs.readFileSync(cacheDir + datasetId + '.txt', {encoding: 'utf8'}));
                            } else {
                                invalidIds.push(datasetId);
                            }
                            visitedDataset.push(datasetId);
                        }
                    }

                }

                if (visitedDataset.length > 1) {
                    throw new Error('query contains more than 1 dataset');
                } else if (invalidIds.length > 0) {
                    reject({code: 424, body: {missing: invalidIds}});
                } else {
                    let dataset: any = that.flattenArray(data);
                    if(dataset[Object.keys(dataset)[0]] == 'courses'){
                        dataset = that.create_CourseSize(dataset)
                    }
                    let matchedData = that.parseFilter(query.WHERE, dataset);

                    if (query.TRANSFORMATIONS != undefined) {
                        matchedData = that.parseTransformations(query.TRANSFORMATIONS, matchedData);
                    }
                    matchedData = that.parseOptions(query.OPTIONS, matchedData);
                    fulfill({code: 200, body: matchedData});
                }
            } catch (err) {
                reject({code: 400, body: {"error": err.message}});
            }
        });
    }

    // parseKey('courses_size') is equivalent to 'Size'.  should switch depending on whether parsekey is called
    create_CourseSize(data:any):any {
        let courseArray: any = data[Object.keys(data)[0]];
        var reformattedArray = courseArray.map(function(course:any) {
            course["Size"] = course["Pass"] + course["Fail"]
            return course;
        });

        return data['courses'] = reformattedArray;
    }
    /**
     * @param queryBody: body of the query, i.e. the WHERE part of the query.
     * @param data: An object. Keys are ids of datasets
     * QUERY ::='{'BODY ', ' OPTIONS '}'
     * BODY ::= 'WHERE:{'  FILTER '}'
     * FILTER ::= (LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION)
     * @returns {Array<any>}: an array of objects from data that matched the query. Return data if queryBody is empty
     */
    parseFilter(queryBody: any, data: any): Array<any> {
        let filteredResults: Array<any> = [];
        let subFilteredResults: Array<any>;
        if (Object.keys(queryBody).length == 0) {
            filteredResults = data[Object.keys(data)[0]]; //all deliverables assume that we only deal with one dataset in query
        } else {
            for (let filter in queryBody) {
                if (this.isLogicComp(filter)) {
                    subFilteredResults = [];
                    for (let subQueryBody of queryBody[filter]) {
                        subFilteredResults.push(this.parseFilter(subQueryBody, data));
                    }
                    if (filter === 'AND') {
                        filteredResults = this.handleAnd(subFilteredResults);
                    } else {
                        filteredResults = this.handleOr(subFilteredResults);
                    }
                }
                else if (this.isMComp(filter)) {
                    filteredResults = this.handleMComp(filter, queryBody[filter], data);
                }
                else if (this.isSComp(filter)) {
                    filteredResults = this.handleSComp(queryBody[filter], data);
                }
                else if (this.isNegation(filter)) {
                    subFilteredResults = [];
                    subFilteredResults = this.parseFilter(queryBody[filter], data);
                    filteredResults = this.handleNegation(subFilteredResults, data); //handle different id later
                }
            }
        }


        return filteredResults;
    }

    /**
     * @param queryBody: the OPTIONS part of query
     * @param matcheddata: data that matched the WHERE part of query
     * @returns {any}: an object which specifies output format and ordered data with selected columns.
     */
    parseOptions(queryBody: any, matcheddata: Array<any>): any {
        let subColData: Array<any> = matcheddata;
        let result: any = {};
        var that = this

        //sort data
        if (typeof queryBody['ORDER'] == 'string') {
            subColData = this.sortData([queryBody['ORDER']], matcheddata, 'UP');
        } else if (typeof queryBody['ORDER'] === 'object') {
            subColData = this.sortData(queryBody['ORDER']['keys'], matcheddata, queryBody['ORDER']['dir']);
        }

        //get columns
        subColData = subColData.map(function (obj) {
            let temp: any = {};
            let i: number = 0;
            for (let key of queryBody['COLUMNS']) {
                let id: string = that.getId(key);
                temp[queryBody['COLUMNS'][i]] = obj[that.parseKey(key, id)];
                i++;
            }
            return temp;
        })

        result['render'] = 'TABLE';
        result['result'] = subColData;
        return result;
    }

    /**
     * @param queryBody: the TRANSFORMATIONS part of query
     * @param matcheddata: data that matched the WHERE part of query
     * @returns {any}: an object that transforms the WHERE data given GROUP/APPLY
     */
    parseTransformations(queryBody: any, matchedData: Array<any>): any {
        let groupedKeys: any = {};
        let parsedGroupData = this.parseGroup(queryBody['GROUP'], matchedData, groupedKeys);
        let parsedApplyData = this.parseApply(queryBody['APPLY'], parsedGroupData);
        return parsedApplyData
    }


    /**
     * @param queryBody: the TRANSFORMATIONS.GROUP part of query
     * @param matcheddata: data that need to be grouped
     * @param groupedKeys
     * @returns {any}: an object containing [Value combination]:[{course},..] as key:value
     * pairs. Entries are grouped based on value combinations.
     */
    parseGroup(queryBody: any, matchedData: any, groupedKeys: any): any {

        let groupedValues: any = {};
        for (let groupKey of queryBody) { //DUPLICATES ELIMINATION
            groupedKeys[groupKey] = '';
        }
        for (let course of matchedData) { // GROUPING
            let temp: any = [];
            for (let key in  groupedKeys) {
                key = this.parseKey(key, this.getId(key));
                let value: any = course[key];
                temp.push(value)
            }

            if (groupedValues[temp] == undefined) {
                groupedValues[temp] = []
            }

            groupedValues[temp].push(course);

        }
        return groupedValues

    }

    /**
     * @param queryBody: the TRANSFORMATIONS.APPLY part of query
     * @param parsedGroupData:
     * @returns {any}: An array of a single object that matches TRANSFORMATION.APPLY
     */
    parseApply(queryBody: any, parsedGroupData: any): any {
        let parsedApplyData: Array<any> = [];
        let matchedApplyObj: any = {};

        if (queryBody.length == 0) {
            for (let groupKey in parsedGroupData) {
                parsedApplyData.push(parsedGroupData[groupKey][0]);
            }
            return parsedApplyData;
        }
        for (let applyObj of queryBody) {
            for (let applyKey in applyObj) {
                let applyToken: string = Object.keys(applyObj[applyKey])[0];
                var ind = 0;
                for (let groupInd in parsedGroupData) {
                    let group: Array<any> = parsedGroupData[groupInd];
                    if (applyToken == "MIN") {
                        matchedApplyObj = this.calculateMin(group, applyObj[applyKey][applyToken], applyKey);
                    }
                    else if (applyToken == "MAX") {
                        matchedApplyObj = this.calculateMax(group, applyObj[applyKey][applyToken], applyKey);
                    }
                    else if (applyToken == "AVG") {
                        matchedApplyObj = this.calculateAvg(group, applyObj[applyKey][applyToken], applyKey);
                    }
                    else if (applyToken == "COUNT") {
                        matchedApplyObj = this.calculateCount(group, applyObj[applyKey][applyToken], applyKey);
                    }
                    else if (applyToken == "SUM") {
                        matchedApplyObj = this.calculateSum(group, applyObj[applyKey][applyToken], applyKey);
                    }
                    parsedApplyData[ind] = matchedApplyObj;
                    ind = ind + 1; //TODO change output of parseGroup
                }
            }
        }

        return parsedApplyData;
    }

    //return min of each group in an array

    /**
     * @param group: a group, where each member of the group share some common values
     * @param keyData: name of key, i.e. rooms_seats
     * @param applyKey: a user defined key in APPLY
     * @returns {any}: a member of the group which has the minimum value given @param keyData
     */
    calculateMin(group: any, keyData: string, applyKey: string): any {
        keyData = this.parseKey(keyData, this.getId(keyData));
        let min: number = group[0][keyData];
        let minInd: number = 0;

        for (let ind in group) {
            if (group[ind][keyData] < min) {
                min = group[ind][keyData];
                minInd = +ind;
            }
        }

        group[0][applyKey] = min;
        return group[0];
    }

    /**
     * @param group: a group, where each member of the group share some common values
     * @param keyData: name of key, i.e. rooms_seats
     * @param applyKey: a user defined key in APPLY
     * @returns {any}: a member of the group which has the maximum value given @param keyData
     */
    calculateMax(group: any, keyData: string, applyKey: string): any {
        keyData = this.parseKey(keyData, this.getId(keyData));
        let max: number = group[0][keyData];
        let maxInd: number = 0;

        for (let ind in group) {
            if (group[ind][keyData] > max) {
                max = group[ind][keyData];
                maxInd = +ind;
            }
        }

        group[0][applyKey] = max;
        return group[0];
    }

    /**
     * @param group: a group, where each member of the group share some common values
     * @param keyData: name of key, i.e. rooms_seats
     * @param applyKey: a user defined key in APPLY
     * @returns {any}: a member of the group with a new key value pair. key = applyKey, value = average value of the group values under keyData
     */
    calculateAvg(group: any, keyData: any, applyKey: any): any {
        keyData = this.parseKey(keyData, this.getId(keyData));
        let total: number = 0;
        let avg: number = 0;

        for (let groupMem of group) {
            avg = groupMem[keyData] * 10;
            let temp = Number(avg.toFixed(0));
            total = total + temp;
        }

        avg = total / group.length;
        let temp = avg / 10;
        avg = Number(temp.toFixed(2));

        group[0][applyKey] = avg;
        return group[0];
    }

    /**
     * @param group: a group, where each member of the group share some common values
     * @oaram keyData: name of key, i.e. rooms_seats
     * @param applyKey: a user defined key in APPLY
     * @returns {any}: a member of the group with a new key value pair. key = applyKey, value = length of group
     */
    calculateCount(group: any, keyData: any, applyKey: any): any {
        keyData = this.parseKey(keyData, this.getId(keyData));
        let uniqueOcc: Array<any> = [];

        for (let groupMem of group) {
            if (uniqueOcc.indexOf(groupMem[keyData]) < 0) {
                uniqueOcc.push(groupMem[keyData]);
            }
        }
        group[0][applyKey] = uniqueOcc.length;

        return group[0];
    }

    /**
     * @param group: a group, where each member of the group share some common values
     * @param keyData: name of key, i.e. rooms_seats
     * @param applyKey: a user defined key in APPLY
     * @returns {any}: a member of the group with a new key value pair. key = applyKey, value = sum of group values under keyData
     */
    calculateSum(group: any, keyData: any, applyKey: string): any {
        keyData = this.parseKey(keyData, this.getId(keyData));
        let sum: number = 0;

        for (let groupMem of group) {
            sum = sum + groupMem[keyData];
        }

        group[0][applyKey] = sum;
        return group[0];
    }

    /**
     * @param mcomparator: MCOMPARATOR ::= 'LT' | 'GT' | 'EQ'
     * @param subQueryBody: the value (an object) corresponding to the mcomparator in the query
     * @param data: an object where keys are ids and values are datasets
     * @returns {Array<any>}: a set of objects in data that meet the criteria.
     */
    handleMComp(mcomparator: string, subQueryBody: any, data: any): any {
        let temp: Array<any> = [];
        let keyInMcomparator: string = Object.keys(subQueryBody)[0];
        let idQuery: string = this.getId(keyInMcomparator);
        let keyInData: string = this.parseKey(keyInMcomparator, idQuery);
        for (let idData in data) {
            if (idQuery === 'courses' && idData === idQuery) {
                for (let section of data[idQuery]) {
                    let valInData: number = section[keyInData];
                    if (mcomparator === 'GT' && valInData > subQueryBody[keyInMcomparator]) {
                        temp.push(section);
                    } else if (mcomparator === 'LT' && valInData < subQueryBody[keyInMcomparator]) {
                        temp.push(section);
                    } else if (mcomparator === 'EQ' && valInData == subQueryBody[keyInMcomparator]) {
                        temp.push(section);
                    }
                }
            }
            if (idQuery === 'rooms' && idData === idQuery) {
                for (let room of data[idData]) {
                    if (mcomparator === 'GT' && room[keyInData] > subQueryBody[keyInMcomparator]) {
                        temp.push(room);
                    } else if (mcomparator === 'LT' && room[keyInData] < subQueryBody[keyInMcomparator]) {
                        temp.push(room);
                    } else if (mcomparator === 'EQ' && room[keyInData] == subQueryBody[keyInMcomparator]) {
                        temp.push(room);
                    }
                }
            }
        }

        return temp;
    }

    /**
     * SCOMPARISON ::= 'IS:{' key ':' [*]? string [*]? '}'
     * @param subQueryBody: the value (an object) corresponding to the IS in the query
     * @param data: an object where keys are ids and values are datasets
     * @returns {Array<any>} a set of objects in data that meet the criteria.
     */
    handleSComp(subQueryBody: any, data: Array<any>): any { //handle different ID later
        let temp: Array<any> = [];
        let keyInScomparator: string = Object.keys(subQueryBody)[0];
        let idQuery: string = this.getId(keyInScomparator);
        let keyInData: string = this.parseKey(keyInScomparator, idQuery);
        let queryString: string = subQueryBody[keyInScomparator];
        if (queryString[0] === "*" && queryString[queryString.length - 1] === "*") {
            queryString = queryString.substring(1, queryString.length);
            queryString = queryString.substring(0, queryString.length - 1);
            var regexp = new RegExp('.*' + queryString + '.*', 'i');
        } else if (queryString[0] === "*") {
            queryString = queryString.substring(1, queryString.length);
            var regexp = new RegExp('.*' + queryString + '$', 'i');
        } else if (queryString[queryString.length - 1] === "*") {
            queryString = queryString.substring(0, queryString.length - 1);
            var regexp = new RegExp('^' + queryString + '.*', 'i');
        } else {
            var regexp = new RegExp('^' + queryString + '$', 'i');
        }
        for (let idData in data) {
            if (idQuery === 'courses' && idData === idQuery) {
                for (let section of data[idData]) {
                    var valInData = section[keyInData];
                    if (keyInData === 'id') {
                        valInData = section[keyInData].toString();
                    }
                    if (valInData.match(regexp) != null) {
                        temp.push(section);
                    }
                }
            }
            if (idQuery === 'rooms' && idData === idQuery) {
                for (let room of data[idData]) {
                    var valInData = room[keyInData];
                    if (valInData.match(regexp) != null) {
                        temp.push(room);
                    }
                }
            }
        }
        return temp;
    }

    /**
     *
     * @param deleteAry: an array of objects to be deleted
     * @param fromAry: an object with different ids and their corresponding datasets
     * @returns an array which subtract objects in deleteAry from fromAry
     */
    handleNegation(deleteAry: Array<any>, fromAry: any): any {
        let temp: Array<any> = [];
        let counter: any = {};

        for (let datasetId in fromAry) {
            for (let obj of fromAry[datasetId]) {
                var key = JSON.stringify(obj);
                if (counter[key] != undefined) {
                    counter[key] = counter[key] + 1;
                } else {
                    counter[key] = 1;
                }
            }
        }

        for (let obj of deleteAry) {
            var key = JSON.stringify(obj);
            if (counter[key] != undefined) {
                delete counter[key];
            }
        }

        for (let obj in counter) {
            if (counter[obj] >= 1)
                temp.push(JSON.parse(obj));
        }

        return temp;
    }

    /**
     * @param subFilteredResults: an array of arrays of objects that were matching results from filters inside the OR
     * @returns {Array<any>}: union of all objects without duplicates
     */
    handleOr(subFilteredResults: Array<any>): any {
        let temp: any = {};
        let union: Array<any> = [];
        for (let subFilteredResult of subFilteredResults) {
            for (let obj of subFilteredResult) {
                var key = JSON.stringify(obj);
                if (temp[key] == undefined) {
                    temp[key] = 1;
                }
            }
        }
        var i = 0;
        for (let key in temp) {
            union[i] = JSON.parse(key);
            i = i + 1;
        }
        return union;
    }

    /**
     * @param subFilteredResults: an array of arrays of objects that were matching results from filters inside the AND
     * @returns {Array<any>}: objects that exist in every array.
     */
    handleAnd(subFilteredResults: Array<any>): any {
        let counter: any = {};
        let intersect: Array<any> = [];
        for (let array of subFilteredResults) {
            for (let obj of array) {
                var counterKey = JSON.stringify(obj);
                if (counter[counterKey] != undefined) {
                    counter[counterKey] = counter[counterKey] + 1;
                } else {
                    counter[counterKey] = 1;
                }
            }
        }

        for (let counterKey in counter) {
            if (counter[counterKey] >= subFilteredResults.length) {
                intersect.push(JSON.parse(counterKey));
            }
        }

        return intersect;
    }


    getId(key: string): string {
        var regex = /_.+/;
        return key.replace(regex, '');
    }

    /**
     * @param key: key in the query
     * @param id: unique identifier of the dataset
     * @returns {string}: corresponding key in the dataset given id
     */
    parseKey(key: string, id: string): string {
        var regex = /.+_/;
        let temp: string = key.replace(regex, '');
        if (id == 'courses') {
            if (temp === "dept") {
                temp = "Subject";
            }
            if (temp === "id") {
                temp = "Course";
            }
            if (temp === "avg") {
                temp = "Avg";
            }
            if (temp === "instructor") {
                temp = "Professor";
            }
            if (temp === "title") {
                temp = "Title";
            }
            if (temp === "pass") {
                temp = "Pass";
            }
            if (temp === "fail") {
                temp = "Fail";
            }
            if (temp === "audit") {
                temp = "Audit";
            }
            if (temp === "uuid") {
                temp = "id";
            }
            if (temp === "year") {
                temp = "Year";
            }
            if (temp === "size") {
                temp = "Size";
            }
        } else if (id === 'rooms') {
            return key;
        }
        return temp;
    }

    /**
     *
     * @param data: an object, where each key is an id and value is an array of objects in the corresponding dataset
     * @returns an object, where each key is an id and value is an array of sections in the dataset
     * if id is courses, change courses_year for 'overall' sections to 1900
     */
    flattenArray(data: any): any {
        let flattenedData: any = {};
        let aryOfObj: Array<any> = [];
        for (let id in data) {
            if (id === 'courses') {
                for (let course of data[id]) {
                    for (let section of course.content.result) {
                        if (section['Section'] === 'overall') {
                            section['Year'] = 1900;
                        } else {
                            section['Year'] = +section['Year'];
                        }
                        section['id'] = section['id'].toString();
                        aryOfObj.push(section);
                    }
                }
            } else if (id === 'rooms') {
                for (let building of data[id]) {
                    aryOfObj = aryOfObj.concat(building);
                }
            }
            flattenedData[id] = aryOfObj;
            aryOfObj = [];
        }
        return flattenedData;
    }

    /**
     * Helpers
     */
    isLogicComp(filter: string): boolean {
        return filter === 'AND' || filter === 'OR';
    }

    isMComp(filter: string): boolean {
        return filter === 'LT' || filter === 'GT' || filter === 'EQ';
    }

    isSComp(filter: string): boolean {
        return filter === 'IS';
    }

    isNegation(filter: string): boolean {
        return filter === 'NOT';
    }

    isColumns(option: string): boolean {
        return option === 'COLUMNS';
    }

    isOrder(option: string): boolean {
        return option === 'ORDER';
    }

    isGroup(option: string): boolean {
        return option === 'GROUP';
    }

    isApply(option: string): boolean {
        return option === 'APPLY';
    }

    isForm(option: string): boolean {
        return option === 'FORM';
    }

    isKeyValid(key: string, id: string): boolean {
        if (id == 'courses') {
            return (key === "courses_dept") ||
                (key === "courses_id") ||
                (key === "courses_avg") ||
                (key === "courses_instructor") ||
                (key === "courses_title") ||
                (key === "courses_pass") ||
                (key === "courses_fail") ||
                (key === "courses_audit") ||
                (key === "courses_uuid") ||
                (key === "courses_year") ||
                (key === "courses_size");
        } else if (id == 'rooms') {
            return (key === "rooms_fullname") ||
                (key === "rooms_shortname") ||
                (key === "rooms_number") ||
                (key === "rooms_name") ||
                (key === "rooms_address") ||
                (key === "rooms_lat") ||
                (key === "rooms_lon") ||
                (key === "rooms_seats") ||
                (key === "rooms_type") ||
                (key === "rooms_furniture") ||
                (key === "rooms_href");
        } else {
            return true;
        }
    }

    /**
     * @param keyValues. A string or an array. If keyValues is array, sort data by each key and break tie using subsequent keys
     * @param data. An array of objects to be sorted
     * @param dir. up/down. If dir=up, data is ordered from small to large. If dir=down, data is ordered from large to small
     * @returns {any} sorted data
     */
    sortData(keyValues: any, data: any, dir: any): any {
        var that = this;

        if (dir == 'DOWN') {
            var temp = data.sort(function (a: any, b: any): any {
                var temp4 =  that.compTwoObjs(a, b, keyValues, dir);
                return temp4;
            })
            return temp;
        }
        else {
            var temp2 = data.sort(function (a: any, b: any): any {
                var temp4 =  that.compTwoObjs(a, b, keyValues, dir);
                return temp4;
            })
            return temp2;
        }
    }

    /**
     * @param objA
     * @param objB
     * @param keyValues. Specify values that objA and objB will compare with
     * @param dir. UP or DOWN
     * @returns 1/-1/0 depending on @param dir
     */
    compTwoObjs(objA:any, objB:any, keyValues:any, dir:string):number {
        let keyValue:string;

        if (typeof keyValues === 'string') {
            keyValue = this.parseKey(keyValues, this.getId(keyValues));
        } else if (keyValues.length == 0) {
            return 0
        } else {
            keyValue = this.parseKey(keyValues[0], this.getId(keyValues[0]));
        }

        if (dir === 'DOWN') {
            if (typeof objA[keyValue] === 'string') {
                let minLen = Math.min(objA[keyValue].length, objB[keyValue].length);
                var charInd = 0;
                while (charInd <= minLen-1) {
                    if (objA[keyValue][charInd] > objB[keyValue][charInd]) {
                        return -1;
                    } else if (objA[keyValue][charInd] < objB[keyValue][charInd]) {
                        return 1;
                    }
                    charInd = charInd + 1;
                }
                var temp = keyValues.slice(1, keyValues.length);
                return this.compTwoObjs(objA, objB, temp, dir);
            }
            else {
                if (objB[keyValue] - objA[keyValue] == 0) {
                    var temp = keyValues.slice(1,keyValues.length);
                    return this.compTwoObjs(objA, objB, temp, dir);
                } else if (objA[keyValue] > objB[keyValue]) {
                    return -1;
                } else if (objA[keyValue] < objB[keyValue]) {
                    return 1;
                }
            }
        } else {
            if (typeof objA[keyValue] === 'string') {
                let minLen = Math.min(objA[keyValue].length, objB[keyValue].length);
                var charInd = 0;
                while (charInd <= minLen-1) {
                    if (objA[keyValue][charInd] > objB[keyValue][charInd]) {
                        return 1;
                    } else if (objA[keyValue][charInd] < objB[keyValue][charInd]) {
                        return -1;
                    }
                    charInd = charInd + 1;
                }
                var temp = keyValues.slice(1, keyValues.length);
                return this.compTwoObjs(objA, objB, temp, dir);
            }
            else {
                if (objB[keyValue] - objA[keyValue] == 0) {
                    var temp = keyValues.slice(1,keyValues.length);
                    return this.compTwoObjs(objA, objB, temp, dir);
                } else if (objA[keyValue] > objB[keyValue]) {
                    return 1;
                } else if (objA[keyValue] < objB[keyValue]) {
                    return -1;
                }
            }
        }
    }


}