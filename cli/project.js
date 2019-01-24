"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const utils_1 = require("./utils");
class ProjectInitializer {
    init() {
        fs.writeFileSync(".gitignore", `
node_modules/
.npm
npm-debug.log*
`);
        fs.mkdirSync('build');
        fs.mkdirSync('res');
        fs.mkdirSync('src');
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
`);
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
}`);
        const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }));
        pkg.scripts = {
            watch: `./node_modules/.bin/xt watch`,
            build: `./node_modules/.bin/xt build`,
            debug: './node_modules/.bin/xt debug',
            chrome: "./node_modules/.bin/xt debug run chrome",
            ios: "./node_modules/.bin/xt debug run ios",
            android: "./node_modules/.bin/xt debug run android",
        };
        fs.writeFileSync('package.json', JSON.stringify(pkg, undefined, 4));
        fs.mkdirSync(".vscode");
        fs.writeFileSync(".vscode/launch.json", `
        {
            // 使用 IntelliSense 了解相关属性。 
            // 悬停以查看现有属性的描述。
            // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
            "version": "0.2.0",
            "configurations": [
                {
                    "type": "xt",
                    "request": "launch",
                    "name": "Debug XT on Chrome",
                    "platform": "chrome",
                    "workspace": "\${workspaceFolder}"
                },
                {
                    "type": "xt",
                    "request": "launch",
                    "name": "Debug XT on Android Emulator",
                    "platform": "android",
                    "workspace": "\${workspaceFolder}"
                },
                {
                    "type": "xt",
                    "request": "launch",
                    "name": "Debug XT on iOS Simulator",
                    "platform": "ios",
                    "workspace": "\${workspaceFolder}"
                }
            ]
        }
        `);
        this.copy();
        this.rename();
    }
    copy() {
        fs.mkdirSync('./platform');
        utils_1.fsDeepCopy(__dirname + '/../program/platform', './platform');
    }
    rename() {
        const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }));
        const projectName = pkg.name;
        this._renameDirs(projectName, "platform");
    }
    _renameDirs(projectName, path) {
        fs.readdirSync(path).forEach(it => {
            if (it.indexOf("SimpleProject") >= 0 || it.indexOf("simpleproject") >= 0) {
                fs.renameSync(`${path}/${it}`, `${path}/${it.replace(/SimpleProject/ig, projectName)}`);
            }
        });
        fs.readdirSync(path).forEach(it => {
            if (fs.lstatSync(`${path}/${it}`).isDirectory()) {
                this._renameDirs(projectName, `${path}/${it}`);
            }
            else {
                this._renameContents(projectName, `${path}/${it}`);
            }
        });
    }
    _renameContents(projectName, path) {
        const contents = fs.readFileSync(path, { encoding: "utf-8" });
        if (typeof contents === "string") {
            try {
                fs.writeFileSync(path, contents.replace(/SimpleProject/ig, projectName));
            }
            catch (error) { }
        }
    }
}
exports.ProjectInitializer = ProjectInitializer;
