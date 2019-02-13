"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userDefaultsControllerScript = function () {
    try {
        window.rpcClient = rpcClient;
    }
    catch (e) { }
    rpcClient.on('com.xt.userdefaults.list', function (message) {
        if (message.args && typeof message.args[0] === 'string') {
            rpcClient.emitToClient(message.sender, 'com.xt.userdefaults.list.result', { data: new UserDefaults(message.args[0]).dump() });
        }
        else {
            rpcClient.emitToClient(message.sender, 'com.xt.userdefaults.list.result', { data: UserDefaults.standard.dump() });
        }
    });
    rpcClient.on('com.xt.userdefaults.write', function (message) {
        const aValue = message.args[0];
        const aKey = message.args[1];
        const aSuite = message.args[2];
        new UserDefaults(aSuite).setValue(aValue === null ? undefined : aValue, aKey);
    });
    rpcClient.on('com.xt.userdefaults.reset', function (message) {
        const aSuite = message.args[0];
        new UserDefaults(aSuite).reset();
    });
};
