"use strict";
var restify = require("restify");
var Util_1 = require("../Util");
var InsightFacade_1 = require("../controller/InsightFacade");
var Server = (function () {
    function Server(port) {
        Util_1.default.info("Server::<init>( " + port + " )");
        this.port = port;
    }
    Server.prototype.stop = function () {
        Util_1.default.info('Server::close()');
        var that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    };
    Server.prototype.start = function () {
        var that = this;
        var fs = require("fs");
        return new Promise(function (fulfill, reject) {
            try {
                Util_1.default.info('Server::start() - start');
                that.rest = restify.createServer({
                    name: 'insightUBC'
                });
                that.rest.use(restify.bodyParser({ mapParams: true, mapFiles: true }));
                that.rest.get('/', function (req, res, next) {
                    var fileContent = fs.readFileSync('./src/rest/views/main.html');
                    res.setHeader('Content-Type', 'text/html');
                    res.writeHead(200);
                    res.end(fileContent);
                    return next();
                });
                that.rest.get('/views/.*', restify.serveStatic({
                    directory: __dirname
                }));
                that.rest.get('/public/.*', restify.serveStatic({
                    directory: __dirname
                }));
                that.rest.put('/dataset/:id', function (req, res, next) {
                    var id = req.url.split('/').pop();
                    var dataStr = new Buffer(req.params.body).toString('base64');
                    var insightFacade = new InsightFacade_1.default();
                    insightFacade.addDataset(id, dataStr).then(function (insightResponse) {
                        res.send(insightResponse.code, insightResponse.body);
                        return next();
                    })
                        .catch(function (insightResponse) {
                        res.send(insightResponse.code, insightResponse.body);
                        return next();
                    });
                });
                that.rest.del('/dataset/:id', function (req, res, next) {
                    var id = req.url.split('/').pop();
                    var insightFacade = new InsightFacade_1.default();
                    insightFacade.removeDataset(id).then(function (insightResponse) {
                        res.send(insightResponse.code, insightResponse.body);
                        return next();
                    })
                        .catch(function (insightResponse) {
                        res.send(insightResponse.code, insightResponse.body);
                        return next();
                    });
                });
                that.rest.post('/query', function (req, res, next) {
                    var insightFacade = new InsightFacade_1.default();
                    insightFacade.performQuery(req.body).then(function (insightResponse) {
                        res.send(insightResponse.code, insightResponse.body);
                        return next();
                    })
                        .catch(function (insightResponse) {
                        res.send(insightResponse.code, insightResponse.body);
                        return next();
                    });
                });
                that.rest.get('/echo/:msg', Server.echo);
                that.rest.listen(that.port, function () {
                    Util_1.default.info('Server::start() - restify listening: ' + that.rest.url);
                    fulfill(true);
                });
                that.rest.on('error', function (err) {
                    Util_1.default.info('Server::start() - restify ERROR: ' + err);
                    reject(err);
                });
            }
            catch (err) {
                Util_1.default.error('Server::start() - ERROR: ' + err);
                reject(err);
            }
        });
    };
    Server.echo = function (req, res, next) {
        Util_1.default.trace('Server::echo(..) - params: ' + JSON.stringify(req.params));
        try {
            var result = Server.performEcho(req.params.msg);
            Util_1.default.info('Server::echo(..) - responding ' + result.code);
            res.json(result.code, result.body);
        }
        catch (err) {
            Util_1.default.error('Server::echo(..) - responding 400');
            res.json(400, { error: err.message });
        }
        return next();
    };
    Server.performEcho = function (msg) {
        if (typeof msg !== 'undefined' && msg !== null) {
            return { code: 200, body: { message: msg + '...' + msg } };
        }
        else {
            return { code: 400, body: { error: 'Message not provided' } };
        }
    };
    return Server;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Server;
//# sourceMappingURL=Server.js.map