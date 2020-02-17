/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";

import DatasetController from "./DatasetController";

import QueryController from "./QueryController";

import Log from "../Util";

export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    /**
     *
     * @param id: unique idenfier of a dataset
     * @param content: base64 representation of a dataset
     * @returns {Promise<T>}
     * InsightFacade.addDataset calls DatasetController.addDataset, and returns a InsightResponse object
     * with success or error msg depending on whether the dataset is successfully added or not
     *
     */
    addDataset(id: string, content: string): Promise<InsightResponse>{
        return new Promise(function(fulfill,reject) {
            var datasetController = new DatasetController();
            datasetController.addDataset(id,content).then(function(response:any){
                fulfill(response);
            })
                .catch(function(err:any){
                    reject(err);
                })
        });
    }

    /**
     *
     * @param id: unique identifier of a dataset
     * @returns {Promise<T>}
     * InsightFacade.removeDataset calls DatasetController.removeDataset, and returns a InsightResponse object
     * with success or error msg depending on whether a dataset is successfully deleted from memory and cache
     *
     */
    removeDataset(id: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            var datasetController = new DatasetController();
            datasetController.removeDataset(id).then(function(response:any){
                fulfill(response);
            })
                .catch(function(err:any){
                    reject(err);
                })
        });
    }

    /**
     *
     * @param query
     * @returns {Promise<T>}
     * performQuery calls queryController.performQuery.
     * It should return an InsightResponse object with matched data or error msg depending on whether query is valid or not
     *
     */
    performQuery(query: QueryRequest): Promise <InsightResponse> {
        return new Promise(function(fulfill,reject) {
            var queryController = new QueryController();
            var datasetController = new DatasetController();
            var datasets = datasetController.getDatasets();
            queryController.performQuery(query,datasets).then(function(response:any){
                fulfill(response);
            })
                .catch(function(err:any){
                    reject(err);
                })
        });
    }
}