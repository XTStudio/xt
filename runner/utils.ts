const child_process = require('child_process')

function run(command: string): Promise<any> {
    return new Promise((fulfill, reject) => {
        child_process.exec(command, (err: any, stdout: any, stderr: any) => {
            if (err) {
                reject(err);
                return;
            }
            if (stderr) {
                reject(new Error(stderr));
                return;
            }
            fulfill(stdout);
        });
    });
}

export function cmdExists(cmd: string) {
    return run(`which ${cmd}`).then((stdout) => {
        if (stdout.trim().length === 0) {
            // maybe an empty command was supplied?
            // are we running on Windows??
            return Promise.reject(new Error('No output'));
        }

        const rNotFound = /^[\w\-]+ not found/g;

        if (rNotFound.test(cmd)) {
            return Promise.resolve(false);
        }

        return Promise.resolve(true);
    });
}

export function latestVersion(items: string[]): string {
    let current = items[0]
    items.forEach(it => {
        if (versionCompare(current, it, undefined)) {
            current = it
        }
    })
    return current
}

function versionCompare(v1: string, v2: string, options: any) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');
    function isValidPart(x: any) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }
    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }
    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }
    if (!lexicographical) {
        v1parts = v1parts.map(Number) as any;
        v2parts = v2parts.map(Number) as any;
    }
    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        else {
            return -1;
        }
    }
    if (v1parts.length != v2parts.length) {
        return -1;
    }
    return 0;
}

export function getLocalNetworkIPs(): string[] {
    const os = require('os');
    const ifaces = os.networkInterfaces();
    let results: string[] = []
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;
        ifaces[ifname].forEach(function (iface: any) {
            if (iface.address.startsWith("169.")) { return }
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            if (alias >= 1) {
                //ignore IPV6 
            } else {
                results.push(iface.address)
            }
            ++alias;
        });
    });
    return results
}