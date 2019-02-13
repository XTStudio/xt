"use strict";
var mEventEmitter;
//@ts-ignore
(function (exports) {
    "use strict";
    function EventEmitter() { }
    var proto = EventEmitter.prototype;
    var originalGlobalValue = exports.EventEmitter;
    function indexOfListener(listeners, listener) { var i = listeners.length; while (i--) {
        if (listeners[i].listener === listener) {
            return i;
        }
    } return -1; }
    function alias(name) { return function aliasClosure() { return this[name].apply(this, arguments); }; }
    proto.getListeners = function getListeners(evt) { var events = this._getEvents(); var response; var key; if (evt instanceof RegExp) {
        response = {};
        for (key in events) {
            if (events.hasOwnProperty(key) && evt.test(key)) {
                response[key] = events[key];
            }
        }
    }
    else {
        response = events[evt] || (events[evt] = []);
    } return response; };
    proto.flattenListeners = function flattenListeners(listeners) { var flatListeners = []; var i; for (i = 0; i < listeners.length; i += 1) {
        flatListeners.push(listeners[i].listener);
    } return flatListeners; };
    proto.getListenersAsObject = function getListenersAsObject(evt) { var listeners = this.getListeners(evt); var response; if (listeners instanceof Array) {
        response = {};
        response[evt] = listeners;
    } return response || listeners; };
    function isValidListener(listener) { if (typeof listener === "function" || listener instanceof RegExp) {
        return true;
    }
    else if (listener && typeof listener === "object") {
        return isValidListener(listener.listener);
    }
    else {
        return false;
    } }
    proto.addListener = function addListener(evt, listener) { if (!isValidListener(listener)) {
        throw new TypeError("listener must be a function");
    } var listeners = this.getListenersAsObject(evt); var listenerIsWrapped = typeof listener === "object"; var key; for (key in listeners) {
        if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
            listeners[key].push(listenerIsWrapped ? listener : { listener: listener, once: false });
        }
    } return this; };
    proto.on = alias("addListener");
    proto.addOnceListener = function addOnceListener(evt, listener) { return this.addListener(evt, { listener: listener, once: true }); };
    proto.once = alias("addOnceListener");
    proto.defineEvent = function defineEvent(evt) { this.getListeners(evt); return this; };
    proto.defineEvents = function defineEvents(evts) { for (var i = 0; i < evts.length; i += 1) {
        this.defineEvent(evts[i]);
    } return this; };
    proto.removeListener = function removeListener(evt, listener) { var listeners = this.getListenersAsObject(evt); var index; var key; for (key in listeners) {
        if (listeners.hasOwnProperty(key)) {
            index = indexOfListener(listeners[key], listener);
            if (index !== -1) {
                listeners[key].splice(index, 1);
            }
        }
    } return this; };
    proto.off = alias("removeListener");
    proto.addListeners = function addListeners(evt, listeners) { return this.manipulateListeners(false, evt, listeners); };
    proto.removeListeners = function removeListeners(evt, listeners) { return this.manipulateListeners(true, evt, listeners); };
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) { var i; var value; var single = remove ? this.removeListener : this.addListener; var multiple = remove ? this.removeListeners : this.addListeners; if (typeof evt === "object" && !(evt instanceof RegExp)) {
        for (i in evt) {
            if (evt.hasOwnProperty(i) && (value = evt[i])) {
                if (typeofvalue === "function") {
                    single.call(this, i, value);
                }
                else {
                    multiple.call(this, i, value);
                }
            }
        }
    }
    else {
        i = listeners.length;
        while (i--) {
            single.call(this, evt, listeners[i]);
        }
    } return this; };
    proto.removeEvent = function removeEvent(evt) { var type = typeof evt; var events = this._getEvents(); var key; if (type === "string") {
        delete events[evt];
    }
    else if (evt instanceof RegExp) {
        for (key in events) {
            if (events.hasOwnProperty(key) && evt.test(key)) {
                delete events[key];
            }
        }
    }
    else {
        delete this._events;
    } return this; };
    proto.removeAllListeners = alias("removeEvent");
    proto.emitEvent = function emitEvent(evt, args) { try {
        var listenersMap = this.getListenersAsObject(evt);
        var listeners;
        var listener;
        var i;
        var key;
        var response;
        for (key in listenersMap) {
            if (listenersMap.hasOwnProperty(key)) {
                listeners = listenersMap[key].slice(0);
                for (i = 0; i < listeners.length; i++) {
                    listener = listeners[i];
                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }
                    response = listener.listener.apply(this, args || []);
                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }
    }
    catch (error) {
        console.error(error);
    } return this; };
    proto.val = function emitEventWithReturnValue(evt) { try {
        var args = Array.prototype.slice.call(arguments, 1);
        var listenersMap = this.getListenersAsObject(evt);
        var listeners;
        var listener;
        var i;
        var key;
        for (key in listenersMap) {
            if (listenersMap.hasOwnProperty(key)) {
                listeners = listenersMap[key].slice(0);
                for (i = 0; i < listeners.length; i++) {
                    listener = listeners[i];
                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }
                    return listener.listener.apply(this, args || []);
                }
            }
        }
    }
    catch (error) {
        console.error(error);
    } return undefined; };
    proto.trigger = alias("emitEvent");
    proto.emit = function emit(evt) { var args = Array.prototype.slice.call(arguments, 1); return this.emitEvent(evt, args); };
    proto.setOnceReturnValue = function setOnceReturnValue(value) { this._onceReturnValue = value; return this; };
    proto._getOnceReturnValue = function _getOnceReturnValue() { if (this.hasOwnProperty("_onceReturnValue")) {
        return this._onceReturnValue;
    }
    else {
        return true;
    } };
    proto._getEvents = function _getEvents() { return this._events || (this._events = {}); };
    mEventEmitter = EventEmitter;
})(this || {});
var EventEmitter = mEventEmitter;
//@ts-ignore
function doFetch(url, method, timeout, headers = {}, body = "") {
    //@ts-ignore
    return new Promise((res, rej) => {
        if (typeof MutableURLRequest !== "undefined") {
            let request = new MutableURLRequest(url, timeout);
            request.HTTPMethod = "POST";
            for (const key in headers) {
                request.setValueForHTTPHeaderField(headers[key], key);
            }
            request.HTTPBody = new Data({ utf8String: body });
            URLSession.shared.fetch(request).then((data) => {
                if (data !== undefined) {
                    res(data.utf8String());
                }
                else {
                    throw Error("no data.");
                }
            }).catch((e) => {
                rej(e);
            });
        }
        else if (typeof XMLHttpRequest !== "undefined") {
            let request = new XMLHttpRequest;
            request.open(method, url, true);
            request.timeout = timeout * 1000;
            for (const key in headers) {
                request.setRequestHeader(key, headers[key]);
            }
            request.addEventListener("loadend", () => {
                res(request.responseText);
            });
            request.addEventListener("error", (e) => {
                rej(e);
            });
            request.send(body);
        }
        else if (typeof XTSHttpRequest === "function") {
            // Native
            const request = new XTSHttpRequest();
            request.open(method, url);
            for (const key in headers) {
                request.setRequestHeader(key, headers[key]);
            }
            request.onloadend = () => {
                if (request.status >= 200 && request.status < 400) {
                    res(request.responseText);
                }
                else {
                    rej(new Error("error."));
                }
            };
            request.send(body);
        }
    });
}
var RPCTarget;
(function (RPCTarget) {
    RPCTarget[RPCTarget["Server"] = 0] = "Server";
    RPCTarget[RPCTarget["Clients"] = 1] = "Clients";
})(RPCTarget || (RPCTarget = {}));
class RPCClient extends EventEmitter {
    constructor() {
        super();
        this.clientUUID = Math.random().toString();
        this.endPoint = "http://127.0.0.1:8090/rpc";
        this.emittedMessages = [];
        this.polling();
    }
    polling() {
        doFetch(this.endPoint, "POST", 120, {}, JSON.stringify({ type: "listen", clientUUID: this.clientUUID })).then(text => {
            try {
                const obj = JSON.parse(text);
                if (obj.type === "emit") {
                    obj.payload.forEach((message) => {
                        if (message.target === RPCTarget.Clients && message.sender !== this.clientUUID) {
                            this.emit(message.event, message);
                        }
                    });
                }
            }
            catch (error) { }
            this.polling();
        }).catch(() => {
            this.polling();
        });
    }
    emiting() {
        if (this.emiitedTimer !== undefined) {
            return;
        }
        this.emiitedTimer = setTimeout(() => {
            doFetch(this.endPoint, "POST", 15, {}, JSON.stringify({ type: "emit", payload: this.emittedMessages })).then(() => {
                this.emiitedTimer = undefined;
                this.emittedMessages = [];
            }).catch(() => {
                this.emiitedTimer = undefined;
                this.emiting();
            });
        }, 100);
    }
    emitToServer(event, ...args) {
        this.emittedMessages.push({
            target: RPCTarget.Server,
            sender: this.clientUUID,
            event,
            args
        });
        this.emiting();
    }
    emitToClient(receiverUUID, event, ...args) {
        this.emittedMessages.push({
            target: RPCTarget.Clients,
            sender: this.clientUUID,
            receiver: receiverUUID,
            event,
            args
        });
        this.emiting();
    }
    emitToClients(event, ...args) {
        this.emittedMessages.push({
            target: RPCTarget.Clients,
            sender: this.clientUUID,
            event,
            args
        });
        this.emiting();
    }
}
const rpcClient = new RPCClient();
