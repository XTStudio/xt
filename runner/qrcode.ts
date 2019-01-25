import { getLocalNetworkIPs } from "./utils";

const fs = require('fs')
const path = require('path')
const child_process = require('child_process')

export class QRCodeRunner {

    httpdPort = 9000

    async run() {
        await this.runHTTPServer()
        this.generateQRCode()
    }

    private async runHTTPServer() {
        if (!fs.existsSync(path.resolve('./', 'node_modules', '.bin', 'http-server'))) {
            this.installHTTPServer()
        }
        for (let index = 9000; index < 10000; index++) {
            if (await this.checkPort(index)) {
                this.httpdPort = index
                break
            }
        }
        child_process.exec(`node ${path.resolve('./', 'node_modules', '.bin', 'http-server')} -c-1 -p${this.httpdPort}`)
    }

    private installHTTPServer() {
        console.log("Installing http-server...")
        child_process.execSync('npm i http-server', { cwd: './' })
    }

    private generateQRCode() {
        if (!fs.existsSync(path.resolve('./', 'node_modules', 'qrcode-terminal'))) {
            this.installQRCodeGenerator()
        }
        const qrcode = require(path.resolve('./', 'node_modules', 'qrcode-terminal', 'lib', 'main'))
        getLocalNetworkIPs().forEach(ip => {
            qrcode.generate(`http://${ip}:${this.httpdPort}/platform/web/?debug`, { small: true }, (qrcode: any) => {
                console.log(`====== QRCode Generator >>> ${ip} ======`)
                console.log(`====== QRCode Content >>> ${`http://${ip}:${this.httpdPort}/platform/web/?debug`}`)
                console.log(qrcode)
                console.log("====== QRCode End ======")
            });
        })

    }

    private installQRCodeGenerator() {
        console.log("Installing qrcode-terminal...")
        child_process.execSync('npm i qrcode-terminal', { cwd: './' })
    }

    private checkPort(port: number): Promise<boolean> {
        return new Promise((res) => {
            var net = require('net')
            var tester = net.createServer()
                .once('error', function (err: Error) {
                    res(false)
                })
                .once('listening', function () {
                    tester.once('close', function () { res(true) }).close()
                })
                .listen(port)
        })
    }

}