"use strict";
var DatasetController = (function () {
    function DatasetController() {
    }
    DatasetController.prototype.addDataset = function (id, content) {
        var jszip = require("jszip");
        var fs = require("fs");
        var that = this;
        var files = [];
        var buildingDetails = {};
        var cacheDir = './src/cache/';
        return new Promise(function (fulfill, reject) {
            if (id === '') {
                reject({ code: 400, body: { "error": 'id is empty.' } });
            }
            jszip.loadAsync(content, { base64: true }).then(function (zip) {
                var filePromises = [];
                for (var file in zip.files) {
                    if (!zip.files[file].dir && !that.isFileDSStore(file)) {
                        files.push({ fileName: file, content: {} });
                        filePromises.push(zip.files[file].async("string"));
                    }
                }
                return Promise.all(filePromises);
            }).then(function (response) {
                if (response.length == 0) {
                    throw new Error('zip is not valid');
                }
                for (var i in response) {
                    if (id === 'courses') {
                        var content = JSON.parse(response[+i]);
                        if (that.isZipValid(content)) {
                            files[+i].content = content;
                        }
                        else {
                            throw new Error('zip is not valid');
                        }
                    }
                    else if (id === 'rooms') {
                        files[+i].content = response[+i];
                    }
                    else {
                        throw new Error('id is not valid');
                    }
                }
                if (id === 'courses') {
                    return new Promise(function (fulfill, reject) {
                        fulfill(files);
                    });
                }
                else if (id === 'rooms') {
                    var indexHtmPos = that.getIndexHtmlPos(files);
                    if (indexHtmPos >= 0) {
                        return that.parseIndex(response[indexHtmPos], files);
                    }
                    else {
                        throw new Error('no index.htm');
                    }
                }
            }).then(function (response) {
                if (id === 'courses') {
                    return new Promise(function (fulfill, reject) {
                        fulfill(files);
                    });
                }
                else if (id === 'rooms') {
                    buildingDetails = response;
                    var latLongPromises = [];
                    for (var buildingCode in buildingDetails) {
                        latLongPromises.push(that.getLatLong(buildingDetails[buildingCode]['address']));
                    }
                    return Promise.all(latLongPromises);
                }
            }).then(function (response) {
                if (id === 'courses') {
                    return new Promise(function (fulfill, reject) {
                        fulfill(files);
                    });
                }
                else if (id == 'rooms') {
                    buildingDetails = that.addLatLong(buildingDetails, response);
                }
                var roomDetailPromises = [];
                for (var buildingCode in buildingDetails) {
                    roomDetailPromises.push(that.parseRoomHtml(buildingDetails[buildingCode], buildingCode));
                }
                return Promise.all(roomDetailPromises);
            }).then(function (response) {
                DatasetController.database[id] = response;
                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir);
                    fs.writeFileSync(cacheDir + id + '.txt', JSON.stringify(response), { flag: 'w+' });
                    fulfill({ code: 204, body: {} });
                }
                else {
                    if (fs.existsSync(cacheDir + id + '.txt')) {
                        fs.writeFileSync(cacheDir + id + '.txt', JSON.stringify(response), { flag: 'w+' });
                        fulfill({ code: 201, body: {} });
                    }
                    else {
                        fs.writeFileSync(cacheDir + id + '.txt', JSON.stringify(response), { flag: 'w+' });
                        fulfill({ code: 204, body: {} });
                    }
                }
            })
                .catch(function (err) {
                reject({ code: 400, body: { "error": err.message } });
            });
        });
    };
    DatasetController.prototype.removeDataset = function (id) {
        var fs = require("fs");
        var cacheDir = './src/cache/';
        return new Promise(function (fulfill, reject) {
            if (DatasetController.database.hasOwnProperty(id) && fs.existsSync(cacheDir + id + '.txt')) {
                delete DatasetController.database[id];
                fs.unlinkSync(cacheDir + id + '.txt');
                fulfill({ code: 204, body: {} });
            }
            else {
                reject({ code: 404, body: {} });
            }
        });
    };
    DatasetController.prototype.getDatasets = function () {
        return DatasetController.database;
    };
    DatasetController.prototype.parseIndex = function (indexHTML, files) {
        var indexContent = {};
        var buildingDetail = {};
        var that = this;
        var parse5 = require("parse5");
        var parser = new parse5.SAXParser();
        var stream = require('stream');
        var s = new stream.Readable();
        var foundBuildCode = false;
        var foundBuildingImg = false;
        var foundBuildingAddr = false;
        var foundBuildingFullname = false;
        var buildingCode = "";
        s.push(indexHTML);
        s.push(null);
        s.pipe(parser);
        parser.on('startTag', function (name, attrs, selfClosing, location) {
            if (attrs.length > 0) {
                if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-building-code' && foundBuildingImg) {
                    foundBuildCode = true;
                }
                else if (attrs.length == 2 && attrs[0].name === 'href' && attrs[1].name === 'title' && attrs[1].value === 'Building Details and Map' && foundBuildingImg) {
                    buildingDetail['html path'] = attrs[0].value;
                    foundBuildingFullname = true;
                }
                else if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-building-address' && foundBuildingImg) {
                    foundBuildingAddr = true;
                }
                else if (attrs.length == 4 && attrs[0].name === 'src' && attrs[1].name === 'width' && attrs[2].name === 'height' && attrs[3].name === 'alt' && (attrs[3].value === 'building image' || attrs[3].value === 'Building image')) {
                    foundBuildingImg = true;
                }
            }
        });
        parser.on('text', function (name, attrs, selfClosing, location) {
            name = name.replace(/^\s+/g, '');
            name = name.replace(/\s+$/g, '');
            if (foundBuildCode) {
                buildingCode = name;
                foundBuildCode = false;
            }
            else if (foundBuildingAddr) {
                buildingDetail['address'] = name;
                indexContent[buildingCode] = buildingDetail;
                buildingDetail = {};
                foundBuildingImg = false;
                foundBuildingAddr = false;
            }
            else if (foundBuildingFullname) {
                buildingDetail['building full name'] = name;
                foundBuildingFullname = false;
            }
        });
        return new Promise(function (fulfill, reject) {
            parser.on('end', function () {
                var buildingHtmls = that.getBuildingHtml(indexContent, files);
                fulfill(buildingHtmls);
            });
        });
    };
    DatasetController.prototype.parseRoomHtml = function (buildingDetail, buildingCode) {
        var that = this;
        var parse5 = require("parse5");
        var parser = new parse5.SAXParser();
        var stream = require('stream');
        var s = new stream.Readable();
        var roomDetail = {};
        var roomDetails = [];
        var foundRoomDetail = false;
        var foundRoomNumber = false;
        var foundRoomCapacity = false;
        var foundFurnitureType = false;
        var foundRoomType = false;
        var temp = buildingDetail['building html content'];
        s.push(buildingDetail['building html content']);
        s.push(null);
        s.pipe(parser);
        parser.on('startTag', function (name, attrs, selfClosing, location) {
            if (attrs.length > 0) {
                if (name === 'a' && attrs.length == 2 && attrs[0].name === 'href' && attrs[1].name === 'title' && attrs[1].value === 'Room Details') {
                    roomDetail['rooms_href'] = attrs[0].value;
                    foundRoomDetail = true;
                    foundRoomNumber = true;
                }
                else if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-room-capacity' && foundRoomDetail) {
                    foundRoomCapacity = true;
                }
                else if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-room-furniture' && foundRoomDetail) {
                    foundFurnitureType = true;
                }
                else if (attrs.length == 1 && attrs[0].name === 'class' && attrs[0].value === 'views-field views-field-field-room-type' && foundRoomDetail) {
                    foundRoomType = true;
                }
            }
        });
        parser.on('text', function (name, attrs, selfClosing, location) {
            name = name.replace(/^\s+/g, '');
            name = name.replace(/\s+$/g, '');
            if (foundRoomDetail && foundRoomNumber) {
                roomDetail['rooms_number'] = name;
                foundRoomNumber = false;
            }
            else if (foundRoomCapacity && foundRoomDetail) {
                roomDetail['rooms_seats'] = +name;
                foundRoomCapacity = false;
            }
            else if (foundFurnitureType && foundRoomDetail) {
                roomDetail['rooms_furniture'] = name;
                foundFurnitureType = false;
            }
            else if (foundRoomType && foundRoomDetail) {
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
        });
        return new Promise(function (fulfill, reject) {
            parser.on('end', function () {
                fulfill(roomDetails);
            });
        });
    };
    DatasetController.prototype.isZipValid = function (content) {
        var arrayConstructor = [].constructor;
        if (content.result == undefined || content.rank == "undefined") {
            return false;
        }
        else if (content.result.constructor === arrayConstructor && content.result.length == 0 && typeof content.rank == 'number') {
            return true;
        }
        else if (content.result.constructor === arrayConstructor && content.result.length > 0 && typeof content.rank == 'number') {
            for (var _i = 0, _a = content.result; _i < _a.length; _i++) {
                var section = _a[_i];
                for (var key in DatasetController.validSection) {
                    if (!(key in section)) {
                        return false;
                    }
                    else if (typeof section[key] !== DatasetController.validSection[key]) {
                        return false;
                    }
                }
            }
            return true;
        }
        else {
            return false;
        }
    };
    DatasetController.prototype.getIndexHtmlPos = function (files) {
        for (var fileInd in files) {
            if (files[fileInd]['fileName'] === 'index.htm') {
                return +fileInd;
            }
        }
        return -1;
    };
    DatasetController.prototype.isFileDSStore = function (filePath) {
        return filePath.split('/').pop() === '.DS_Store';
    };
    DatasetController.prototype.getBuildingHtml = function (indexContent, files) {
        var buildingDetails = {};
        var buildingDetail = {};
        for (var buildingCode in indexContent) {
            var buildingHtmlPath = indexContent[buildingCode]['html path'];
            buildingHtmlPath = buildingHtmlPath.replace(/^.\//g, '');
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
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
    };
    DatasetController.prototype.getLatLong = function (address) {
        return new Promise(function (fulfill, reject) {
            var http = require("http");
            address = address.replace(/\s/g, '%20');
            var geoResponse = {};
            http.get('http://skaha.cs.ubc.ca:11316/api/v1/team31/' + address, function (res) {
                res.setEncoding('utf-8');
                res.on('data', function (res) {
                    geoResponse = JSON.parse(res);
                });
                res.on('end', function () {
                    fulfill(geoResponse);
                });
            }).on('error', function (err) {
                geoResponse['error'] = err;
                reject(geoResponse);
            });
        });
    };
    DatasetController.prototype.addLatLong = function (buildingDetails, latLongs) {
        var i = 0;
        for (var buildingCode in buildingDetails) {
            buildingDetails[buildingCode]['lat'] = latLongs[i]['lat'];
            buildingDetails[buildingCode]['lon'] = latLongs[i]['lon'];
            i = i + 1;
        }
        return buildingDetails;
    };
    return DatasetController;
}());
DatasetController.database = {};
DatasetController.validSection = {
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
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DatasetController;
//# sourceMappingURL=DatasetController.js.map