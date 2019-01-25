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
const utils_1 = require("./utils");
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
class QRCodeRunner {
    constructor() {
        this.httpdPort = 9000;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runHTTPServer();
            this.generateQRCode();
        });
    }
    runHTTPServer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync(path.resolve('./', 'node_modules', '.bin', 'http-server'))) {
                this.installHTTPServer();
            }
            for (let index = 9000; index < 10000; index++) {
                if (yield this.checkPort(index)) {
                    this.httpdPort = index;
                    break;
                }
            }
            child_process.exec(`node ${path.resolve('./', 'node_modules', '.bin', 'http-server')} -c-1 -p${this.httpdPort}`);
        });
    }
    installHTTPServer() {
        console.log("Installing http-server...");
        child_process.execSync('npm i http-server', { cwd: './' });
    }
    generateQRCode() {
        if (!fs.existsSync(path.resolve('./', 'node_modules', 'qrcode-terminal'))) {
            this.installQRCodeGenerator();
        }
        const qrcode = require(path.resolve('./', 'node_modules', 'qrcode-terminal', 'lib', 'main'));
        utils_1.getLocalNetworkIPs().forEach(ip => {
            qrcode.generate(`http://${ip}:${this.httpdPort}/platform/web/?debug`, { small: true }, function (qrcode) {
                console.log("\n\n ====== \n IP >>> " + ip);
                console.log(qrcode);
                console.log("======");
            });
        });
    }
    installQRCodeGenerator() {
        console.log("Installing qrcode-terminal...");
        child_process.execSync('npm i qrcode-terminal', { cwd: './' });
    }
    checkPort(port) {
        return new Promise((res) => {
            var net = require('net');
            var tester = net.createServer()
                .once('error', function (err) {
                res(false);
            })
                .once('listening', function () {
                tester.once('close', function () { res(true); }).close();
            })
                .listen(port);
        });
    }
}
exports.QRCodeRunner = QRCodeRunner;
