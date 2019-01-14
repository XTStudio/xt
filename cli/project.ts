import * as fs from "fs";
import { fsDeepCopy } from "./utils";

export class ProjectInitializer {

    init() {
        fs.writeFileSync(".gitignore", `
node_modules/
.npm
npm-debug.log*
`)
        fs.mkdirSync('build')
        fs.mkdirSync('res')
        fs.mkdirSync('src')
        fs.writeFileSync('src/main.ts', `
class MainViewController extends UIViewController {

    fooLabel = new UILabel

    viewDidLoad() {
        super.viewDidLoad()
        this.fooLabel.textAlignment = UITextAlignment.center
        this.fooLabel.text = "Hello, World!"
        this.view.addSubview(this.fooLabel)
    }

    viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        this.fooLabel.frame = this.view.bounds
    }

}

global.main = new MainViewController
`)
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
        "experimentalDecorators": true,
        "types": [
            "xt-studio"
        ]
    }
}`)
        const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }))
        const projectName = pkg.name
        pkg.scripts = {
            watch: `./node_modules/.bin/xt watch & ./node_modules/.bin/xt watch --output ./platform/ios/${projectName}/JSBundle/app.js & ./node_modules/.bin/xt watch --output ./platform/web/app.js & ./node_modules/.bin/xt watch --output ./platform/android/app/src/main/assets/app.js & ./node_modules/.bin/xt watch --wx --output ./platform/wx/src/app.js`,
            build: `./node_modules/.bin/xt build & ./node_modules/.bin/xt build --output ./platform/ios/${projectName}/JSBundle/app.js & ./node_modules/.bin/xt build --output ./platform/web/app.js & ./node_modules/.bin/xt build --output ./platform/android/app/src/main/assets/app.js & ./node_modules/.bin/xt build --wx --output ./platform/wx/src/app.js`,
            debug: './node_modules/.bin/xt debug',
            web: "cd platform/web && http-server -c-1",
            ios: "open platform/ios/*.xcworkspace",
            android: "",
        }
        fs.writeFileSync('package.json', JSON.stringify(pkg, undefined, 4))
        this.copy()
        this.rename()
    }

    private copy() {
        fs.mkdirSync('./platform')
        fsDeepCopy(__dirname + '/../program/platform', './platform')
    }

    private rename() {
        const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }))
        const projectName = pkg.name
        this._renameDirs(projectName, "platform")
    }

    private _renameDirs(projectName: string, path: string) {
        fs.readdirSync(path).forEach(it => {
            if (it.indexOf("SimpleProject") >= 0 || it.indexOf("simpleproject") >= 0) {
                fs.renameSync(`${path}/${it}`, `${path}/${it.replace(/SimpleProject/ig, projectName)}`)
            }
        })
        fs.readdirSync(path).forEach(it => {
            if (fs.lstatSync(`${path}/${it}`).isDirectory()) {
                this._renameDirs(projectName, `${path}/${it}`)
            }
            else {
                this._renameContents(projectName, `${path}/${it}`)
            }
        })
    }

    private _renameContents(projectName: string, path: string) {
        const contents = fs.readFileSync(path, { encoding: "utf-8" })
        if (typeof contents === "string") {
            try {
                fs.writeFileSync(path, contents.replace(/SimpleProject/ig, projectName))
            } catch (error) { }
        }
    }

}