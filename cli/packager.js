"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const src_bundler_1 = require("./src-bundler");
const projectName = (() => {
    const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }));
    return pkg.name;
})();
const dists = [
    "build/app.js",
    "platform/android/app/src/main/assets/app.js",
    `platform/ios/${projectName}/JSBundle/app.js`,
    "platform/web/app.js",
    "platform/wx/src/app.js",
];
class Packager {
    constructor(dist = dists, isWatching) {
        this.dist = dist;
        this.isWatching = isWatching;
    }
    build() {
        if (this.dist instanceof Array) {
            return Promise.all(this.dist.map(it => {
                this.srcBundler = new src_bundler_1.SrcBundler(it, this.isWatching, false);
                return this.srcBundler.triggerBuild();
            }));
        }
        else {
            this.srcBundler = new src_bundler_1.SrcBundler(this.dist, this.isWatching, false);
            return this.srcBundler.triggerBuild();
        }
    }
    debug(port) {
        try {
            require('child_process').execSync(`kill $(lsof -t -i:${port})`);
        }
        catch (error) { }
        this.srcBundler = new src_bundler_1.SrcBundler("", this.isWatching, true);
        return this.srcBundler.triggerDebug(port);
    }
}
exports.Packager = Packager;
