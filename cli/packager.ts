const fs = require('fs')
import { SrcBundler } from "./src-bundler";

const projectName: string = (() => {
    const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }))
    return pkg.name
})()

const dists: string[] = [
    "build/app.js",
    "platform/android/app/src/main/assets/app.js",
    `platform/ios/${projectName}/JSBundle/app.js`,
    "platform/web/app.js",
    "platform/wx/src/app.js",
]

export class Packager {

    constructor(readonly dist: string | string[] = dists, readonly isWatching: boolean) { }

    srcBundler: SrcBundler | undefined

    build() {
        if (this.dist instanceof Array) {
            return Promise.all(this.dist.map(it => {
                this.srcBundler = new SrcBundler(it, this.isWatching, false)
                return this.srcBundler.triggerBuild() as any
            }))
        }
        else {
            this.srcBundler = new SrcBundler(this.dist, this.isWatching, false)
            return this.srcBundler.triggerBuild()
        }
    }

    debug(port: number) {
        try {
            require('child_process').execSync(`kill $(lsof -t -i:${port})`)
            require('child_process').execSync(`kill $(lsof -t -i:8091)`)
        } catch (error) { }
        this.srcBundler = new SrcBundler("", this.isWatching, true)
        this.srcBundler.setupTinyDebugger()
        return this.srcBundler.triggerDebug(port)
    }

}