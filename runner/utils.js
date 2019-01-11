"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require('child_process');
function run(command) {
    return new Promise((fulfill, reject) => {
        child_process.exec(command, (err, stdout, stderr) => {
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
function cmdExists(cmd) {
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
exports.cmdExists = cmdExists;
