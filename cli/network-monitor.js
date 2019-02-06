"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["Pending"] = 0] = "Pending";
    ConnectionState[ConnectionState["Done"] = 1] = "Done";
    ConnectionState[ConnectionState["Error"] = 2] = "Error";
    ConnectionState[ConnectionState["Cancelled"] = 3] = "Cancelled";
})(ConnectionState || (ConnectionState = {}));
class NetworkMonitor {
    constructor() {
        this.connections = [];
        this.listTasks = [];
    }
    handleRequest(request, response) {
        if (request.url) {
            if (request.url.startsWith("/network/reset")) {
                this.connections = [
                    { uuid: "RESET", state: 0, updatedAt: new Date().getTime() }
                ];
                response.end();
                this.listTasks.forEach(it => it());
                this.listTasks = [];
            }
            else if (request.url.startsWith("/network/list")) {
                if (request.headers["ts-tag"] !== undefined) {
                    const tsTag = request.headers["ts-tag"];
                    this.listTasks.push(() => {
                        const tag = parseInt(tsTag);
                        response.setHeader("ts-tag", new Date().getTime().toString());
                        response.write(JSON.stringify(this.connections.filter(it => {
                            return it.updatedAt > tag;
                        }).map(it => {
                            return { uuid: it.uuid, request: Object.assign({}, (it.request || {}), { headers: undefined }), response: Object.assign({}, (it.response || {}), { headers: undefined, body: undefined }), state: it.state };
                        })));
                        response.end();
                    });
                }
                else {
                    response.setHeader("ts-tag", new Date().getTime().toString());
                    response.write(JSON.stringify(this.connections.map(it => {
                        return { uuid: it.uuid, request: Object.assign({}, (it.request || {}), { headers: undefined }), response: Object.assign({}, (it.response || {}), { headers: undefined, body: undefined }), state: it.state };
                    })));
                    response.end();
                }
            }
            else if (request.url.startsWith("/network/write")) {
                let body = '';
                request.on('data', chunk => {
                    body += chunk.toString();
                });
                request.on('end', () => {
                    try {
                        let connection = JSON.parse(body);
                        connection.updatedAt = new Date().getTime();
                        if (typeof connection.uuid === "string") {
                            let found = false;
                            for (let index = 0; index < this.connections.length; index++) {
                                const element = this.connections[index];
                                if (element.uuid === connection.uuid) {
                                    found = true;
                                    Object.assign(this.connections[index], connection);
                                }
                            }
                            if (!found) {
                                this.connections.push(connection);
                            }
                        }
                    }
                    catch (error) { }
                    response.end();
                    this.listTasks.forEach(it => it());
                    this.listTasks = [];
                });
            }
            else if (request.url.startsWith("/network/read/")) {
                let uuid = request.url.replace("/network/read/", "").trim();
                const target = this.connections.filter(it => it.uuid === uuid)[0];
                if (target !== undefined) {
                    response.write(JSON.stringify(target));
                }
                response.end();
            }
            else {
                response.end();
            }
        }
        else {
            response.end();
        }
    }
}
exports.NetworkMonitor = NetworkMonitor;
