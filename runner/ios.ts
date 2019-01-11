const fs = require('fs')
const child_process = require('child_process')
import { cmdExists } from "./utils";

export class iOSRunner {

    projectName: string = (() => {
        const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }))
        return pkg.name
    })()

    platform = "iOS Simulator"
    device = "iPhone 8"
    os = "12.0"

    async run() {
        console.log(`Current enviorment, platform = ${this.platform}, device = ${this.device}, os = ${this.os}`)
        console.log(`You may change parameters by using the same variables, such as '... --device "iPhone 7" --os "11.0"'.`)
        try {
            this.checkCurrentOS()
            await this.checkXcode()
            await this.checkCocoaPods()
            this.installModules()
            await this.xcodebuild()
            this.runSimulator()
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

    private async checkCocoaPods() {
        try {
            await cmdExists('pod')
        } catch (error) {
            throw Error("Please install CocoaPods. How to install? https://cocoapods.org")
        }
    }

    private installModules() {
        if (!fs.existsSync('./node_modules/.bin/ios-sim')) {
            console.log("Installing ios-sim...")
            child_process.execSync('npm i ios-sim --no-save', { cwd: './' })
        }
    }

    private xcodebuild(): Promise<any> {
        console.log("Runing xcodebuild...")
        return new Promise((res, rej) => {
            const buildProcess = child_process.exec(`xcrun xcodebuild -scheme ${this.projectName} -workspace ${this.projectName}.xcworkspace -configuration Debug -destination 'platform=${this.platform},name=${this.device},OS=${this.os}' -derivedDataPath build`, { cwd: './platform/ios/' })
            buildProcess.stdout.on('data', function (data: any) {
                console.log(data.toString());
            });
            buildProcess.stderr.on('data', function (data: any) {
                console.error(data.toString());
            });
            buildProcess.on('exit', function (code: any) {
                if (code === 0) {
                    res()
                }
                else {
                    rej(Error("xcodebuild failed with code: " + code.toString()))
                }
            });
        })
    }

    private runSimulator() {
        console.log("Installing on iOS Simulator...")
        child_process.exec(`ios-sim launch ${this.projectName}.app --devicetypeid "${this.device.replace(/ /ig, '-')}, ${this.os}"`, { cwd: `./platform/ios/build/Build/Products/Debug-iphonesimulator` })
    }

}