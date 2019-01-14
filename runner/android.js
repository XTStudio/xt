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
const xml2js = require('xml2js');
const child_process = require('child_process');
const utils_1 = require("./utils");
class AndroidRunner {
    constructor() {
        this.packageName = "";
        this.mainActivityName = "";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.checkAndroidSDK();
                yield this.parseManifest();
                yield this.checkAdb();
                yield this.checkDevice();
                yield this.gradleBuild();
                yield this.runMainActivity();
            }
            catch (error) {
                console.error(error.message);
            }
        });
    }
    checkAndroidSDK() {
        return new Promise((res, rej) => {
            const echoProcess = child_process.exec("echo $ANDROID_HOME");
            echoProcess.stdout.on("data", (data) => {
                const dir = data.toString().trim();
                if (dir === undefined || dir.length === 0) {
                    rej(Error("ANDROID_HOME not found. Please setup ANDROID_HOME, See https://stackoverflow.com/questions/19986214/setting-android-home-enviromental-variable-on-mac-os-x ."));
                }
                else {
                    if (fs.existsSync(dir)) {
                        res();
                    }
                    else {
                        rej(Error("ANDROID_HOME not found. Please setup ANDROID_HOME, See https://stackoverflow.com/questions/19986214/setting-android-home-enviromental-variable-on-mac-os-x ."));
                    }
                }
            });
        });
    }
    parseManifest() {
        return new Promise((res, rej) => {
            const manifestContent = fs.readFileSync('platform/android/app/src/main/AndroidManifest.xml', { encoding: 'utf-8' });
            xml2js.parseString(manifestContent, (error, result) => {
                if (error) {
                    rej(error);
                }
                else {
                    this.packageName = result.manifest.$.package;
                    result.manifest.application[0].activity.forEach((it) => {
                        try {
                            if (it["intent-filter"][0].action[0].$["android:name"] === "android.intent.action.MAIN" &&
                                it["intent-filter"][0].category[0].$["android:name"] === "android.intent.category.LAUNCHER") {
                                this.mainActivityName = it.$["android:name"];
                            }
                        }
                        catch (error) { }
                    });
                    if (this.packageName === "" || this.mainActivityName === "") {
                        rej(Error("Cannot found package name or main activity on Android app manifest.xml ."));
                    }
                    else {
                        res();
                    }
                }
            });
        });
    }
    checkAdb() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield utils_1.cmdExists('adb');
            }
            catch (error) {
                throw Error("Please install Android Studio first. Then install Android SDK.");
            }
        });
    }
    checkDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => {
                const process = child_process.exec(`adb devices`);
                process.stdout.on("data", (data) => {
                    const lines = data.replace("List of devices attached\n", "").split("\n");
                    const count = lines.filter((it) => it.indexOf("device") >= 0).length;
                    if (count === 0) {
                        rej(Error("Android device not found. Please connect a device via USB, or create and start an emulator via Android Studio."));
                    }
                    else if (count > 1) {
                        rej(Error("There are more than one device connected, please disconnect until just one."));
                    }
                    else {
                        res();
                    }
                });
            });
        });
    }
    gradleBuild() {
        console.log("Runing gradle build ...");
        return new Promise((res, rej) => {
            try {
                child_process.execSync(`adb shell am force-stop ${this.packageName}`, { cwd: './platform/android/', stdio: "inherit" });
                child_process.execSync(`sh ./gradlew installDebug`, { cwd: './platform/android/', stdio: "inherit" });
                res();
            }
            catch (error) {
                rej(error);
            }
        });
    }
    runMainActivity() {
        return __awaiter(this, void 0, void 0, function* () {
            child_process.execSync(`adb shell am start -n ${this.packageName}/${this.mainActivityName}`, { cwd: './platform/android/', stdio: "inherit" });
        });
    }
}
exports.AndroidRunner = AndroidRunner;
