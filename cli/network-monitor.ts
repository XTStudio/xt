import { IncomingMessage, ServerResponse } from "http";

enum ConnectionState {
    Pending = 0,
    Done = 1,
    Error = 2,
    Cancelled = 3,
}

interface ConnectionItem {

    uuid: string

    request?: {
        method?: string,
        url?: string,
        headers?: { [key: string]: string },
        ts: number,
    }

    response?: {
        statusCode: number,
        headers: { [key: string]: string },
        body?: string,
        bodySize: number,
        ts: number,
    }

    state: ConnectionState,

}

export class NetworkMonitor {

    private connections: ConnectionItem[] = []

    private listTasks: (() => void)[] = []

    handleRequest(request: IncomingMessage, response: ServerResponse) {
        if (request.url) {
            if (request.url.startsWith("/network/reset")) {
                this.connections = [
                    { uuid: "RESET", request: { ts: new Date().getTime() }, state: 0 }
                ]
                response.end()
                this.listTasks.forEach(it => it())
                this.listTasks = []
            }
            else if (request.url.startsWith("/network/list")) {
                if (request.headers["ts-tag"] !== undefined) {
                    const tsTag = request.headers["ts-tag"] as string
                    this.listTasks.push(() => {
                        const tag = parseInt(tsTag)
                        response.setHeader("ts-tag", new Date().getTime().toString())
                        response.write(JSON.stringify(this.connections.filter(it => {
                            if (it.request && it.request.ts > tag) {
                                return true
                            }
                            else if (it.response && it.response.ts > tag) {
                                return true
                            }
                            else {
                                return false
                            }
                        }).map(it => {
                            return { uuid: it.uuid, request: { ...(it.request || {}), headers: undefined }, response: { ...(it.response || {}), headers: undefined, body: undefined }, state: it.state }
                        })))
                        response.end()
                    })
                }
                else {
                    response.setHeader("ts-tag", new Date().getTime().toString())
                    response.write(JSON.stringify(this.connections.map(it => {
                        return { uuid: it.uuid, request: { ...(it.request || {}), headers: undefined }, response: { ...(it.response || {}), headers: undefined, body: undefined }, state: it.state }
                    })))
                    response.end()
                }
            }
            else if (request.url.startsWith("/network/write")) {
                let body = '';
                request.on('data', chunk => {
                    body += chunk.toString();
                });
                request.on('end', () => {
                    try {
                        let connection = JSON.parse(body)
                        if (connection.request) {
                            connection.request.ts = new Date().getTime()
                        }
                        if (connection.response) {
                            connection.response.ts = new Date().getTime()
                        }
                        if (typeof connection.uuid === "string") {
                            let found = false
                            for (let index = 0; index < this.connections.length; index++) {
                                const element = this.connections[index];
                                if (element.uuid === connection.uuid) {
                                    found = true
                                    Object.assign(this.connections[index], connection)
                                }
                            }
                            if (!found) {
                                this.connections.push(connection)
                            }
                        }
                    } catch (error) { }
                    response.end();
                    this.listTasks.forEach(it => it())
                    this.listTasks = []
                });
            }
            else if (request.url.startsWith("/network/read/")) {
                let uuid = request.url.replace("/network/read/", "").trim()
                const target = this.connections.filter(it => it.uuid === uuid)[0]
                if (target !== undefined) {
                    response.write(JSON.stringify(target))
                }
                response.end()
            }
            else {
                response.end()
            }
        }
        else {
            response.end()
        }
    }

}