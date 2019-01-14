const fs = require('fs')
const xml2js = require('xml2js')
const child_process = require('child_process')
import { cmdExists } from "./utils";

export class AndroidRunner {

    packageName: string = ""
    mainActivityName: string = ""

    async run() {
        try {
            await this.checkAndroidSDK()
            await this.parseManifest()
            await this.checkAdb()
            await this.checkDevice()
            await this.gradleBuild()
            await this.runMainActivity()
        } catch (error) {
            console.error(error.message)
        }
    }

    private checkAndroidSDK() {
        return new Promise((res, rej) => {
            const echoProcess = child_process.exec("echo $ANDROID_HOME")
            echoProcess.stdout.on("data", (data: any) => {
                const dir = data.toString().trim()
                if (dir === undefined || dir.length === 0) {
                    rej(Error("ANDROID_HOME not found. Please setup ANDROID_HOME, See https://stackoverflow.com/questions/19986214/setting-android-home-enviromental-variable-on-mac-os-x ."))
                }
                else {
                    if (fs.existsSync(dir)) {
                        res()
                    }
                    else {
                        rej(Error("ANDROID_HOME not found. Please setup ANDROID_HOME, See https://stackoverflow.com/questions/19986214/setting-android-home-enviromental-variable-on-mac-os-x ."))
                    }
                }
            })
        })
    }

    private parseManifest(): Promise<any> {
        return new Promise((res, rej) => {
            const manifestContent = fs.readFileSync('platform/android/app/src/main/AndroidManifest.xml', { encoding: 'utf-8' })
            xml2js.parseString(manifestContent, (error: Error | undefined, result: any) => {
                if (error) {
                    rej(error)
                }
                else {
                    this.packageName = result.manifest.$.package
                    result.manifest.application[0].activity.forEach((it: any) => {
                        try {
                            if (it["intent-filter"][0].action[0].$["android:name"] === "android.intent.action.MAIN" &&
                                it["intent-filter"][0].category[0].$["android:name"] === "android.intent.category.LAUNCHER") {
                                this.mainActivityName = it.$["android:name"]
                            }
                        } catch (error) { }
                    })
                    if (this.packageName === "" || this.mainActivityName === "") {
                        rej(Error("Cannot found package name or main activity on Android app manifest.xml ."))
                    }
                    else {
                        res()
                    }
                }
            })
        })
    }

    private async checkAdb() {
        try {
            await cmdExists('adb')
        } catch (error) {
            throw Error("Please install Android Studio first. Then install Android SDK.")
        }
    }

    private async checkDevice() {
        return new Promise((res, rej) => {
            const process = child_process.exec(`adb devices`)
            process.stdout.on("data", (data: any) => {
                const lines = data.replace("List of devices attached\n", "").split("\n")
                const count = lines.filter((it: string) => it.indexOf("device") >= 0).length
                if (count === 0) {
                    rej(Error("Android device not found. Please connect a device via USB, or create and start an emulator via Android Studio."))
                }
                else if (count > 1) {
                    rej(Error("There are more than one device connected, please disconnect until just one."))
                }
                else {
                    res()
                }
            })
        })
    }

    private gradleBuild(): Promise<any> {
        console.log("Runing gradle build ...")
        return new Promise((res, rej) => {
            try {
                child_process.execSync(`adb shell am force-stop ${this.packageName}`, { cwd: './platform/android/', stdio: "inherit" })
                child_process.execSync(`sh ./gradlew installDebug`, { cwd: './platform/android/', stdio: "inherit" })
                res()
            } catch (error) {
                rej(error)
            }
        })
    }

    private async runMainActivity() {
        child_process.execSync(`adb shell am start -n ${this.packageName}/${this.mainActivityName}`, { cwd: './platform/android/', stdio: "inherit" })
    }

}