"use strict";
var ValidateController_1 = require("./ValidateController");
var QueryController = (function () {
    function QueryController() {
    }
    QueryController.prototype.performQuery = function (query, datasets) {
        var fs = require("fs");
        var that = this;
        var cacheDir = './src/cache/';
        var data = {};
        var visitedDataset = [];
        var invalidIds = [];
        var keys = [];
        return new Promise(function (fulfill, reject) {
            try {
                if (query.WHERE == undefined) {
                    throw new Error('invalid WHERE.');
                }
                else if (query.OPTIONS['COLUMNS'] == undefined || query.OPTIONS['FORM'] == undefined) {
                    throw new Error('invalid OPTION. Must contain COLUMNS and FORM.');
                }
                else if (query.TRANSFORMATIONS != undefined) {
                    if (query.TRANSFORMATIONS['APPLY'] == undefined || query.TRANSFORMATIONS['GROUP'] == undefined) {
                        throw new Error('Transformations needs to contain both GROUP and APPLY');
                    }
                }
                var validateController = new ValidateController_1.default();
                keys = validateController.getOptionTransKeys({
                    OPTIONS: query.OPTIONS,
                    TRANSFORMATIONS: query.TRANSFORMATIONS
                });
                keys = keys.concat(validateController.getWhereKeys(query.WHERE));
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var key = keys_1[_i];
                    if (key.match(/\w*_\w*/)) {
                        var datasetId = that.getId(key);
                        if (!that.isKeyValid(key, datasetId)) {
                            throw new Error(key + ' is not valid in dataset ' + datasetId);
                        }
                        if (visitedDataset.indexOf(datasetId) < 0) {
                            if (datasets[datasetId] != undefined) {
                                data[datasetId] = datasets[datasetId];
                            }
                            else if (fs.existsSync(cacheDir + datasetId + '.txt')) {
                                data[datasetId] = JSON.parse(fs.readFileSync(cacheDir + datasetId + '.txt', { encoding: 'utf8' }));
                            }
                            else {
                                invalidIds.push(datasetId);
                            }
                            visitedDataset.push(datasetId);
                        }
                    }
                }
                if (visitedDataset.length > 1) {
                    throw new Error('query contains more than 1 dataset');
                }
                else if (invalidIds.length > 0) {
                    reject({ code: 424, body: { missing: invalidIds } });
                }
                else {
                    var dataset = that.flattenArray(data);
                    if (dataset[Object.keys(dataset)[0]] == 'courses') {
                        dataset = that.create_CourseSize(dataset);
                    }
                    var matchedData = that.parseFilter(query.WHERE, dataset);
                    if (query.TRANSFORMATIONS != undefined) {
                        matchedData = that.parseTransformations(query.TRANSFORMATIONS, matchedData);
                    }
                    matchedData = that.parseOptions(query.OPTIONS, matchedData);
                    fulfill({ code: 200, body: matchedData });
                }
            }
            catch (err) {
                reject({ code: 400, body: { "error": err.message } });
            }
        });
    };
    QueryController.prototype.create_CourseSize = function (data) {
        var courseArray = data[Object.keys(data)[0]];
        var reformattedArray = courseArray.map(function (course) {
            course["Size"] = course["Pass"] + course["Fail"];
            return course;
        });
        return data['courses'] = reformattedArray;
    };
    QueryController.prototype.parseFilter = function (queryBody, data) {
        var filteredResults = [];
        var subFilteredResults;
        if (Object.keys(queryBody).length == 0) {
            filteredResults = data[Object.keys(data)[0]];
        }
        else {
            for (var filter in queryBody) {
                if (this.isLogicComp(filter)) {
                    subFilteredResults = [];
                    for (var _i = 0, _a = queryBody[filter]; _i < _a.length; _i++) {
                        var subQueryBody = _a[_i];
                        subFilteredResults.push(this.parseFilter(subQueryBody, data));
                    }
                    if (filter === 'AND') {
                        filteredResults = this.handleAnd(subFilteredResults);
                    }
                    else {
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
                    filteredResults = this.handleNegation(subFilteredResults, data);
                }
            }
        }
        return filteredResults;
    };
    QueryController.prototype.parseOptions = function (queryBody, matcheddata) {
        var subColData = matcheddata;
        var result = {};
        var that = this;
        if (typeof queryBody['ORDER'] == 'string') {
            subColData = this.sortData([queryBody['ORDER']], matcheddata, 'UP');
        }
        else if (typeof queryBody['ORDER'] === 'object') {
            subColData = this.sortData(queryBody['ORDER']['keys'], matcheddata, queryBody['ORDER']['dir']);
        }
        subColData = subColData.map(function (obj) {
            var temp = {};
            var i = 0;
            for (var _i = 0, _a = queryBody['COLUMNS']; _i < _a.length; _i++) {
                var key = _a[_i];
                var id = that.getId(key);
                temp[queryBody['COLUMNS'][i]] = obj[that.parseKey(key, id)];
                i++;
            }
            return temp;
        });
        result['render'] = 'TABLE';
        result['result'] = subColData;
        return result;
    };
    QueryController.prototype.parseTransformations = function (queryBody, matchedData) {
        var groupedKeys = {};
        var parsedGroupData = this.parseGroup(queryBody['GROUP'], matchedData, groupedKeys);
        var parsedApplyData = this.parseApply(queryBody['APPLY'], parsedGroupData);
        return parsedApplyData;
    };
    QueryController.prototype.parseGroup = function (queryBody, matchedData, groupedKeys) {
        var groupedValues = {};
        for (var _i = 0, queryBody_1 = queryBody; _i < queryBody_1.length; _i++) {
            var groupKey = queryBody_1[_i];
            groupedKeys[groupKey] = '';
        }
        for (var _a = 0, matchedData_1 = matchedData; _a < matchedData_1.length; _a++) {
            var course = matchedData_1[_a];
            var temp = [];
            for (var key in groupedKeys) {
                key = this.parseKey(key, this.getId(key));
                var value = course[key];
                temp.push(value);
            }
            if (groupedValues[temp] == undefined) {
                groupedValues[temp] = [];
            }
            groupedValues[temp].push(course);
        }
        return groupedValues;
    };
    QueryController.prototype.parseApply = function (queryBody, parsedGroupData) {
        var parsedApplyData = [];
        var matchedApplyObj = {};
        if (queryBody.length == 0) {
            for (var groupKey in parsedGroupData) {
                parsedApplyData.push(parsedGroupData[groupKey][0]);
            }
            return parsedApplyData;
        }
        for (var _i = 0, queryBody_2 = queryBody; _i < queryBody_2.length; _i++) {
            var applyObj = queryBody_2[_i];
            for (var applyKey in applyObj) {
                var applyToken = Object.keys(applyObj[applyKey])[0];
                var ind = 0;
                for (var groupInd in parsedGroupData) {
                    var group = parsedGroupData[groupInd];
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
                    ind = ind + 1;
                }
            }
        }
        return parsedApplyData;
    };
    QueryController.prototype.calculateMin = function (group, keyData, applyKey) {
        keyData = this.parseKey(keyData, this.getId(keyData));
        var min = group[0][keyData];
        var minInd = 0;
        for (var ind in group) {
            if (group[ind][keyData] < min) {
                min = group[ind][keyData];
                minInd = +ind;
            }
        }
        group[0][applyKey] = min;
        return group[0];
    };
    QueryController.prototype.calculateMax = function (group, keyData, applyKey) {
        keyData = this.parseKey(keyData, this.getId(keyData));
        var max = group[0][keyData];
        var maxInd = 0;
        for (var ind in group) {
            if (group[ind][keyData] > max) {
                max = group[ind][keyData];
                maxInd = +ind;
            }
        }
        group[0][applyKey] = max;
        return group[0];
    };
    QueryController.prototype.calculateAvg = function (group, keyData, applyKey) {
        keyData = this.parseKey(keyData, this.getId(keyData));
        var total = 0;
        var avg = 0;
        for (var _i = 0, group_1 = group; _i < group_1.length; _i++) {
            var groupMem = group_1[_i];
            avg = groupMem[keyData] * 10;
            var temp_1 = Number(avg.toFixed(0));
            total = total + temp_1;
        }
        avg = total / group.length;
        var temp = avg / 10;
        avg = Number(temp.toFixed(2));
        group[0][applyKey] = avg;
        return group[0];
    };
    QueryController.prototype.calculateCount = function (group, keyData, applyKey) {
        keyData = this.parseKey(keyData, this.getId(keyData));
        var uniqueOcc = [];
        for (var _i = 0, group_2 = group; _i < group_2.length; _i++) {
            var groupMem = group_2[_i];
            if (uniqueOcc.indexOf(groupMem[keyData]) < 0) {
                uniqueOcc.push(groupMem[keyData]);
            }
        }
        group[0][applyKey] = uniqueOcc.length;
        return group[0];
    };
    QueryController.prototype.calculateSum = function (group, keyData, applyKey) {
        keyData = this.parseKey(keyData, this.getId(keyData));
        var sum = 0;
        for (var _i = 0, group_3 = group; _i < group_3.length; _i++) {
            var groupMem = group_3[_i];
            sum = sum + groupMem[keyData];
        }
        group[0][applyKey] = sum;
        return group[0];
    };
    QueryController.prototype.handleMComp = function (mcomparator, subQueryBody, data) {
        var temp = [];
        var keyInMcomparator = Object.keys(subQueryBody)[0];
        var idQuery = this.getId(keyInMcomparator);
        var keyInData = this.parseKey(keyInMcomparator, idQuery);
        for (var idData in data) {
            if (idQuery === 'courses' && idData === idQuery) {
                for (var _i = 0, _a = data[idQuery]; _i < _a.length; _i++) {
                    var section = _a[_i];
                    var valInData = section[keyInData];
                    if (mcomparator === 'GT' && valInData > subQueryBody[keyInMcomparator]) {
                        temp.push(section);
                    }
                    else if (mcomparator === 'LT' && valInData < subQueryBody[keyInMcomparator]) {
                        temp.push(section);
                    }
                    else if (mcomparator === 'EQ' && valInData == subQueryBody[keyInMcomparator]) {
                        temp.push(section);
                    }
                }
            }
            if (idQuery === 'rooms' && idData === idQuery) {
                for (var _b = 0, _c = data[idData]; _b < _c.length; _b++) {
                    var room = _c[_b];
                    if (mcomparator === 'GT' && room[keyInData] > subQueryBody[keyInMcomparator]) {
                        temp.push(room);
                    }
                    else if (mcomparator === 'LT' && room[keyInData] < subQueryBody[keyInMcomparator]) {
                        temp.push(room);
                    }
                    else if (mcomparator === 'EQ' && room[keyInData] == subQueryBody[keyInMcomparator]) {
                        temp.push(room);
                    }
                }
            }
        }
        return temp;
    };
    QueryController.prototype.handleSComp = function (subQueryBody, data) {
        var temp = [];
        var keyInScomparator = Object.keys(subQueryBody)[0];
        var idQuery = this.getId(keyInScomparator);
        var keyInData = this.parseKey(keyInScomparator, idQuery);
        var queryString = subQueryBody[keyInScomparator];
        if (queryString[0] === "*" && queryString[queryString.length - 1] === "*") {
            queryString = queryString.substring(1, queryString.length);
            queryString = queryString.substring(0, queryString.length - 1);
            var regexp = new RegExp('.*' + queryString + '.*', 'i');
        }
        else if (queryString[0] === "*") {
            queryString = queryString.substring(1, queryString.length);
            var regexp = new RegExp('.*' + queryString + '$', 'i');
        }
        else if (queryString[queryString.length - 1] === "*") {
            queryString = queryString.substring(0, queryString.length - 1);
            var regexp = new RegExp('^' + queryString + '.*', 'i');
        }
        else {
            var regexp = new RegExp('^' + queryString + '$', 'i');
        }
        for (var idData in data) {
            if (idQuery === 'courses' && idData === idQuery) {
                for (var _i = 0, _a = data[idData]; _i < _a.length; _i++) {
                    var section = _a[_i];
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
                for (var _b = 0, _c = data[idData]; _b < _c.length; _b++) {
                    var room = _c[_b];
                    var valInData = room[keyInData];
                    if (valInData.match(regexp) != null) {
                        temp.push(room);
                    }
                }
            }
        }
        return temp;
    };
    QueryController.prototype.handleNegation = function (deleteAry, fromAry) {
        var temp = [];
        var counter = {};
        for (var datasetId in fromAry) {
            for (var _i = 0, _a = fromAry[datasetId]; _i < _a.length; _i++) {
                var obj = _a[_i];
                var key = JSON.stringify(obj);
                if (counter[key] != undefined) {
                    counter[key] = counter[key] + 1;
                }
                else {
                    counter[key] = 1;
                }
            }
        }
        for (var _b = 0, deleteAry_1 = deleteAry; _b < deleteAry_1.length; _b++) {
            var obj = deleteAry_1[_b];
            var key = JSON.stringify(obj);
            if (counter[key] != undefined) {
                delete counter[key];
            }
        }
        for (var obj in counter) {
            if (counter[obj] >= 1)
                temp.push(JSON.parse(obj));
        }
        return temp;
    };
    QueryController.prototype.handleOr = function (subFilteredResults) {
        var temp = {};
        var union = [];
        for (var _i = 0, subFilteredResults_1 = subFilteredResults; _i < subFilteredResults_1.length; _i++) {
            var subFilteredResult = subFilteredResults_1[_i];
            for (var _a = 0, subFilteredResult_1 = subFilteredResult; _a < subFilteredResult_1.length; _a++) {
                var obj = subFilteredResult_1[_a];
                var key = JSON.stringify(obj);
                if (temp[key] == undefined) {
                    temp[key] = 1;
                }
            }
        }
        var i = 0;
        for (var key_1 in temp) {
            union[i] = JSON.parse(key_1);
            i = i + 1;
        }
        return union;
    };
    QueryController.prototype.handleAnd = function (subFilteredResults) {
        var counter = {};
        var intersect = [];
        for (var _i = 0, subFilteredResults_2 = subFilteredResults; _i < subFilteredResults_2.length; _i++) {
            var array = subFilteredResults_2[_i];
            for (var _a = 0, array_1 = array; _a < array_1.length; _a++) {
                var obj = array_1[_a];
                var counterKey = JSON.stringify(obj);
                if (counter[counterKey] != undefined) {
                    counter[counterKey] = counter[counterKey] + 1;
                }
                else {
                    counter[counterKey] = 1;
                }
            }
        }
        for (var counterKey_1 in counter) {
            if (counter[counterKey_1] >= subFilteredResults.length) {
                intersect.push(JSON.parse(counterKey_1));
            }
        }
        return intersect;
    };
    QueryController.prototype.getId = function (key) {
        var regex = /_.+/;
        return key.replace(regex, '');
    };
    QueryController.prototype.parseKey = function (key, id) {
        var regex = /.+_/;
        var temp = key.replace(regex, '');
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
        }
        else if (id === 'rooms') {
            return key;
        }
        return temp;
    };
    QueryController.prototype.flattenArray = function (data) {
        var flattenedData = {};
        var aryOfObj = [];
        for (var id in data) {
            if (id === 'courses') {
                for (var _i = 0, _a = data[id]; _i < _a.length; _i++) {
                    var course = _a[_i];
                    for (var _b = 0, _c = course.content.result; _b < _c.length; _b++) {
                        var section = _c[_b];
                        if (section['Section'] === 'overall') {
                            section['Year'] = 1900;
                        }
                        else {
                            section['Year'] = +section['Year'];
                        }
                        section['id'] = section['id'].toString();
                        aryOfObj.push(section);
                    }
                }
            }
            else if (id === 'rooms') {
                for (var _d = 0, _e = data[id]; _d < _e.length; _d++) {
                    var building = _e[_d];
                    aryOfObj = aryOfObj.concat(building);
                }
            }
            flattenedData[id] = aryOfObj;
            aryOfObj = [];
        }
        return flattenedData;
    };
    QueryController.prototype.isLogicComp = function (filter) {
        return filter === 'AND' || filter === 'OR';
    };
    QueryController.prototype.isMComp = function (filter) {
        return filter === 'LT' || filter === 'GT' || filter === 'EQ';
    };
    QueryController.prototype.isSComp = function (filter) {
        return filter === 'IS';
    };
    QueryController.prototype.isNegation = function (filter) {
        return filter === 'NOT';
    };
    QueryController.prototype.isColumns = function (option) {
        return option === 'COLUMNS';
    };
    QueryController.prototype.isOrder = function (option) {
        return option === 'ORDER';
    };
    QueryController.prototype.isGroup = function (option) {
        return option === 'GROUP';
    };
    QueryController.prototype.isApply = function (option) {
        return option === 'APPLY';
    };
    QueryController.prototype.isForm = function (option) {
        return option === 'FORM';
    };
    QueryController.prototype.isKeyValid = function (key, id) {
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
        }
        else if (id == 'rooms') {
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
        }
        else {
            return true;
        }
    };
    QueryController.prototype.sortData = function (keyValues, data, dir) {
        var that = this;
        if (dir == 'DOWN') {
            var temp = data.sort(function (a, b) {
                var temp4 = that.compTwoObjs(a, b, keyValues, dir);
                return temp4;
            });
            return temp;
        }
        else {
            var temp2 = data.sort(function (a, b) {
                var temp4 = that.compTwoObjs(a, b, keyValues, dir);
                return temp4;
            });
            return temp2;
        }
    };
    QueryController.prototype.compTwoObjs = function (objA, objB, keyValues, dir) {
        var keyValue;
        if (typeof keyValues === 'string') {
            keyValue = this.parseKey(keyValues, this.getId(keyValues));
        }
        else if (keyValues.length == 0) {
            return 0;
        }
        else {
            keyValue = this.parseKey(keyValues[0], this.getId(keyValues[0]));
        }
        if (dir === 'DOWN') {
            if (typeof objA[keyValue] === 'string') {
                var minLen = Math.min(objA[keyValue].length, objB[keyValue].length);
                var charInd = 0;
                while (charInd <= minLen - 1) {
                    if (objA[keyValue][charInd] > objB[keyValue][charInd]) {
                        return -1;
                    }
                    else if (objA[keyValue][charInd] < objB[keyValue][charInd]) {
                        return 1;
                    }
                    charInd = charInd + 1;
                }
                var temp = keyValues.slice(1, keyValues.length);
                return this.compTwoObjs(objA, objB, temp, dir);
            }
            else {
                if (objB[keyValue] - objA[keyValue] == 0) {
                    var temp = keyValues.slice(1, keyValues.length);
                    return this.compTwoObjs(objA, objB, temp, dir);
                }
                else if (objA[keyValue] > objB[keyValue]) {
                    return -1;
                }
                else if (objA[keyValue] < objB[keyValue]) {
                    return 1;
                }
            }
        }
        else {
            if (typeof objA[keyValue] === 'string') {
                var minLen = Math.min(objA[keyValue].length, objB[keyValue].length);
                var charInd = 0;
                while (charInd <= minLen - 1) {
                    if (objA[keyValue][charInd] > objB[keyValue][charInd]) {
                        return 1;
                    }
                    else if (objA[keyValue][charInd] < objB[keyValue][charInd]) {
                        return -1;
                    }
                    charInd = charInd + 1;
                }
                var temp = keyValues.slice(1, keyValues.length);
                return this.compTwoObjs(objA, objB, temp, dir);
            }
            else {
                if (objB[keyValue] - objA[keyValue] == 0) {
                    var temp = keyValues.slice(1, keyValues.length);
                    return this.compTwoObjs(objA, objB, temp, dir);
                }
                else if (objA[keyValue] > objB[keyValue]) {
                    return 1;
                }
                else if (objA[keyValue] < objB[keyValue]) {
                    return -1;
                }
            }
        }
    };
    return QueryController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = QueryController;
//# sourceMappingURL=QueryController.js.map