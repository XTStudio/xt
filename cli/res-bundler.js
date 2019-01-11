"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class ResBundler {
    constructor() {
        this.contentCache = {};
    }
    files(dir) {
        var files = [];
        try {
            var results = fs.readdirSync(dir);
            results.forEach(it => {
                if (it == ".DS_Store") {
                    return;
                }
                var subPaths = this.files(dir + "/" + it);
                if (subPaths instanceof Array) {
                    subPaths.forEach(it => {
                        files.push(it);
                    });
                }
                else {
                    files.push(dir + "/" + it);
                }
            });
        }
        catch (error) {
            return null;
        }
        return files;
    }
    bundle() {
        const files = this.files('res') || [];
        return files.map((it) => {
            const content = this.contentCache[it] || fs.readFileSync(it).toString('base64');
            this.contentCache[it] = content;
            return `Bundle.js.addResource("${it.replace('res/', '')}", "${content}");`;
        }).join("\n");
    }
}
exports.ResBundler = ResBundler;
