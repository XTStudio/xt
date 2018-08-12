#!/usr/bin/env node
var browserify = require('browserify')
var watchify = require('watchify')
var tsify = require('tsify')
var through = require('through')
var fs = require('fs')
var path = require('path')
var strip_json_comments = require('strip-json-comments')

class ProjectManager {

    init() {
        fs.mkdirSync('build')
        fs.mkdirSync('res')
        fs.mkdirSync('src')
        fs.writeFileSync('src/main.ts', `
            const main = new UIView
        `)
        fs.writeFileSync('tsconfig.json', `
        {
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
        }
        `)
        const package = fs.readFileSync('package.json', { encoding: "utf-8" })
        package.scripts = {
            watch: './node_modules/.bin/xt watch',
            build: './node_modules/.bin/xt build',
        }
        fs.writeFileSync('package.json', JSON.stringify(package))
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
            return `Bundle.js["${it.replace('res/', '')}"] = "${content}";`
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

    watch() {
        const b = this.createBrowserify()
        b.plugin(watchify)
            .on('update', () => {
                b.bundle()
                    .on('error', (error) => {
                        console.error(error)
                        process.exit(-1);
                    })
                    .pipe(fs.createWriteStream('./build/app.js'));
                console.log("Built at: " + new Date())
            })
        b.bundle()
            .on('error', console.error)
            .pipe(fs.createWriteStream('./build/app.js'));
        console.log("Built at: " + new Date())
    }

    build() {
        const b = this.createBrowserify()
        b.bundle()
            .pipe(fs.createWriteStream('./build/app.js'));
        console.log("Built at: " + new Date())
    }

}

const resBundler = new ResBundler()
const srcBundler = new SrcBundler()

if (process.argv.includes('build')) {
    srcBundler.build()
}
else if (process.argv.includes('watch')) {
    srcBundler.watch()
}
else if (process.argv.includes('init')) {
    new ProjectManager().init()
}
else {
    srcBundler.build()
}