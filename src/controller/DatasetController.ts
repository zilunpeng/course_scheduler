import {InsightResponse} from "./IInsightFacade";

/**
 * Interface of a file
 */
export interface IDataFile {
    fileName: string
    content: any
}

/**
 * Interface of a geoResponse
 */
export interface GeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

/**
 * Interface of database.
 * A database consists of multiple datasets, where each dataset is uniquely identified by its id.
 */
export interface IDatabase {
    [id: string]: Array<IDataFile>;
}

export default class DatasetController {

    static database: IDatabase = {};

    constructor() {

    }

    addDataset(id: string, content: string): Promise<InsightResponse> {
        var jszip = require("jszip");
        var fs = require("fs");
        var that = this;
        let files: Array<IDataFile> = [];
        let buildingDetails:any = {};
        let cacheDir: string = './src/cache/';
        return new Promise(function (fulfill, reject) {
            if (id === '') {
                reject({code: 400, body: {"error": 'id is empty.'}});
            }

            jszip.loadAsync(content, {base64: true}).then(function (zip: any) {
                let filePromises: any[] = [];
                for (let file in zip.files) {
                    if (!zip.files[file].dir && !that.isFileDSStore(file)) {
                        files.push({fileName: file, content: {}});
                        filePromises.push(zip.files[file].async("string"));
                    }
                }
                return Promise.all(filePromises)
            }).then(function (response: any) {
                if (response.length == 0) {
                    throw new Error ('zip is not valid');
                }

                for (let i in response) {
                    if (id === 'courses') {
                        var content = JSON.parse(response[+i]);
                        if (that.isZipValid(content)) {
                            files[+i].content = content;
                        } else {
                            throw new Error('zip is not valid');
                        }
                    } else if (id === 'rooms') {
                        files[+i].content = response[+i];
                    } else {
                        throw new Error ('id is not valid') //??? Should an error be thrown here ????
                    }
                }

                if (id === 'courses') {
                    return new Promise(function(fulfill,reject){
                        fulfill(files);
                    })
                } else if (id === 'rooms') {
                    let indexHtmPos = that.getIndexHtmlPos(files);
                    if (indexHtmPos >= 0) {
                        return that.parseIndex(response[indexHtmPos], files);
                    } else {
                        throw new Error ('no index.htm');
                    }
                }
            }).then(function (response: any) {

                if (id === 'courses') {
                    return new Promise(function(fulfill,reject){
                        fulfill(files);
                    })
                } else if (id === 'rooms') {
                    // return that.getRoomDetails(response);
                    buildingDetails = response;
                    let latLongPromises:Array<any> = [];
                    for (let buildingCode in buildingDetails) {
                        latLongPromises.push(that.getLatLong(buildingDetails[buildingCode]['address']));
                    }
                    return Promise.all(latLongPromises);
                }

            }). then(function(response:any) {

                if (id === 'courses') {
                    return new Promise(function(fulfill,reject){
                        fulfill(files);
                    })
                } else if (id == 'rooms') {
                    buildingDetails = that.addLatLong(buildingDetails, response);
                }

                let roomDetailPromises:Array<any> = [];

                for (let buildingCode in buildingDetails) {
                    roomDetailPromises.push(that.parseRoomHtml(buildingDetails[buildingCode], buildingCode));
                }

                return Promise.all(roomDetailPromises);

            }).then(function(response:any) {

                DatasetController.database[id] = response;

                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir);
                    fs.writeFileSync(cacheDir + id + '.txt', JSON.stringify(response), {flag: 'w+'});
                    fulfill({code: 204, body: {}});
                } else {
                    if (fs.existsSync(cacheDir + id + '.txt')) {
                        fs.writeFileSync(cacheDir + id + '.txt', JSON.stringify(response), {flag: 'w+'});
                        fulfill({code: 201, body: {}});
                    } else {
                        fs.writeFileSync(cacheDir + id + '.txt', JSON.stringify(response), {flag: 'w+'});
                        fulfill({code: 204, body: {}});
                    }
                }
            })
                .catch(function (err: any) {
                    reject({code: 400, body: {"error": err.message}});
                });
        })
    }

    /**
     *
     * @param id: unique idenfier of a dataset to be deleted
     * @returns {Promise<T>}
     * removeDataset checks if the corresponding dataset given id is existed in memory and cache.
     * It returns 204 if successfully deletes a dataset
     * It returns 404 if delete was not successful
     *
     */
    removeDataset(id: string): Promise<InsightResponse> {
        var fs = require("fs");
        let cacheDir: string = './src/cache/';
        return new Promise(function (fulfill, reject) {
            if (DatasetController.database.hasOwnProperty(id) && fs.existsSync(cacheDir + id + '.txt')) {
                delete DatasetController.database[id];
                fs.unlinkSync(cacheDir + id + '.txt');
                fulfill({code: 204, body: {}});
            } else {
                reject({code: 404, body: {}});
            }
        });
    }

    /**
     * @returns {IDatabase}
     * getDataset returns the static variable of DatasetController
     *
     */
    getDatasets(): any {
        return DatasetController.database;
    }

    /**
     * @param indexHTML: index.htm file as a string
     * @param files: an array of objects. The key of each object is the path of a html file. The value is the html file as a string.
     * @returns {Promise<T>}
     */
    parseIndex(indexHTML: string, files: Array<any>): Promise<any> {
        let indexContent: any = {};
        let buildingDetail:any = {};
        var that = this;
        var parse5 = require("parse5");
        var parser = new parse5.SAXParser();
        var stream = require('stream');
        var s = new stream.Readable();
        let foundBuildCode: boolean = false;
        let foundBuildingImg: boolean = false;
        let foundBuildingAddr: boolean = false;
        let foundBuildingFullname: boolean = false;
        let buildingCode: string = "";
        s.push(indexHTML);
        s.push(null);
        s.pipe(parser);

        parser.on('startTag', function (name: any, attrs: any, selfClosing: any, location: any) {
            if (attrs.length > 0) {
                if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-building-code' && foundBuildingImg) {
                    foundBuildCode = true;
                } else if (attrs.length == 2 && attrs[0].name === 'href' && attrs[1].name === 'title' && attrs[1].value === 'Building Details and Map' && foundBuildingImg) {
                    buildingDetail['html path'] = attrs[0].value;
                    foundBuildingFullname = true;
                } else if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-building-address' && foundBuildingImg) {
                    foundBuildingAddr = true;
                } else if (attrs.length == 4 && attrs[0].name === 'src' && attrs[1].name === 'width' && attrs[2].name === 'height' && attrs[3].name === 'alt' && (attrs[3].value === 'building image' || attrs[3].value === 'Building image')) {
                    foundBuildingImg = true;
                }
            }
        })

        parser.on('text', function (name: any, attrs: any, selfClosing: any, location: any) {
            name = name.replace(/^\s+/g,'');
            name = name.replace(/\s+$/g,'');
            if (foundBuildCode) {
                buildingCode = name;
                foundBuildCode = false;
            } else if (foundBuildingAddr) {
                buildingDetail['address'] = name;
                indexContent[buildingCode] = buildingDetail;
                buildingDetail = {}; //if not adding this line, next building detail will overwrite the all previous ones in indexContent, why?
                foundBuildingImg = false;
                foundBuildingAddr = false;
            } else if (foundBuildingFullname) {
                buildingDetail['building full name'] = name;
                foundBuildingFullname = false;
            }
        })

        return new Promise(function (fulfill, reject) {
            parser.on('end', function () {
                var buildingHtmls = that.getBuildingHtml(indexContent,files);
                fulfill(buildingHtmls);
            })
        });
    }

    /**
     * @param buildingDetail: an object which contains building's full name,
     * the html file which describes the building's details,
     * building address, the relative path to the building's html and lat/lon of the building
     * @param buildingCode: abbreviation of the building name
     * @returns {Promise<T>} //TODO
     */
    parseRoomHtml(buildingDetail:any, buildingCode:string):Promise<any> {
        var that = this;
        var parse5 = require("parse5");
        var parser = new parse5.SAXParser();
        var stream = require('stream');
        var s = new stream.Readable();
        let roomDetail:any = {};
        let roomDetails:Array<any> = [];
        let foundRoomDetail:boolean = false;
        let foundRoomNumber:boolean = false;
        let foundRoomCapacity:boolean = false;
        let foundFurnitureType:boolean = false;
        let foundRoomType:boolean = false;

        var temp = buildingDetail['building html content'];
        s.push(buildingDetail['building html content']);
        s.push(null);
        s.pipe(parser);

        parser.on('startTag',function(name: any, attrs: any, selfClosing: any, location: any) {
            if (attrs.length > 0) {
                if (name === 'a' && attrs.length == 2 && attrs[0].name === 'href' && attrs[1].name === 'title' && attrs[1].value === 'Room Details') {
                    roomDetail['rooms_href'] = attrs[0].value;
                    foundRoomDetail = true;
                    foundRoomNumber = true;
                } else if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-room-capacity' && foundRoomDetail) {
                    foundRoomCapacity = true;
                } else if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-room-furniture' && foundRoomDetail) {
                    foundFurnitureType = true;
                } else if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-room-type' && foundRoomDetail) {
                    foundRoomType = true;
                }
            }
        });

        parser.on('text',function(name: any, attrs: any, selfClosing: any, location: any) {
            name = name.replace(/^\s+/g,'');
            name = name.replace(/\s+$/g,'');
            if (foundRoomDetail && foundRoomNumber) {
                roomDetail['rooms_number'] = name;
                foundRoomNumber = false;
            } else if (foundRoomCapacity && foundRoomDetail) {
                roomDetail['rooms_seats'] = +name;
                foundRoomCapacity = false;
            } else if (foundFurnitureType && foundRoomDetail) {
                roomDetail['rooms_furniture'] = name;
                foundFurnitureType = false;
            } else if (foundRoomType && foundRoomDetail) {
                roomDetail['rooms_type'] = name;
                roomDetail['rooms_shortname'] = buildingCode;
                roomDetail['rooms_fullname'] = buildingDetail['building full name'];
                roomDetail['rooms_name'] = buildingCode + '_' + roomDetail['rooms_number'];
                roomDetail['rooms_address'] = buildingDetail['address'];
                roomDetail['rooms_lat'] = buildingDetail['lat'];
                roomDetail['rooms_lon'] = buildingDetail['lon'];
                roomDetails.push(roomDetail);
                roomDetail = {};
                foundRoomType = false;
                foundRoomDetail = false;
            }
        })

        return new Promise(function(fulfill,reject) {
            parser.on('end', function () {
                fulfill(roomDetails);
            })
        });
    }

    /**
     *
     * validSection is the definition of a valid section object.
     * Keys of validSection are required keys of a valid section object.
     * Values corresponding to each key are the correct types of values in a valid section object
     * e.g. "Title":"string". In a valid section object, "Title" must exist as a key,
     * and the value corresponding to "Title" must have type string
     */
    static validSection: any = {
        "tier_eighty_five": "number",
        "tier_ninety": "number",
        "Title": "string",
        "Section": "string",
        "Detail": "string",
        "tier_seventy_two": "number",
        "Other": "number",
        "Low": "number",
        "tier_sixty_four": "number",
        "id": "number",
        "tier_sixty_eight": "number",
        "tier_zero": "number",
        "tier_seventy_six": "number",
        "tier_thirty": "number",
        "tier_fifty": "number",
        "Professor": "string",
        "Audit": "number",
        "tier_g_fifty": "number",
        "tier_forty": "number",
        "Withdrew": "number",
        "Year": "string",
        "tier_twenty": "number",
        "Stddev": "number",
        "Enrolled": "number",
        "tier_fifty_five": "number",
        "tier_eighty": "number",
        "tier_sixty": "number",
        "tier_ten": "number",
        "High": "number",
        "Course": "string",
        "Session": "string",
        "Pass": "number",
        "Fail": "number",
        "Avg": "number",
        "Campus": "string",
        "Subject": "string"
    }

    /**
     *
     * @param content: an array of sections that are under the same course.
     * @returns {boolean}
     * return true if every section in @param content is a valid section
     * return false otherwise
     *
     */
    isZipValid(content: any): boolean {
        var arrayConstructor = [].constructor;
        if (content.result == undefined || content.rank == "undefined") {
            return false;
        }
        else if (content.result.constructor === arrayConstructor && content.result.length == 0 && typeof content.rank == 'number') {
            return true;
        }
        else if (content.result.constructor === arrayConstructor && content.result.length > 0 && typeof content.rank == 'number') {
            for (let section of content.result) {
                for (let key in DatasetController.validSection) {
                    if (!(key in section)) {
                        return false
                    } else if (typeof section[key] !== DatasetController.validSection[key]) {
                        return false
                    }
                }
            }
            return true
        } else {
            return false;
        }
    }

    /**
     * @param files: an array of file objects. each object has fileName and content
     * Return the index of index.htm. Return -1 if index.htm is not present
     */
    getIndexHtmlPos(files:Array<any>):number {
        for (let fileInd in files) {
            if (files[fileInd]['fileName'] === 'index.htm') {
                return +fileInd;
            }
        }
        return -1;
    }
    
    /**
     * @param filePath
     * Return true if filePath contains .DS_Store in the end. Return false otherwise
     */
    isFileDSStore(filePath: string):boolean {
        return filePath.split('/').pop() === '.DS_Store';
    }

    /**
     * @param indexContent: an object. Each key is a building code. Each value is an object which contains building address and the relative path to the building's html
     * @param files: An array of objects. The key of each object is the relative path to the building's html. Value is the html
     * @returns buildingDetails: an object, where each key is the building code,
     * and each value is an object which contains building's full name,
     * the html file which describes the building's details,
     * building address and the relative path to the building's html
     */
    getBuildingHtml(indexContent:any, files:Array<any>):any {
        let buildingDetails:any = {};
        let buildingDetail:any = {};
        for (let buildingCode in indexContent) {
            var buildingHtmlPath = indexContent[buildingCode]['html path'];
            buildingHtmlPath = buildingHtmlPath.replace(/^.\//g,'');
            for (let file of files) {
                if (file.fileName === buildingHtmlPath) {
                    buildingDetail['building full name'] = indexContent[buildingCode]['building full name'];
                    buildingDetail['building html content'] = file.content;
                    buildingDetail['address'] = indexContent[buildingCode]['address'];
                    buildingDetail['html path'] = buildingHtmlPath;
                    buildingDetails[buildingCode] = buildingDetail;
                    buildingDetail = {};
                }
            }
        }
        return buildingDetails;
    }

    /**
     * @param address
     * Return a promise: fulfill if response code = 200. Reject otherwise
     */
    getLatLong(address:string):Promise<GeoResponse> {
        return new Promise(function(fulfill,reject) {
            var http = require("http");
            address = address.replace(/\s/g, '%20');
            let geoResponse:any = {};
            http.get('http://skaha.cs.ubc.ca:11316/api/v1/team31/'+address,function(res:any) {
                res.setEncoding('utf-8');
                res.on('data',function(res:any) {
                        geoResponse = JSON.parse(res);
                });

                res.on('end',function() {
                    fulfill(geoResponse);
                });
            }).on('error',function(err:any) {
                geoResponse['error'] = err;
                reject(geoResponse);
            })
        });
    }

    /**
     * @param buildingDetails: an object, where each key is the building code,
     * and each value is an object which contains building's full name,
     * the html file which describes the building's details,
     * building address and the relative path to the building's html
     *
     * @param latLongs: an array of lat and lon
     * @returns {any}L an updated buildingDetails with lat and lon
     */
    addLatLong(buildingDetails:any,latLongs:Array<any>):any {
        var i = 0;
        for (let buildingCode in buildingDetails) {
            buildingDetails[buildingCode]['lat'] = latLongs[i]['lat'];
            buildingDetails[buildingCode]['lon'] = latLongs[i]['lon'];
            i = i + 1;
        }
        return buildingDetails;
    }
}