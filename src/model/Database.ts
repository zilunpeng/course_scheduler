export interface IDataFile {
    fileName:string
    content:any
}

export interface IDatabase {
    [id: string]: Array<IDataFile>; //files under a zip folder can be accessed by Database.database[id]
}

export class Database {
    static database:IDatabase = {};

    constructor() {}
}