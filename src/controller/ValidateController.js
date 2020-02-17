"use strict";
var ValidateController = (function () {
    function ValidateController() {
    }
    ValidateController.prototype.getWhereKeys = function (query) {
        var keys = [];
        for (var filter in query) {
            if (this.isLogicComp(filter)) {
                if (Object.keys(query[filter]).length < 1) {
                    throw new Error('invalid LOGICCOMPARISON. Must contain at least 1 FILTER');
                }
                for (var _i = 0, _a = query[filter]; _i < _a.length; _i++) {
                    var subQueryBody = _a[_i];
                    keys = keys.concat(this.getWhereKeys(subQueryBody));
                }
            }
            else if (this.isMComp(filter)) {
                if (Object.keys(query[filter]).length > 1) {
                    throw new Error('invalid MCOMPARISON. Cannot contain more than 1 MCOMPARATOR');
                }
                var numberKeys = ['courses_avg', 'courses_pass', 'courses_size', 'courses_fail', 'courses_audit', 'courses_year', 'rooms_lat', 'rooms_lon', 'rooms_seats'];
                for (var mcomp in query[filter]) {
                    if (typeof query[filter][mcomp] != 'number') {
                        throw new Error('invalid MCOMPARISON. Must compare with a number');
                    }
                    if (mcomp.match(/.+_.+/) == null) {
                        throw new Error('invalid key.');
                    }
                    if (numberKeys.indexOf(mcomp) < 0) {
                        throw new Error('invalid MCOMPARISON. Require a number key');
                    }
                    keys.push(mcomp);
                }
            }
            else if (this.isSComp(filter)) {
                if (Object.keys(query[filter]).length > 1) {
                    throw new Error('invalid SCOMPARISON. Cannot contain more than 1 IS');
                }
                for (var scomp in query[filter]) {
                    if (typeof query[filter][scomp] != 'string') {
                        throw new Error('invalid SCOMPARISON. Must compare with a string');
                    }
                    if (scomp.match(/.+_.+/) == null) {
                        throw new Error('invalid key.');
                    }
                    keys.push(scomp);
                }
            }
            else if (this.isNegation(filter)) {
                if (Object.keys(query[filter]).length > 1) {
                    throw new Error('invalid NEGATION. Cannot contain more than 1 FILTER');
                }
                keys = this.getWhereKeys(query[filter]);
            }
            else {
                throw new Error('invalid filter');
            }
        }
        return keys;
    };
    ValidateController.prototype.getOptionTransKeys = function (query) {
        var keys = [];
        if (query.TRANSFORMATIONS != undefined) {
            for (var filter in query.TRANSFORMATIONS) {
                if (this.isGroup(filter)) {
                    this.checkArray(query.TRANSFORMATIONS[filter], 'GROUP');
                    this.checkNonEmptyArr(query.TRANSFORMATIONS[filter], 'GROUP');
                    this.checkArrUnderScore(query.TRANSFORMATIONS[filter]);
                    keys = keys.concat(query.TRANSFORMATIONS[filter]);
                }
                else if (this.isApply(filter)) {
                    var applyKeys = [];
                    this.checkArray(query.TRANSFORMATIONS[filter], 'APPLY');
                    for (var _i = 0, _a = query.TRANSFORMATIONS[filter]; _i < _a.length; _i++) {
                        var applyObj = _a[_i];
                        if (typeof applyObj != 'object') {
                            throw new Error('invalid APPLY. Not containing objects');
                        }
                        if (Object.keys(applyObj).length != 1) {
                            throw new Error('invalid APPLYKEY. Must contain only 1 APPLYKEY');
                        }
                        var applyKey = Object.keys(applyObj)[0];
                        this.checkString(applyKey, 'APPLYKEY');
                        this.checkNoUnderScore(applyKey, 'APPLYKEY');
                        if (Object.keys(applyObj[applyKey]).length != 1) {
                            throw new Error('invalid APPLYKEY. Must contain only 1 APPLYTOKEN');
                        }
                        var validApplyToken = ['MAX', 'MIN', 'AVG', 'COUNT', 'SUM'];
                        var applyToken = Object.keys(applyObj[applyKey])[0];
                        this.checkStrUnderScore(applyObj[applyKey][applyToken]);
                        var numberKeys = ['courses_avg', 'courses_pass', 'courses_fail', 'courses_audit', 'courses_year', 'courses_size', 'rooms_lat', 'rooms_lon', 'rooms_seats'];
                        if (applyToken === 'MAX' || applyToken === 'MIN' || applyToken === 'AVG' || applyToken === 'SUM') {
                        }
                        if (applyKeys.indexOf(applyKey) >= 0) {
                            throw new Error('invalid APPLY. Must not contain duplicate apply keys.');
                        }
                        applyKeys.push(applyKey);
                        keys.push(applyKey);
                    }
                }
                else {
                    throw new Error('invalid TRANSFORMATIONS');
                }
            }
        }
        for (var filter in query.OPTIONS) {
            if (this.isColumns(filter)) {
                this.checkArray(query.OPTIONS.COLUMNS, 'COLUMNS');
                this.checkNonEmptyArr(query.OPTIONS.COLUMNS, 'COLUMNS');
                if (query.TRANSFORMATIONS != undefined) {
                    for (var _b = 0, _c = query.OPTIONS[filter]; _b < _c.length; _b++) {
                        var key = _c[_b];
                    }
                    keys = keys.concat(query.OPTIONS[filter]);
                }
                else {
                    this.checkArrUnderScore(query.OPTIONS[filter]);
                    keys = query.OPTIONS[filter];
                }
            }
            else if (this.isOrder(filter)) {
                var columns = query.OPTIONS["COLUMNS"];
                this.checkStringOrObj(query.OPTIONS[filter], 'ORDER');
                if (typeof query.OPTIONS[filter] == 'object') {
                    this.checkString(query.OPTIONS[filter]['dir'], 'ORDER.dir');
                    this.checkUpDown(query.OPTIONS[filter]['dir']);
                    this.checkArray(query.OPTIONS[filter]['keys'], 'OPTIONS');
                    this.checkNonEmptyArr(query.OPTIONS[filter]['keys'], 'OPTIONS');
                    for (var _d = 0, _e = query.OPTIONS[filter]['keys']; _d < _e.length; _d++) {
                        var key = _e[_d];
                        keys.push(key);
                    }
                }
                else {
                    this.checkString(query.OPTIONS[filter], 'ORDER');
                    keys.push(query.OPTIONS[filter]);
                }
            }
            else if (this.isForm(filter)) {
                this.checkTable(query.OPTIONS[filter]);
            }
            else {
                throw new Error('invalid OPTIONS');
            }
        }
        return keys;
    };
    ValidateController.prototype.checkArrUnderScore = function (arr) {
        for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
            var key = arr_1[_i];
            if (!key.match(/\w+_\w+/)) {
                throw new Error('key in COLUMNS is not valid. Must contain an underscore');
            }
        }
    };
    ValidateController.prototype.checkStrUnderScore = function (str) {
        if (!str.match(/\w+_\w+/)) {
            throw new Error(str + ' is not valid. Must contain an underscore');
        }
    };
    ValidateController.prototype.checkArray = function (arr, queryKey) {
        if (arr.constructor != [].constructor) {
            throw new Error('invalid ' + queryKey + '. Must be an array');
        }
    };
    ValidateController.prototype.checkNonEmptyArr = function (arr, queryKey) {
        if (arr.length < 1) {
            throw new Error('invalid ' + queryKey + '. Must specify at least 1 key');
        }
    };
    ValidateController.prototype.checkString = function (str, queryKey) {
        if (typeof str != 'string') {
            throw new Error('invalid ' + queryKey + '. Must be a string');
        }
    };
    ValidateController.prototype.checkNoUnderScore = function (str, queryKey) {
        if (str.match(/\w*_\w*/)) {
            throw new Error('invalid ' + queryKey + '. Cannot contain underscore');
        }
    };
    ValidateController.prototype.checkUpDown = function (dir) {
        if (['UP', 'DOWN'].indexOf(dir) < 0) {
            throw new Error('invalid OPTIONS. dir must be UP or DOWN');
        }
    };
    ValidateController.prototype.checkTable = function (form) {
        if (form != 'TABLE') {
            throw new Error('invalid FORM. Must be TABLE.');
        }
    };
    ValidateController.prototype.checkStringOrObj = function (sth, queryKey) {
        if (typeof sth != 'string' && (typeof sth != 'object')) {
            throw new Error('invalid ' + queryKey + '. Must be a string or object');
        }
    };
    ValidateController.prototype.isLogicComp = function (filter) {
        return filter === 'AND' || filter === 'OR';
    };
    ValidateController.prototype.isMComp = function (filter) {
        return filter === 'LT' || filter === 'GT' || filter === 'EQ';
    };
    ValidateController.prototype.isSComp = function (filter) {
        return filter === 'IS';
    };
    ValidateController.prototype.isNegation = function (filter) {
        return filter === 'NOT';
    };
    ValidateController.prototype.isColumns = function (option) {
        return option === 'COLUMNS';
    };
    ValidateController.prototype.isOrder = function (option) {
        return option === 'ORDER';
    };
    ValidateController.prototype.isGroup = function (option) {
        return option === 'GROUP';
    };
    ValidateController.prototype.isApply = function (option) {
        return option === 'APPLY';
    };
    ValidateController.prototype.isForm = function (option) {
        return option === 'FORM';
    };
    return ValidateController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ValidateController;
//# sourceMappingURL=ValidateController.js.map