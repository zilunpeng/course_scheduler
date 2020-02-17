export default class ValidateController {

    constructor() {
    }

    /**
     * @param the WHERE part of query
     * @returns {Array<string>}: return an array of keys in the WHERE part of the query. Throw an error if query is invalid
     */
    getWhereKeys(query: any): Array<any> {
        let keys: Array<string> = [];
        for (let filter in query) {
            if (this.isLogicComp(filter)) {
                if (Object.keys(query[filter]).length < 1) {
                    throw new Error('invalid LOGICCOMPARISON. Must contain at least 1 FILTER');
                }
                for (let subQueryBody of query[filter]) {
                    keys = keys.concat(this.getWhereKeys(subQueryBody));
                }
            } else if (this.isMComp(filter)) {
                if (Object.keys(query[filter]).length > 1) {
                    throw new Error('invalid MCOMPARISON. Cannot contain more than 1 MCOMPARATOR');
                }
                let numberKeys = ['courses_avg', 'courses_pass', 'courses_size', 'courses_fail', 'courses_audit', 'courses_year', 'rooms_lat', 'rooms_lon', 'rooms_seats'];
                for (let mcomp in query[filter]) {
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
            } else if (this.isSComp(filter)) {
                if (Object.keys(query[filter]).length > 1) {
                    throw new Error('invalid SCOMPARISON. Cannot contain more than 1 IS');
                }
                for (let scomp in query[filter]) {
                    if (typeof query[filter][scomp] != 'string') {
                        throw new Error('invalid SCOMPARISON. Must compare with a string');
                    }
                    if (scomp.match(/.+_.+/) == null) {
                        throw new Error('invalid key.');
                    }
                    keys.push(scomp);
                }
            } else if (this.isNegation(filter)) {
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
    }

    /**
     * @param options. The OPTIONS and TRANSFORMATIONS part of the query
     * return an array of keys in the OPTIONS and TRANSFORMATIONS part of the query
     */
    getOptionTransKeys(query: any): Array<string> {
        let keys: Array<string> = [];

        if (query.TRANSFORMATIONS != undefined) {
            for (let filter in query.TRANSFORMATIONS) {
                if (this.isGroup(filter)) {

                    this.checkArray(query.TRANSFORMATIONS[filter], 'GROUP');
                    this.checkNonEmptyArr(query.TRANSFORMATIONS[filter], 'GROUP');
                    this.checkArrUnderScore(query.TRANSFORMATIONS[filter]);

                    keys = keys.concat(query.TRANSFORMATIONS[filter]);

                } else if (this.isApply(filter)) {

                    let applyKeys: any = [];
                    this.checkArray(query.TRANSFORMATIONS[filter], 'APPLY');

                    for (let applyObj of query.TRANSFORMATIONS[filter]) {

                        if (typeof applyObj != 'object') {
                            throw new Error('invalid APPLY. Not containing objects');
                        }

                        if (Object.keys(applyObj).length != 1) {
                            throw new Error('invalid APPLYKEY. Must contain only 1 APPLYKEY');
                        }

                        let applyKey: any = Object.keys(applyObj)[0];
                        this.checkString(applyKey, 'APPLYKEY');
                        this.checkNoUnderScore(applyKey, 'APPLYKEY');

                        if (Object.keys(applyObj[applyKey]).length != 1) {
                            throw new Error('invalid APPLYKEY. Must contain only 1 APPLYTOKEN');
                        }

                        let validApplyToken = ['MAX', 'MIN', 'AVG', 'COUNT', 'SUM'];
                        let applyToken: string = Object.keys(applyObj[applyKey])[0];
                        //this.checkExist(validApplyToken, applyToken, 'valid apply tokens', 'APPLY TOKEN');

                        this.checkStrUnderScore(applyObj[applyKey][applyToken]);
                        let numberKeys = ['courses_avg', 'courses_pass', 'courses_fail', 'courses_audit', 'courses_year', 'courses_size', 'rooms_lat', 'rooms_lon', 'rooms_seats'];
                        if (applyToken === 'MAX' || applyToken === 'MIN' || applyToken === 'AVG' || applyToken === 'SUM') {
                            //this.checkExist(numberKeys, applyObj[applyKey][applyToken], "valid number keys", 'key in APPLY TOKEN')
                        }

                        if (applyKeys.indexOf(applyKey) >= 0) {
                            throw new Error('invalid APPLY. Must not contain duplicate apply keys.');
                        }

                        applyKeys.push(applyKey);
                        keys.push(applyKey);
                    }
                } else {
                    throw new Error('invalid TRANSFORMATIONS')
                }
            }
        }

        for (let filter in query.OPTIONS) {

            if (this.isColumns(filter)) {
                this.checkArray(query.OPTIONS.COLUMNS, 'COLUMNS');
                this.checkNonEmptyArr(query.OPTIONS.COLUMNS, 'COLUMNS');

                if (query.TRANSFORMATIONS != undefined) {
                    for (let key of query.OPTIONS[filter]) {
                        //this.checkExist(keys, key, 'TRANSFORMATIONS', 'key in Columns');
                    }
                    keys = keys.concat(query.OPTIONS[filter]);
                } else {
                    this.checkArrUnderScore(query.OPTIONS[filter]);
                    keys = query.OPTIONS[filter];
                }

            } else if (this.isOrder(filter)) {
                let columns: Array<string> = query.OPTIONS["COLUMNS"];
                this.checkStringOrObj(query.OPTIONS[filter], 'ORDER');

                if (typeof query.OPTIONS[filter] == 'object') {

                    this.checkString(query.OPTIONS[filter]['dir'], 'ORDER.dir');
                    this.checkUpDown(query.OPTIONS[filter]['dir']);

                    this.checkArray(query.OPTIONS[filter]['keys'], 'OPTIONS');
                    this.checkNonEmptyArr(query.OPTIONS[filter]['keys'], 'OPTIONS');

                    for (let key of query.OPTIONS[filter]['keys']) {
                        //this.checkExist(columns, key, 'COLUMN', 'ORDER');
                        keys.push(key);
                    }

                } else {

                    this.checkString(query.OPTIONS[filter], 'ORDER');
                    //this.checkExist(columns, query.OPTIONS[filter], 'COLUMN', 'ORDER');

                    keys.push(query.OPTIONS[filter]);

                }
            } else if (this.isForm(filter)) {
                this.checkTable(query.OPTIONS[filter]);
            } else {
                throw new Error('invalid OPTIONS');
            }
        }
        return keys;
    }

    /**
     * @param container. An array of things. e.g. columns
     * @param containee. Something that must be contained in container. e.g. order
     * @param containerName. key in Query. e.g. COLUMN
     * @param containeeName. key in Query. e.g. ORDER
     */
    // checkExist(container: Array<any>, containee: any, containerName: string, containeeName: string) {
    //     if (container.indexOf(containee) < 0) {
    //         throw new Error('invalid ' + containeeName + '. Not in ' + containerName);
    //     }
    // }

    /**
     * @param arr. An array that must contain underscores in every element
     * throw an error if any element does not contain an underscore
     */
    checkArrUnderScore(arr: Array<string>): void {
        for (let key of arr) {
            if (!key.match(/\w+_\w+/)) {
                throw new Error('key in COLUMNS is not valid. Must contain an underscore');
            }
        }
    }

    /**
     * @param str. An string that must contain underscore
     * throw an error if any element does not contain an underscore
     */
    checkStrUnderScore(str: string): void {
        if (!str.match(/\w+_\w+/)) {
            throw new Error(str + ' is not valid. Must contain an underscore');
        }
    }

    /**
     * @param arr: part of query that must be an array
     * @param queryKey: key in query. e.g. GROUP
     * throw an error if arr is not an array
     */
    checkArray(arr: Array<any>, queryKey: string): void {
        if (arr.constructor != [].constructor) {
            throw new Error('invalid ' + queryKey + '. Must be an array');
        }
    }

    /**
     * @param arr: part of query that cannot be empty
     * @param queryKey: key in query. e.g. OPTIONS
     * throw an error if arr is empty
     */
    checkNonEmptyArr(arr: Array<any>, queryKey: string): void {
        if (arr.length < 1) {
            throw new Error('invalid ' + queryKey + '. Must specify at least 1 key')
        }
    }

    /**
     * @param str. Part of query that must be a string
     * @param queryKey. key in query. e.g. GROUP
     * throw an error if str is not a string
     */
    checkString(str: any, queryKey: string) {
        if (typeof str != 'string') {
            throw new Error('invalid ' + queryKey + '. Must be a string');
        }
    }

    /**
     * @param str. Part of query that cannot contain an underscore
     * @param queryKey. Key in query. e.g. GROUP
     * throw an error if str contains an underscore
     */
    checkNoUnderScore(str: string, queryKey: string) {
        if (str.match(/\w*_\w*/)) {
            throw new Error('invalid ' + queryKey + '. Cannot contain underscore')
        }
    }

    /**
     * @param dir. Dir in APPLY
     * throw an error if dir is either UP or DOWN
     */
    checkUpDown(dir: string) {
        if (['UP', 'DOWN'].indexOf(dir) < 0) {
            throw new Error('invalid OPTIONS. dir must be UP or DOWN')
        }
    }

    /**
     * @param form. Form in OPTIONS
     * throw an error if form is not TABLE
     */
    checkTable(form: string) {
        if (form != 'TABLE') {
            throw new Error('invalid FORM. Must be TABLE.')
        }
    }

    /**
     * @param sth. Some part of query that must be a string or object
     * @param queryKey. Key in query
     * throw an error if sth is either string or object.
     */
    checkStringOrObj(sth: any, queryKey: string) {
        if (typeof sth != 'string' && (typeof sth != 'object')) {
            throw new Error('invalid ' + queryKey + '. Must be a string or object');
        }
    }

    //keep them here for now
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
}