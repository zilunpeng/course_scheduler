"use strict";
var DatasetController_1 = require("./DatasetController");
var QueryController_1 = require("./QueryController");
var Util_1 = require("../Util");
var InsightFacade = (function () {
    function InsightFacade() {
        Util_1.default.trace('InsightFacadeImpl::init()');
    }
    InsightFacade.prototype.addDataset = function (id, content) {
        return new Promise(function (fulfill, reject) {
            var datasetController = new DatasetController_1.default();
            datasetController.addDataset(id, content).then(function (response) {
                fulfill(response);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    };
    InsightFacade.prototype.removeDataset = function (id) {
        return new Promise(function (fulfill, reject) {
            var datasetController = new DatasetController_1.default();
            datasetController.removeDataset(id).then(function (response) {
                fulfill(response);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    };
    InsightFacade.prototype.performQuery = function (query) {
        return new Promise(function (fulfill, reject) {
            var queryController = new QueryController_1.default();
            var datasetController = new DatasetController_1.default();
            var datasets = datasetController.getDatasets();
            queryController.performQuery(query, datasets).then(function (response) {
                fulfill(response);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    };
    return InsightFacade;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map