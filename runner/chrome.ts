const fs = require('fs')
const child_process = require('child_process')
import * as portfinder from "portfinder";

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
        this.httpdPort = await portfinder.getPortPromise({ port: 9000, startPort: 9000, stopPort: 10000 })
        child_process.exec(`node ./node_modules/.bin/http-server -c-1 -p${this.httpdPort}`, { cwd: './' })
    }

    private installHTTPServer() {
        console.log("Installing http-server...")
        child_process.execSync('npm i http-server', { cwd: './' })
    }

}