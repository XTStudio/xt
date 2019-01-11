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