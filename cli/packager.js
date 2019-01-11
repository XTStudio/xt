"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_bundler_1 = require("./src-bundler");
class Packager {
    constructor(dist, isWatching) {
        this.dist = dist;
        this.isWatching = isWatching;
    }
    build() {
        this.srcBundler = new src_bundler_1.SrcBundler(this.dist, this.isWatching, false);
        this.srcBundler.triggerBuild();
    }
    debug(port) {
        this.srcBundler = new src_bundler_1.SrcBundler(this.dist, this.isWatching, true);
        this.srcBundler.triggerDebug(port);
    }
}
exports.Packager = Packager;
