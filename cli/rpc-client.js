var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
function doFetch(url, method, timeout, headers, body) {
    if (headers === void 0) { headers = {}; }
    if (body === void 0) { body = ""; }
    //@ts-ignore
    return new Promise(function (res, rej) {
        if (typeof MutableURLRequest !== "undefined") {
            var request = new MutableURLRequest(url, timeout);
            request.HTTPMethod = "POST";
            for (var key in headers) {
                request.setValueForHTTPHeaderField(headers[key], key);
            }
            request.HTTPBody = new Data({ utf8String: body });
            URLSession.shared.fetch(request).then(function (data) {
                if (data !== undefined) {
                    res(data.utf8String());
                }
                else {
                    throw Error("no data.");
                }
            })["catch"](function (e) {
                rej(e);
            });
        }
        else if (typeof XMLHttpRequest !== "undefined") {
            var request_1 = new XMLHttpRequest;
            request_1.open(method, url, true);
            request_1.timeout = timeout * 1000;
            for (var key in headers) {
                request_1.setRequestHeader(key, headers[key]);
            }
            request_1.addEventListener("loadend", function () {
                res(request_1.responseText);
            });
            request_1.addEventListener("error", function (e) {
                rej(e);
            });
            request_1.send(body);
        }
        else if (typeof XTSHttpRequest === "function") {
            // Native
            var request_2 = new XTSHttpRequest();
            request_2.open(method, url);
            for (var key in headers) {
                request_2.setRequestHeader(key, headers[key]);
            }
            request_2.onloadend = function () {
                if (request_2.status >= 200 && request_2.status < 400) {
                    res(request_2.responseText);
                }
                else {
                    rej(new Error("error."));
                }
            };
            request_2.send(body);
        }
    });
}
var RPCTarget;
(function (RPCTarget) {
    RPCTarget[RPCTarget["Server"] = 0] = "Server";
    RPCTarget[RPCTarget["Clients"] = 1] = "Clients";
})(RPCTarget || (RPCTarget = {}));
var RPCClient = /** @class */ (function (_super) {
    __extends(RPCClient, _super);
    function RPCClient() {
        var _this = _super.call(this) || this;
        _this.clientUUID = Math.random().toString();
        _this.endPoint = "http://127.0.0.1:8090/rpc";
        _this.emittedMessages = [];
        _this.polling();
        return _this;
    }
    RPCClient.prototype.polling = function () {
        var _this = this;
        doFetch(this.endPoint, "POST", 120, {}, JSON.stringify({ type: "listen", clientUUID: this.clientUUID })).then(function (text) {
            try {
                var obj = JSON.parse(text);
                if (obj.type === "emit") {
                    obj.payload.forEach(function (message) {
                        if (message.target === RPCTarget.Clients && message.sender !== _this.clientUUID) {
                            _this.emit(message.event, message);
                        }
                    });
                }
            }
            catch (error) { }
            _this.polling();
        })["catch"](function () {
            _this.polling();
        });
    };
    RPCClient.prototype.emiting = function () {
        var _this = this;
        if (this.emiitedTimer !== undefined) {
            return;
        }
        this.emiitedTimer = setTimeout(function () {
            doFetch(_this.endPoint, "POST", 15, {}, JSON.stringify({ type: "emit", payload: _this.emittedMessages })).then(function () {
                _this.emiitedTimer = undefined;
                _this.emittedMessages = [];
            })["catch"](function () {
                _this.emiitedTimer = undefined;
                _this.emiting();
            });
        }, 100);
    };
    RPCClient.prototype.emitToServer = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.emittedMessages.push({
            target: RPCTarget.Server,
            sender: this.clientUUID,
            event: event,
            args: args
        });
        this.emiting();
    };
    RPCClient.prototype.emitToClient = function (receiverUUID, event) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        this.emittedMessages.push({
            target: RPCTarget.Clients,
            sender: this.clientUUID,
            receiver: receiverUUID,
            event: event,
            args: args
        });
        this.emiting();
    };
    RPCClient.prototype.emitToClients = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.emittedMessages.push({
            target: RPCTarget.Clients,
            sender: this.clientUUID,
            event: event,
            args: args
        });
        this.emiting();
    };
    return RPCClient;
}(EventEmitter));
var rpcClient = new RPCClient();
