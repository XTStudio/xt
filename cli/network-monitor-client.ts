declare var URLSession: any
declare var URLRequest: any
declare var MutableURLRequest: any
declare var URLSessionTask: any
declare var $__ConnectorHostname: any
declare var Data: any

(() => {

    if (URLSession.prototype.$dataTaskSwizzlled === true) { return }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    let serverAddress = (() => {
        if (typeof window === "object") {
            return window.location.hostname + ":8090"
        }
        else if (typeof $__ConnectorHostname === "string") {
            return $__ConnectorHostname + ":8090"
        }
        return "127.0.0.1:8090"
    })()

    URLSession.shared.fetch(`http://${serverAddress}/network/reset`)

    let dataTaskOriginMethod = URLSession.prototype.dataTask

    URLSession.prototype.dataTask = function () {
        let requestInfo = arguments[0]
        let callback = arguments[1]
        let request: any = {}
        if (typeof requestInfo === "string") {
            request.url = requestInfo
        }
        else if (requestInfo instanceof URL) {
            request.url = (requestInfo as any).absoluteString
        }
        else if (requestInfo instanceof URLRequest) {
            request.url = requestInfo.URL.absoluteString
            request.method = requestInfo.HTTPMethod
            request.headers = requestInfo.allHTTPHeaderFields
            request.body = requestInfo.HTTPBody ? requestInfo.HTTPBody.base64EncodedString() : undefined
        }
        request.ts = new Date().getTime()
        if (request.url.indexOf(`http://${serverAddress}`) >= 0) { return dataTaskOriginMethod.apply(this, arguments) }
        const uuid = uuidv4()
        let task = dataTaskOriginMethod.apply(this, [arguments[0], function () {
            {
                let body, bodySize, response: any, state;
                if (arguments[0] !== undefined) {
                    bodySize = arguments[0].arrayBuffer().length
                    if (bodySize > 1024 * 1024 * 1) {
                        body = new Data({ utf8String: "Response too large, ignoring contents." }).base64EncodedString()
                    }
                    else {
                        body = arguments[0].base64EncodedString()
                    }
                }
                if (arguments[1] !== undefined) {
                    response = {
                        statusCode: arguments[1].statusCode,
                        headers: arguments[1].allHeaderFields,
                        body,
                        bodySize,
                    }
                }
                else {
                    response = {}
                }
                response.ts = new Date().getTime()
                if (arguments[2] !== undefined || (arguments[1] !== undefined && (arguments[1].statusCode < 200 || arguments[1].statusCode >= 400))) {
                    state = 2
                }
                else {
                    state = 1
                }
                {
                    let writeRequest = new MutableURLRequest(`http://${serverAddress}/network/write`)
                    writeRequest.HTTPMethod = "POST"
                    writeRequest.HTTPBody = new Data({ utf8String: JSON.stringify({ uuid, response, state }) })
                    URLSession.shared.fetch(writeRequest)
                }
            }
            callback(arguments[0], arguments[1], arguments[2])
        }]);
        task.resume = function () {
            {
                let writeRequest = new MutableURLRequest(`http://${serverAddress}/network/write`)
                writeRequest.HTTPMethod = "POST"
                writeRequest.HTTPBody = new Data({ utf8String: JSON.stringify({ uuid, request, state: 0 }) })
                URLSession.shared.fetch(writeRequest)
            }
            URLSessionTask.prototype.resume.apply(this)
        }
        task.cancel = function () {
            {
                let writeRequest = new MutableURLRequest(`http://${serverAddress}/network/write`)
                writeRequest.HTTPMethod = "POST"
                writeRequest.HTTPBody = new Data({ utf8String: JSON.stringify({ uuid, request, state: 3 }) })
                URLSession.shared.fetch(writeRequest)
            }
            URLSessionTask.prototype.cancel.apply(this)
        }
        return task
    }

    URLSession.prototype.$dataTaskSwizzlled = true

})()