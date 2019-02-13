declare var window: any
declare var UserDefaults: any

export const userDefaultsControllerScript = function () {
    try {
        window.rpcClient = rpcClient;
    } catch (e) { }
    rpcClient.on('com.xt.userdefaults.list', function (message: RPCMessage) {
        if (message.args && typeof message.args[0] === 'string') {
            rpcClient.emitToClient(message.sender, 'com.xt.userdefaults.list.result', { data: new UserDefaults(message.args[0]).dump() });
        }
        else {
            rpcClient.emitToClient(message.sender, 'com.xt.userdefaults.list.result', { data: UserDefaults.standard.dump() });
        }
    });
    rpcClient.on('com.xt.userdefaults.write', function (message: RPCMessage) {
        const aValue: any = message.args[0]
        const aKey: string = message.args[1]
        const aSuite: string | undefined = message.args[2]
        new UserDefaults(aSuite).setValue(aValue === null ? undefined : aValue, aKey)
    })
    rpcClient.on('com.xt.userdefaults.reset', function (message: RPCMessage) {
        const aSuite: string | undefined = message.args[0]
        new UserDefaults(aSuite).reset()
    })
}