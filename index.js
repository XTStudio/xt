#!/usr/bin/env node

const fs = require('fs')

if (!fs.existsSync("package.json")) {
    throw Error("You should run [npm init] first.")
}

const program = require('commander')
const { ProjectInitializer } = require('./cli/project')
const { Packager } = require('./cli/packager')
const { ChromeRunner } = require('./runner/chrome')
const { iOSRunner } = require('./runner/ios')
const { AndroidRunner } = require('./runner/android')
const { QRCodeRunner } = require('./runner/qrcode')
const { WXRunner } = require('./runner/wx')

program
    .version(JSON.parse(fs.readFileSync(__dirname + "/package.json", { encoding: "utf-8" })).version)
    .option('init', 'initialize a XT project')
    .option('build', 'trigger a build')
    .option('watch', 'trigger a build and watch files change')
    .option('debug', 'trigger a debug build and watch files change')
    .option('run [run]', 'specific a debugging target <ios, android, chrome, wx>')
    .option('-o, --output [output]', 'specific app.js destination')
    .option('-p, --port [port]', 'specific the debugger port')
    .option('--platform [platform]')
    .option('--device [device]')
    .option('--os [os]')
    .option('--wx')
    .parse(process.argv)

const runClient = () => {
    if (program.run === "chrome") {
        new ChromeRunner().run()
    }
    else if (program.run === "qrcode") {
        new QRCodeRunner().run()
    }
    else if (program.run === "ios") {
        const runner = new iOSRunner()
        if (program.platform) {
            runner.platform = program.platform
        }
        if (program.device) {
            runner.device = program.device
        }
        if (program.os) {
            runner.os = program.os
        }
        runner.run()
    }
    else if (program.run === "android") {
        new AndroidRunner().run()
    }
    else if (program.run === "wx") {
        console.info("微信小程序暂未支持断点调试、Log、监视器等调试功能。")
        new WXRunner().run()
    }
}

if (program.init) {
    new ProjectInitializer().init()
}
else if (program.debug) {
    new Packager(program.run === "wx" ? "platform/wx/src/app.js" : "", true).debug(program.port || 8090).then(() => {
        runClient()
    })
}
else {
    new Packager(program.output, program.watch !== undefined).build().then(() => {
        runClient()
    })
}
