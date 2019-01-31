const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
import { cmdExists, latestVersion } from "./utils";

let currentProcess: any

export class iOSRunner {

    projectName: string = (() => {
        const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }))
        return pkg.name
    })()

    platform = "iOS Simulator"
    device = "iPhone 8"
    os = "0.0"

    async run() {
        console.log(`You may change parameters by using the same variables, such as '... --device "iPhone 7" --os "11.0"'.`)
        try {
            this.checkCurrentOS()
            await this.checkXcode()
            if (this.platform === "iPhone") {
                console.log(`Current enviorment, platform = ${this.platform}`)
                await this.checkCocoaPods()
                this.installModules(true)
                await this.podinstall()
                await this.xcodebuild(true)
                this.runIPhone()
            }
            else {
                await this.parseXcodeInfo()
                console.log(`Current enviorment, platform = ${this.platform}, device = ${this.device}, os = ${this.os}`)
                await this.checkCocoaPods()
                this.installModules()
                await this.podinstall()
                await this.xcodebuild()
                this.runSimulator()
            }
        } catch (error) {
            console.error(error.message)
        }
    }

    private checkCurrentOS() {
        if (process.platform !== "darwin") {
            throw Error("Only macOS could build iOS application.")
        }
    }

    private async checkXcode() {
        try {
            await cmdExists('xcodebuild')
        } catch (error) {
            throw Error("Please install Xcode first. And install Xcode command line tools using 'xcode-select --install'")
        }
    }

    private async parseXcodeInfo() {
        return new Promise((res, rej) => {
            const listProcess = child_process.exec(`xcrun simctl list`)
            let listOutput = ''
            listProcess.stdout.on("data", (data: any) => {
                listOutput += data.toString()
            })
            listProcess.on("exit", () => {
                const matches = listOutput.match(/-- iOS (.*?) --/ig)
                if (matches) {
                    const versions = matches.map(it => it.replace("-- iOS ", "").replace(" --", ""))
                    if (versions.indexOf(this.os) < 0) {
                        this.os = latestVersion(versions)
                        res()
                    }
                }
                if (listOutput.indexOf(this.device) < 0) {
                    this.device = "iPhone 8"
                }
            })
        })
    }

    private async checkCocoaPods() {
        try {
            await cmdExists('pod')
        } catch (error) {
            throw Error("Please install CocoaPods. How to install? https://cocoapods.org")
        }
    }

    private installModules(isPhone: boolean = false) {
        if (isPhone && !fs.existsSync('./node_modules/.bin/ios-deploy')) {
            child_process.execSync('npm install ios-deploy', { cwd: './', stdio: "inherit" })
        }
        if (!isPhone && !fs.existsSync('./node_modules/.bin/ios-sim')) {
            console.log("Installing ios-sim...")
            child_process.execSync('npm i ios-sim', { cwd: './', stdio: "inherit" })
        }
    }

    private podinstall(): Promise<any> {
        console.log("Runing pod install ...")
        return new Promise((res, rej) => {
            try {
                child_process.execSync(`pod install`, { cwd: './platform/ios/', stdio: "inherit" })
                res()
            } catch (error) {
                rej(error)
            }
        })
    }

    private xcodebuild(isPhone: boolean = false): Promise<any> {
        console.log("Runing xcodebuild ...")
        return new Promise((res, rej) => {
            try {
                if (isPhone) {
                    child_process.execSync(`xcrun xcodebuild -scheme ${this.projectName} -workspace ${this.projectName}.xcworkspace -configuration Debug -sdk iphoneos -derivedDataPath build`, { cwd: './platform/ios/', stdio: "inherit" })
                }
                else {
                    child_process.execSync(`xcrun xcodebuild -scheme ${this.projectName} -workspace ${this.projectName}.xcworkspace -configuration Debug -destination 'platform=${this.platform},name=${this.device},OS=${this.os}' -derivedDataPath build CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO`, { cwd: './platform/ios/', stdio: "inherit" })
                }
                res()
            } catch (error) {
                rej(error)
            }
        })
    }

    private runSimulator() {
        console.log("Runing on iOS Simulator...")
        child_process.exec(`node ${path.resolve('./node_modules/.bin/ios-sim')} launch ${this.projectName}.app --devicetypeid "${this.device.replace(/ /ig, '-')}, ${this.os}"`, { cwd: `./platform/ios/build/Build/Products/Debug-iphonesimulator` })
    }

    private runIPhone() {
        console.log("Runing on iPhone...")
        child_process.exec(`${path.resolve('./node_modules/.bin/ios-deploy')} -L -b ${this.projectName}.app`, { cwd: `./platform/ios/build/Build/Products/Debug-iphoneos` })
    }

}