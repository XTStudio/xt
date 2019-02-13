"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const child_process = require('child_process');
const portfinder = require("portfinder");
class ChromeRunner {
    constructor() {
        this.httpdPort = 9000;
    }
    run() {
        this.runHTTPServer();
        setTimeout(() => {
            child_process.exec(`/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome "http://127.0.0.1:${this.httpdPort}/platform/web/?debug" --auto-open-devtools-for-tabs --use-mobile-user-agent`);
        }, 500);
    }
    runHTTPServer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync('./node_modules/.bin/http-server')) {
                this.installHTTPServer();
            }
            this.httpdPort = yield portfinder.getPortPromise({ port: 9000, startPort: 9000, stopPort: 10000 });
            child_process.exec(`node ./node_modules/.bin/http-server -c-1 -p${this.httpdPort}`, { cwd: './' });
        });
    }
    installHTTPServer() {
        console.log("Installing http-server...");
        child_process.execSync('npm i http-server', { cwd: './' });
    }
}
exports.ChromeRunner = ChromeRunner;
