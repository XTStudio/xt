#!/usr/bin/env node
var browserify = require('browserify')
var watchify = require('watchify')
var tsify = require('tsify')
var through = require('through')
var fs = require('fs')
var path = require('path')
var http = require('http')
var strip_json_comments = require('strip-json-comments')
var colors = require('colors/safe');

(() => {
    {
        var originMethod = console.error
        console.error = function () {
            let args = []
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.red(arguments[index]))
            }
            originMethod.apply(undefined, args)
        }
    }
    {
        var originMethod = console.warn
        console.warn = function () {
            let args = []
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.yellow(arguments[index]))
            }
            originMethod.apply(undefined, args)
        }
    }
    {
        var originMethod = console.debug
        console.debug = function () {
            let args = []
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.blue(arguments[index]))
            }
            originMethod.apply(undefined, args)
        }
    }
    {
        var originMethod = console.info
        console.info = function () {
            let args = []
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.green(arguments[index]))
            }
            originMethod.apply(undefined, args)
        }
    }
})()

class ProjectManager {

    init() {
        fs.mkdirSync('build')
        fs.mkdirSync('res')
        fs.mkdirSync('src')
        fs.writeFileSync('src/main.ts', `const main = new UIView`)
        fs.writeFileSync('tsconfig.json', `{
    "compilerOptions": {
        "target": "es5",
        "module": "commonjs",
        "lib": [
            "esnext",
            "es2015.promise"
        ],
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "noImplicitThis": true,
        "alwaysStrict": true,
        "types": [
            "xtstudio"
        ]
    }
}`)
        const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }))
        pkg.scripts = {
            watch: './node_modules/.bin/xt watch',
            build: './node_modules/.bin/xt build',
        }
        fs.writeFileSync('package.json', JSON.stringify(pkg))
    }

}

class ResBundler {

    constructor() {
        this.contentCache = {}
    }

    files(dir) {
        var files = []
        try {
            var results = fs.readdirSync(dir)
            results.forEach(it => {
                if (it == ".DS_Store") { return }
                var subPaths = this.files(dir + "/" + it)
                if (subPaths instanceof Array) {
                    subPaths.forEach(it => {
                        files.push(it)
                    })
                }
                else {
                    files.push(dir + "/" + it)
                }
            })
        } catch (error) {
            return null
        }
        return files
    }

    bundle() {
        const files = this.files('res') || []
        return files.map((it) => {
            const content = this.contentCache[it] || fs.readFileSync(it).toString('base64')
            this.contentCache[it] = content
            return `Bundle.js.addResource("${it.replace('res/', '')}", "${content}");`
        }).join("\n")
    }

}

class SrcBundler {

    compilerOptions() {
        try {
            const tsconfig = fs.readFileSync('tsconfig.json', { encoding: "utf-8" })
            return JSON.parse(strip_json_comments(tsconfig)).compilerOptions
        } catch (error) {
            return {}
        }
    }

    createBrowserify() {
        return browserify({
            cache: {},
            packageCache: {},
        })
            .add('src/main.ts')
            .plugin(tsify, this.compilerOptions())
            .transform(function (file) {
                var data = '';
                return through(write, end);
                function write(buf) { data += buf }
                function end() {
                    if (file == path.resolve('src/main.ts')) {
                        data = resBundler.bundle() + "\n" + data
                    }
                    this.queue(data);
                    this.queue(null);
                }
            })
            .transform('uglifyify', { sourceMap: false })
    }

    watch(dest) {
        const b = this.createBrowserify()
        b.plugin(watchify)
            .on('update', () => {
                b.bundle(function (err) {
                    if (!err) {
                        if (dest === "node_modules/.tmp/app.js") {
                            fs.writeFileSync("node_modules/.tmp/app.js.version", new Date().getTime())
                        }
                        console.log("✅ Built at: " + new Date())
                    }
                })
                    .on('error', (error) => {
                        this.watchDelay(error, dest)
                    })
                    .pipe(fs.createWriteStream(dest));
                console.log("📌 Started at: " + new Date())
            })
        b.bundle(function (err) {
            if (!err) {
                if (dest === "node_modules/.tmp/app.js") {
                    fs.writeFileSync("node_modules/.tmp/app.js.version", new Date().getTime())
                }
                console.log("✅ Built at: " + new Date())
            }
        })
            .on('error', (error) => {
                this.watchDelay(error, dest)
            })
            .pipe(fs.createWriteStream(dest))
        console.log("📌 Started at: " + new Date())
    }

    watchDelay(error, dest) {
        if (this.lastError === undefined || error.message !== this.lastError.message) {
            this.lastError = error
            console.error(error)
            console.error("💔 Built failed: " + new Date())
            console.log("🚥 Compiler will try after 5 second.")
        }
        else {
            console.log("🚥 Still failed. Compiler will try after 5 second.")
        }
        clearTimeout(this.watchTimer)
        this.watchTimer = setTimeout(function () {
            this.watch(dest)
        }.bind(this), 5000)
    }

    build(dest) {
        const b = this.createBrowserify()
        b.bundle(function () {
            console.log("✅ Built at: " + new Date())
        })
            .pipe(fs.createWriteStream(dest));
        console.log("📌 Started at: " + new Date())
    }

    debug(port) {
        try {
            fs.mkdirSync('node_modules/.tmp')
        } catch (error) { }
        this.watch('node_modules/.tmp/app.js')
        http.createServer((request, response) => {
            if (request.url === "/console") {
                let body = '';
                request.on('data', chunk => {
                    body += chunk.toString();
                });
                request.on('end', () => {
                    try {
                        let params = JSON.parse(body)
                        params.values.unshift("📝")
                        console[params.type].apply(this, params.values)
                    } catch (error) { }
                    response.end('ok');
                });
            }
            else if (request.url === "/version") {
                response.end(fs.readFileSync("node_modules/.tmp/app.js.version", { encoding: "utf-8" }))
            }
            else if (request.url === "/source") {
                response.end(fs.readFileSync("node_modules/.tmp/app.js", { encoding: "utf-8" }))
            }
            else {
                response.end("")
            }
        }).listen(port)
        this.printIPs(port)
    }

    printIPs(port) {
        var os = require('os');
        var ifaces = os.networkInterfaces();
        Object.keys(ifaces).forEach(function (ifname) {
            var alias = 0;
            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                    return;
                }
                if (alias >= 1) {
                    console.log("Debug Server", iface.address, port);
                } else {
                    console.log("Debug Server", iface.address, port);
                }
                ++alias;
            });
        });
    }

}

const resBundler = new ResBundler()
const srcBundler = new SrcBundler()
const outputFile = process.argv.indexOf("--output") >= 0 ? process.argv[process.argv.indexOf("--output") + 1] : './build/app.js'

if (process.argv.includes('build')) {
    srcBundler.build(outputFile)
}
else if (process.argv.includes('watch')) {
    srcBundler.watch(outputFile)
}
else if (process.argv.includes('debug')) {
    const port = process.argv.indexOf("--port") >= 0 ? process.argv[process.argv.indexOf("--port") + 1] : 8090
    srcBundler.debug(port)
}
else if (process.argv.includes('init')) {
    new ProjectManager().init()
}
else {
    srcBundler.build(outputFile)
}
