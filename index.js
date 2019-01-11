#!/usr/bin/env node

const fs = require('fs')
const program = require('commander')
const { ProjectInitializer } = require('./cli/project')
const { Packager } = require('./cli/packager')
const { ChromeRunner } = require('./runner/chrome')

program
    .version(JSON.parse(fs.readFileSync(__dirname + "/package.json", { encoding: "utf-8" })).version)
    .option('-i, --init', 'initialize a XT project')
    .option('-o, --output', 'specific app.js destination')
    .option('-b, --build', 'trigger a build')
    .option('-w, --watch', 'trigger a build and watch files change')
    .option('-d, --debug', 'trigger a debug build and watch files change')
    .option('-p, --port', 'specific the debugger port')
    .option('-r, --run', 'specific a debugging target <ios, android, chrome, wx>')
    .parse(process.argv)

if (program.init) {
    new ProjectInitializer().init()
}
else if (program.debug) {
    new Packager("", true).debug(program.port || 8090)
    if (program.run) {
        new ChromeRunner().run()
    }
}
else {
    new Packager((program.output || "build/app.js"), program.watch !== undefined).build()
}