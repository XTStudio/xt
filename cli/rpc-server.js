"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
var RPCTarget;
(function (RPCTarget) {
    RPCTarget[RPCTarget["Server"] = 0] = "Server";
    RPCTarget[RPCTarget["Clients"] = 1] = "Clients";
})(RPCTarget || (RPCTarget = {}));
class RPCServer extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.serverUUID = Math.random().toString();
        this.clientListeners = {};
        this.emittedMessages = [];
        this.clientEmittedSeq = {};
    }
    emitToClient(receiverUUID, event, ...args) {
        this.emittedMessages.push({
            target: RPCTarget.Clients,
            sender: this.serverUUID,
            receiver: receiverUUID,
            event,
            args
        });
        this.flushListeners();
    }
    emitToClients(event, ...args) {
        this.emittedMessages.push({
            target: RPCTarget.Clients,
            sender: this.serverUUID,
            event,
            args
        });
        this.flushListeners();
    }
    handleRequest(request, response) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            try {
                let obj = JSON.parse(body);
                if (obj.type === "listen") {
                    this.handleListenRequest(obj, response);
                }
                else if (obj.type === "emit") {
                    this.handleEmitRequest(obj, response);
                }
            }
            catch (error) {
                response.end();
            }
        });
    }
    handleEmitRequest(obj, response) {
        obj.payload.forEach((message) => {
            if (message.target === RPCTarget.Server) {
                this.emit(message.event, message);
            }
            else {
                this.emittedMessages.push(message);
            }
        });
        response.end();
        this.flushListeners();
    }
    handleListenRequest(obj, response) {
        const clientUUID = obj.clientUUID;
        if (this.clientEmittedSeq[clientUUID] === undefined) {
            this.clientEmittedSeq[clientUUID] = this.emittedMessages.length;
        }
        const seqID = this.clientEmittedSeq[clientUUID];
        if (seqID < this.emittedMessages.length) {
            response.write(JSON.stringify({
                type: 'emit', payload: this.emittedMessages.slice(seqID).filter((it) => {
                    if (it.target === RPCTarget.Clients) {
                        if (it.receiver !== undefined) {
                            if (it.receiver === clientUUID) {
                                return true;
                            }
                            else {
                                return false;
                            }
                        }
                        else {
                            return true;
                        }
                    }
                    else {
                        return false;
                    }
                })
            }));
            response.end();
            this.clientEmittedSeq[clientUUID] = this.emittedMessages.length;
        }
        else {
            this.clientListeners[clientUUID] = () => {
                this.handleListenRequest(obj, response);
            };
        }
    }
    flushListeners() {
        Object.keys(this.clientListeners).forEach(it => {
            try {
                this.clientListeners[it]();
            }
            catch (error) { }
        });
        this.clientListeners = {};
    }
}
exports.RPCServer = RPCServer;
