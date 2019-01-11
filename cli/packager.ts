import { SrcBundler } from "./src-bundler";

export class Packager {

    constructor(readonly dist: string, readonly isWatching: boolean) { }

    srcBundler: SrcBundler | undefined

    build() {
        this.srcBundler = new SrcBundler(this.dist, this.isWatching, false)
        this.srcBundler.triggerBuild()
    }

    debug(port: number) {
        this.srcBundler = new SrcBundler(this.dist, this.isWatching, true)
        this.srcBundler.triggerDebug(port)
    }

}