const fs = require('fs')
const child_process = require('child_process')
// const httpd = require('http-server')

export class ChromeRunner {

    httpdPort = 9000

    run() {
        this.runHTTPServer()
        setTimeout(() => {
            child_process.exec(`/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome "http://127.0.0.1:${this.httpdPort}/platform/web/?debug" --auto-open-devtools-for-tabs --use-mobile-user-agent`)
        }, 500)
    }

    private async runHTTPServer() {
        if (!fs.existsSync('./node_modules/.bin/http-server')) {
            this.installHTTPServer()
        }
        for (let index = 9000; index < 10000; index++) {
            if (await this.checkPort(index)) {
                this.httpdPort = index
                break
            }
        }
        child_process.exec(`node ./node_modules/.bin/http-server -c-1 -p${this.httpdPort}`)
    }

    private installHTTPServer() {
        console.log("Installing http-server, please wait.")
        child_process.execSync('npm i http-server --no-save', { cwd: './' })
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