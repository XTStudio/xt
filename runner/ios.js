"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const child_process = require('child_process');
const utils_1 = require("./utils");
let currentProcess;
class iOSRunner {
    constructor() {
        this.projectName = (() => {
            const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }));
            return pkg.name;
        })();
        this.platform = "iOS Simulator";
        this.device = "iPhone 8";
        this.os = "0.0";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`You may change parameters by using the same variables, such as '... --device "iPhone 7" --os "11.0"'.`);
            try {
                this.checkCurrentOS();
                yield this.checkXcode();
                yield this.parseXcodeInfo();
                console.log(`Current enviorment, platform = ${this.platform}, device = ${this.device}, os = ${this.os}`);
                yield this.checkCocoaPods();
                this.installModules();
                yield this.podinstall();
                yield this.xcodebuild();
                this.runSimulator();
            }
            catch (error) {
                console.error(error.message);
            }
        });
    }
    checkCurrentOS() {
        if (process.platform !== "darwin") {
            throw Error("Only macOS could build iOS application.");
        }
    }
    checkXcode() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield utils_1.cmdExists('xcodebuild');
            }
            catch (error) {
                throw Error("Please install Xcode first. And install Xcode command line tools using 'xcode-select --install'");
            }
        });
    }
    parseXcodeInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => {
                const listProcess = child_process.exec(`xcrun simctl list`);
                let listOutput = '';
                listProcess.stdout.on("data", (data) => {
                    listOutput += data.toString();
                });
                listProcess.on("exit", () => {
                    const matches = listOutput.match(/-- iOS (.*?) --/ig);
                    if (matches) {
                        const versions = matches.map(it => it.replace("-- iOS ", "").replace(" --", ""));
                        if (versions.indexOf(this.os) < 0) {
                            this.os = utils_1.latestVersion(versions);
                            res();
                        }
                    }
                    if (listOutput.indexOf(this.device) < 0) {
                        this.device = "iPhone 8";
                    }
                });
            });
        });
    }
    checkCocoaPods() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield utils_1.cmdExists('pod');
            }
            catch (error) {
                throw Error("Please install CocoaPods. How to install? https://cocoapods.org");
            }
        });
    }
    installModules() {
        if (!fs.existsSync('./node_modules/.bin/ios-sim')) {
            console.log("Installing ios-sim...");
            child_process.execSync('npm i ios-sim --no-save', { cwd: './', stdio: "inherit" });
        }
    }
    podinstall() {
        console.log("Runing pod install ...");
        return new Promise((res, rej) => {
            try {
                child_process.execSync(`pod install`, { cwd: './platform/ios/', stdio: "inherit" });
                res();
            }
            catch (error) {
                rej(error);
            }
        });
    }
    xcodebuild() {
        console.log("Runing xcodebuild ...");
        return new Promise((res, rej) => {
            try {
                child_process.execSync(`xcrun xcodebuild -scheme ${this.projectName} -workspace ${this.projectName}.xcworkspace -configuration Debug -destination 'platform=${this.platform},name=${this.device},OS=${this.os}' -derivedDataPath build CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO`, { cwd: './platform/ios/', stdio: "inherit" });
                res();
            }
            catch (error) {
                rej(error);
            }
        });
    }
    runSimulator() {
        console.log("Runing on iOS Simulator...");
        child_process.exec(`ios-sim launch ${this.projectName}.app --devicetypeid "${this.device.replace(/ /ig, '-')}, ${this.os}"`, { cwd: `./platform/ios/build/Build/Products/Debug-iphonesimulator` });
    }
}
exports.iOSRunner = iOSRunner;
