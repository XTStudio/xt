import { EventEmitter } from "events";
import { IncomingMessage, ServerResponse } from "http";

enum RPCTarget {
    Server = 0,
    Clients = 1,
}

interface RPCMessage {
    target: RPCTarget
    sender: string
    receiver?: string
    event: string
    args: any[]
}

export class RPCServer extends EventEmitter {

    private serverUUID = Math.random().toString()
    private clientListeners: { [key: string]: () => void } = {}
    private emittedMessages: RPCMessage[] = []
    private clientEmittedSeq: { [key: string]: number } = {}

    emitToClient(receiverUUID: string, event: string, ...args: any[]) {
        this.emittedMessages.push({
            target: RPCTarget.Clients,
            sender: this.serverUUID,
            receiver: receiverUUID,
            event,
            args
        })
        this.flushListeners()
    }

    emitToClients(event: string, ...args: any[]) {
        this.emittedMessages.push({
            target: RPCTarget.Clients,
            sender: this.serverUUID,
            event,
            args
        })
        this.flushListeners()
    }

    handleRequest(request: IncomingMessage, response: ServerResponse) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            try {
                let obj = JSON.parse(body)
                if (obj.type === "listen") {
                    this.handleListenRequest(obj, response)
                }
                else if (obj.type === "emit") {
                    this.handleEmitRequest(obj, response)
                }
            } catch (error) {
                response.end();
            }
        });
    }

    handleEmitRequest(obj: any, response: ServerResponse) {
        obj.payload.forEach((message: RPCMessage) => {
            if (message.target === RPCTarget.Server) {
                this.emit(message.event, message)
            }
            else {
                this.emittedMessages.push(message)
            }
        })
        response.end()
        this.flushListeners()
    }

    handleListenRequest(obj: any, response: ServerResponse) {
        const clientUUID: string = obj.clientUUID
        if (this.clientEmittedSeq[clientUUID] === undefined) {
            this.clientEmittedSeq[clientUUID] = this.emittedMessages.length
        }
        const seqID = this.clientEmittedSeq[clientUUID]
        if (seqID < this.emittedMessages.length) {
            response.write(JSON.stringify({
                type: 'emit', payload: this.emittedMessages.slice(seqID).filter((it) => {
                    if (it.target === RPCTarget.Clients) {
                        if (it.receiver !== undefined) {
                            if (it.receiver === clientUUID) {
                                return true
                            }
                            else {
                                return false
                            }
                        }
                        else {
                            return true
                        }
                    }
                    else {
                        return false
                    }
                })
            }))
            response.end()
            this.clientEmittedSeq[clientUUID] = this.emittedMessages.length
        }
        else {
            this.clientListeners[clientUUID] = () => {
                this.handleListenRequest(obj, response)
            }
        }
    }

    private flushListeners() {
        Object.keys(this.clientListeners).forEach(it => {
            try {
                this.clientListeners[it]()
            } catch (error) { }
        })
        this.clientListeners = {}
    }

}