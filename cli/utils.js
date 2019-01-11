"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const colors = require("colors/safe");
exports.fsDeepCopy = function (srcDir, dstDir) {
    var results = [];
    var list = fs.readdirSync(srcDir);
    var src, dst;
    list.forEach(function (file) {
        src = srcDir + '/' + file;
        dst = dstDir + '/' + file;
        var stat = fs.statSync(src);
        if (stat && stat.isDirectory()) {
            try {
                fs.mkdirSync(dst);
            }
            catch (e) { }
            results = results.concat(exports.fsDeepCopy(src, dst));
        }
        else {
            try {
                fs.writeFileSync(dst, fs.readFileSync(src));
            }
            catch (e) { }
            results.push(src);
        }
    });
    return results;
};
exports.consoleMethodSwizzler = () => {
    {
        var originMethod = console.error;
        console.error = function () {
            let args = [];
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.red(arguments[index]));
            }
            originMethod.apply(undefined, args);
        };
    }
    {
        var originMethod = console.warn;
        console.warn = function () {
            let args = [];
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.yellow(arguments[index]));
            }
            originMethod.apply(undefined, args);
        };
    }
    {
        var originMethod = console.debug;
        console.debug = function () {
            let args = [];
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.blue(arguments[index]));
            }
            originMethod.apply(undefined, args);
        };
    }
    {
        var originMethod = console.info;
        console.info = function () {
            let args = [];
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.green(arguments[index]));
            }
            originMethod.apply(undefined, args);
        };
    }
};
