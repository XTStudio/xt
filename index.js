#!/usr/bin/env node
var browserify = require('browserify')
var watchify = require('watchify')
var tsify = require('tsify')
var ts = require('typescript')
var through = require('through')
var fs = require('fs')
var path = require('path')
var http = require('http')
var strip_json_comments = require('strip-json-comments')
var colors = require('colors/safe');

var fsDeepCopy = function (srcDir, dstDir) {
    var results = [];
    var list = fs.readdirSync(srcDir);
    var src, dst;
    list.forEach(function (file) {
        src = srcDir + '/' + file;
        dst = dstDir + '/' + file;
        var stat = fs.statSync(src);
        if (stat && stat.isDirectory()) {
            try {
                fs.mkdirSync(dst);
            } catch (e) { }
            results = results.concat(fsDeepCopy(src, dst));
        } else {
            try {
                fs.writeFileSync(dst, fs.readFileSync(src));
            } catch (e) { }
            results.push(src);
        }
    });
    return results;
};

(() => {
    {
        var originMethod = console.error
        console.error = function () {
            let args = []
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.red(arguments[index]))
            }
            originMethod.apply(undefined, args)
        }
    }
    {
        var originMethod = console.warn
        console.warn = function () {
            let args = []
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.yellow(arguments[index]))
            }
            originMethod.apply(undefined, args)
        }
    }
    {
        var originMethod = console.debug
        console.debug = function () {
            let args = []
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.blue(arguments[index]))
            }
            originMethod.apply(undefined, args)
        }
    }
    {
        var originMethod = console.info
        console.info = function () {
            let args = []
            for (let index = 0; index < arguments.length; index++) {
                args.push(colors.green(arguments[index]))
            }
            originMethod.apply(undefined, args)
        }
    }
})()

class ProjectManager {

    init() {
        if (!fs.existsSync("package.json")) {
            throw Error("You should run [npm init] first.")
        }
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
    }

    copy() {
        fs.mkdirSync('./platform')
        fsDeepCopy('./node_modules/xt-studio/platform', './platform')
    }

    rename() {
        const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: "utf-8" }))
        const projectName = pkg.name
        this._renameDirs(projectName, "platform")
    }

    _renameDirs(projectName, path) {
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

    _renameContents(projectName, path) {
        const contents = fs.readFileSync(path, { encoding: "utf-8" })
        if (typeof contents === "string") {
            try {
                fs.writeFileSync(path, contents.replace(/SimpleProject/ig, projectName))
            } catch (error) { }
        }
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
            return `Bundle.js.addResource("${it.replace('res/', '')}", "${content}");`
        }).join("\n")
    }

}

class SrcBundler {

    constructor(dest, debugging) {
        this.dest = dest
        this.debugging = debugging
        this.reloadingCodes = {}
    }

    compilerOptions() {
        try {
            const tsconfig = fs.readFileSync('tsconfig.json', { encoding: "utf-8" })
            return JSON.parse(strip_json_comments(tsconfig)).compilerOptions
        } catch (error) {
            return {}
        }
    }

    createBrowserify() {
        var self = this
        var instance = browserify({
            cache: {},
            packageCache: {},
            debug: this.debugging,
            ignoreMissing: true,
        })
            .add('src/main.ts')
            .plugin(tsify, this.compilerOptions())
            .transform(function (file) {
                var data = '';
                return through(write, end);
                function write(buf) { data += buf }
                function end() {
                    if (file.endsWith(".ts") && data.indexOf(`UIReload("`) >= 0) {
                        self.fetchReloadingNode(file)
                    }
                    if (file == path.resolve('src/main.ts')) {
                        data = resBundler.bundle() + "\n" + data
                    }
                    this.queue(data);
                    this.queue(null);
                }
            })
        if (this.debugging !== true) {
            instance = instance.transform('uglifyify', { sourceMap: false })
        }
        return instance
    }

    fetchReloadingNode(file) {
        const program = ts.createProgram([file], { noResolve: true })
        const sourceFile = program.getSourceFile(file)
        const fetchNode = (node) => {
            if (ts.isClassDeclaration(node) && node.decorators && node.decorators.length > 0 && node.decorators.filter(it => it.getText(sourceFile).indexOf("@UIReload") >= 0)) {
                const reloadIdentifier = (() => {
                    const decorator = node.decorators.filter(it => it.getText(sourceFile).indexOf("@UIReload") >= 0)[0]
                    return decorator.expression.arguments[0].text
                })()
                this.reloadingCodes[reloadIdentifier] = node.getText(sourceFile)
            }
            node.forEachChild(it => fetchNode(it))
        }
        fetchNode(sourceFile)
    }

    diffReloadingNode(file) {
        let nodeChanges = []
        const program = ts.createProgram([file], { noResolve: true })
        const sourceFile = program.getSourceFile(file)
        const fetchNode = (node) => {
            if (ts.isClassDeclaration(node) && node.decorators && node.decorators.length > 0 && node.decorators.filter(it => it.getText(sourceFile).indexOf("@UIReload") >= 0)) {
                const reloadIdentifier = (() => {
                    const decorator = node.decorators.filter(it => it.getText(sourceFile).indexOf("@UIReload") >= 0)[0]
                    return decorator.expression.arguments[0].text
                })()
                if (this.reloadingCodes[reloadIdentifier] !== node.getText(sourceFile)) {
                    node.sourceFile = sourceFile
                    nodeChanges.push(node)
                }
            }
            node.forEachChild(it => fetchNode(it))
        }
        fetchNode(sourceFile)
        return nodeChanges
    }

    buildReloading(nodes) {
        if (nodes.length == 0) { return }
        if (this.dest !== "node_modules/.tmp/app.js") { return }
        let dist = ''
        nodes.forEach(node => {
            if (ts.isClassDeclaration(node)) {
                const reloadIdentifier = (() => {
                    const decorator = node.decorators.filter(it => it.getText(node.sourceFile).indexOf("@UIReload") >= 0)[0]
                    return decorator.expression.arguments[0].text
                })()
                let extendsName = undefined
                if (node.heritageClauses) {
                    node.heritageClauses.forEach(it => {
                        if (it.token === ts.SyntaxKind.ExtendsKeyword) {
                            extendsName = it.getText(node.sourceFile).replace('extends ', '')
                        }
                    })
                }
                dist += `
                (function(){
                    ${extendsName ? `let ${extendsName} = UIReloader.shared.items["${reloadIdentifier}"].superItem.clazz.constructor;` : ''}
                    ${node.getText(node.sourceFile)}
                })()
                `
            }
        })
        fs.writeFileSync("node_modules/.tmp/reload.js", ts.transpile(dist, { target: ts.ScriptTarget.ES5 }))
    }

    build(watching, reloading) {
        if (this.locked === true) { this.waited = true; return }
        this.locked = true
        this.waited = false
        const b = this.createBrowserify()
        if (watching === true) {
            b.plugin(watchify)
                .on('update', (files) => {
                    let reloadingNodes = []
                    files.forEach(file => {
                        this.diffReloadingNode(file).forEach(it => reloadingNodes.push(it))
                    })
                    if (reloadingNodes.length > 0) {
                        this.buildReloading(reloadingNodes)
                    }
                    this.build(true, reloadingNodes.length > 0)
                })
        }
        b.bundle((error) => {
            if (error) {
                console.error(error)
            }
            else {
                if (this.dest === "node_modules/.tmp/app.js") {
                    fs.writeFileSync("node_modules/.tmp/app.js.version", new Date().getTime() + (reloading ? ".reload" : ""))
                }
                console.log("✅ Built at: " + new Date())
                return new ArrayBuffer(0)
            }
        })
            .on('error', (error) => {
                console.error(error);
            })
            .pipe((() => {
                let stream = fs.createWriteStream(this.dest)
                stream.on("close", () => {
                    this.wxPatch()
                    this.locked = false
                    if (this.waited) {
                        this.build(watching)
                    }
                })
                return stream
            })())
        console.log("📌 Started at: " + new Date())
    }

    wxPatch() {
        if (process.argv.indexOf("--wx") > 0) {
            let data = fs.readFileSync(this.dest, { encoding: "utf-8" })
            data = `;var Bundle, Data, MutableData, DispatchQueue, FileManager, Timer, URL, URLRequestCachePolicy, URLRequest, MutableURLRequest, URLResponse, URLSession, URLSessionTaskState, URLSessionTask, UserDefaults, UUID, CADisplayLink, CAGradientLayer, CALayer, CAShapeFillRule, CAShapeLineCap, CAShapeLineJoin, CAShapeLayer, KMCore, UIActionSheet, UIActivityIndicatorView, UIAlert, UIAffineTransformIdentity, UIAffineTransformMake, UIAffineTransformMakeTranslation, UIAffineTransformMakeScale, UIAffineTransformMakeRotation, UIAffineTransformTranslate, UIAffineTransformScale, UIAffineTransformRotate, UIAffineTransformInvert, UIAffineTransformConcat, UIAffineTransformEqualToTransform, UIAffineTransformIsIdentity, UIAnimator, UIAttributedStringKey, UIParagraphStyle, UIAttributedString, UIMutableAttributedString, UIBezierPath, UIButton, UICollectionElementKindCell, UICollectionViewItemKey, UICollectionViewLayoutAttributes, UICollectionViewLayout, UICollectionView, UICollectionReusableView, UICollectionViewCell, UICollectionViewData, UICollectionViewScrollDirection, UIFlowLayoutHorizontalAlignment, UICollectionViewFlowLayout, UIColor, UIConfirm, UIDevice, UIEdgeInsetsZero, UIEdgeInsetsMake, UIEdgeInsetsInsetRect, UIEdgeInsetsEqualToEdgeInsets, UIViewContentMode, UIControlState, UIControlContentVerticalAlignment, UIControlContentHorizontalAlignment, UITextAlignment, UILineBreakMode, UITextFieldViewMode, UITextAutocapitalizationType, UITextAutocorrectionType, UITextSpellCheckingType, UIKeyboardType, UIReturnKeyType, UILayoutConstraintAxis, UIStackViewDistribution, UIStackViewAlignment, UIStatusBarStyle, UIFetchMoreControl, UIFont, UIGestureRecognizerState, UIGestureRecognizer, UIImageRenderingMode, UIImage, UIImageView, UILabel, UILongPressGestureRecognizer, UINavigationItem, UIBarButtonItem, UINavigationBar, UINavigationBarViewController, UINavigationController, UIPageViewController, UIPanGestureRecognizer, UIPinchGestureRecognizer, UIPointZero, UIPointMake, UIPointEqualToPoint, UIProgressView, UIRectZero, UIRectMake, UIRectEqualToRect, UIRectInset, UIRectOffset, UIRectContainsPoint, UIRectContainsRect, UIRectIntersectsRect, UIRectUnion, UIRectIsEmpty, UIRefreshControl, UIRotationGestureRecognizer, UIScreen, UIScrollView, UISizeZero, UISizeMake, UISizeEqualToSize, UISlider, UIStackView, UISwitch, UITabBarController, UITapGestureRecognizer, UITableView, UITableViewCell, UITextField, UITextView, UITouchPhase, UITouch, UIView, UIWindow, UIViewController, UIWebView;(function(){ const _ = require("xt-framework-wx"); Bundle = _.Bundle;Data = _.Data;MutableData = _.MutableData;DispatchQueue = _.DispatchQueue;FileManager = _.FileManager;Timer = _.Timer;URL = _.URL;URLRequestCachePolicy = _.URLRequestCachePolicy;URLRequest = _.URLRequest;MutableURLRequest = _.MutableURLRequest;URLResponse = _.URLResponse;URLSession = _.URLSession;URLSessionTaskState = _.URLSessionTaskState;URLSessionTask = _.URLSessionTask;UserDefaults = _.UserDefaults;UUID = _.UUID;CADisplayLink = _.CADisplayLink;CAGradientLayer = _.CAGradientLayer;CALayer = _.CALayer;CAShapeFillRule = _.CAShapeFillRule;CAShapeLineCap = _.CAShapeLineCap;CAShapeLineJoin = _.CAShapeLineJoin;CAShapeLayer = _.CAShapeLayer;KMCore = _.KMCore;UIActionSheet = _.UIActionSheet;UIActivityIndicatorView = _.UIActivityIndicatorView;UIAlert = _.UIAlert;UIAffineTransformIdentity = _.UIAffineTransformIdentity;UIAffineTransformMake = _.UIAffineTransformMake;UIAffineTransformMakeTranslation = _.UIAffineTransformMakeTranslation;UIAffineTransformMakeScale = _.UIAffineTransformMakeScale;UIAffineTransformMakeRotation = _.UIAffineTransformMakeRotation;UIAffineTransformTranslate = _.UIAffineTransformTranslate;UIAffineTransformScale = _.UIAffineTransformScale;UIAffineTransformRotate = _.UIAffineTransformRotate;UIAffineTransformInvert = _.UIAffineTransformInvert;UIAffineTransformConcat = _.UIAffineTransformConcat;UIAffineTransformEqualToTransform = _.UIAffineTransformEqualToTransform;UIAffineTransformIsIdentity = _.UIAffineTransformIsIdentity;UIAnimator = _.UIAnimator;UIAttributedStringKey = _.UIAttributedStringKey;UIParagraphStyle = _.UIParagraphStyle;UIAttributedString = _.UIAttributedString;UIMutableAttributedString = _.UIMutableAttributedString;UIBezierPath = _.UIBezierPath;UIButton = _.UIButton;UICollectionElementKindCell = _.UICollectionElementKindCell;UICollectionViewItemKey = _.UICollectionViewItemKey;UICollectionViewLayoutAttributes = _.UICollectionViewLayoutAttributes;UICollectionViewLayout = _.UICollectionViewLayout;UICollectionView = _.UICollectionView;UICollectionReusableView = _.UICollectionReusableView;UICollectionViewCell = _.UICollectionViewCell;UICollectionViewData = _.UICollectionViewData;UICollectionViewScrollDirection = _.UICollectionViewScrollDirection;UIFlowLayoutHorizontalAlignment = _.UIFlowLayoutHorizontalAlignment;UICollectionViewFlowLayout = _.UICollectionViewFlowLayout;UIColor = _.UIColor;UIConfirm = _.UIConfirm;UIDevice = _.UIDevice;UIEdgeInsetsZero = _.UIEdgeInsetsZero;UIEdgeInsetsMake = _.UIEdgeInsetsMake;UIEdgeInsetsInsetRect = _.UIEdgeInsetsInsetRect;UIEdgeInsetsEqualToEdgeInsets = _.UIEdgeInsetsEqualToEdgeInsets;UIViewContentMode = _.UIViewContentMode;UIControlState = _.UIControlState;UIControlContentVerticalAlignment = _.UIControlContentVerticalAlignment;UIControlContentHorizontalAlignment = _.UIControlContentHorizontalAlignment;UITextAlignment = _.UITextAlignment;UILineBreakMode = _.UILineBreakMode;UITextFieldViewMode = _.UITextFieldViewMode;UITextAutocapitalizationType = _.UITextAutocapitalizationType;UITextAutocorrectionType = _.UITextAutocorrectionType;UITextSpellCheckingType = _.UITextSpellCheckingType;UIKeyboardType = _.UIKeyboardType;UIReturnKeyType = _.UIReturnKeyType;UILayoutConstraintAxis = _.UILayoutConstraintAxis;UIStackViewDistribution = _.UIStackViewDistribution;UIStackViewAlignment = _.UIStackViewAlignment;UIStatusBarStyle = _.UIStatusBarStyle;UIFetchMoreControl = _.UIFetchMoreControl;UIFont = _.UIFont;UIGestureRecognizerState = _.UIGestureRecognizerState;UIGestureRecognizer = _.UIGestureRecognizer;UIImageRenderingMode = _.UIImageRenderingMode;UIImage = _.UIImage;UIImageView = _.UIImageView;UILabel = _.UILabel;UILongPressGestureRecognizer = _.UILongPressGestureRecognizer;UINavigationItem = _.UINavigationItem;UIBarButtonItem = _.UIBarButtonItem;UINavigationBar = _.UINavigationBar;UINavigationBarViewController = _.UINavigationBarViewController;UINavigationController = _.UINavigationController;UIPageViewController = _.UIPageViewController;UIPanGestureRecognizer = _.UIPanGestureRecognizer;UIPinchGestureRecognizer = _.UIPinchGestureRecognizer;UIPointZero = _.UIPointZero;UIPointMake = _.UIPointMake;UIPointEqualToPoint = _.UIPointEqualToPoint;UIProgressView = _.UIProgressView;UIRectZero = _.UIRectZero;UIRectMake = _.UIRectMake;UIRectEqualToRect = _.UIRectEqualToRect;UIRectInset = _.UIRectInset;UIRectOffset = _.UIRectOffset;UIRectContainsPoint = _.UIRectContainsPoint;UIRectContainsRect = _.UIRectContainsRect;UIRectIntersectsRect = _.UIRectIntersectsRect;UIRectUnion = _.UIRectUnion;UIRectIsEmpty = _.UIRectIsEmpty;UIRefreshControl = _.UIRefreshControl;UIRotationGestureRecognizer = _.UIRotationGestureRecognizer;UIScreen = _.UIScreen;UIScrollView = _.UIScrollView;UISizeZero = _.UISizeZero;UISizeMake = _.UISizeMake;UISizeEqualToSize = _.UISizeEqualToSize;UISlider = _.UISlider;UIStackView = _.UIStackView;UISwitch = _.UISwitch;UITabBarController = _.UITabBarController;UITapGestureRecognizer = _.UITapGestureRecognizer;UITableView = _.UITableView;UITableViewCell = _.UITableViewCell;UITextField = _.UITextField;UITextView = _.UITextView;UITouchPhase = _.UITouchPhase;UITouch = _.UITouch;UIView = _.UIView;UIWindow = _.UIWindow;UIViewController = _.UIViewController;UIWebView = _.UIWebView })();\n${data}`
            fs.writeFileSync(this.dest, data)
        }
    }

    debug(port) {
        try {
            fs.mkdirSync('node_modules/.tmp')
        } catch (error) { }
        this.dest = 'node_modules/.tmp/app.js'
        this.debugging = true
        this.build(true)
        http.createServer((request, response) => {
            response.setHeader("Access-Control-Allow-Origin", "*")
            response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            response.setHeader('Access-Control-Allow-Headers', '*');
            try {
                if (request.url === "/console") {
                    let body = '';
                    request.on('data', chunk => {
                        body += chunk.toString();
                    });
                    request.on('end', () => {
                        try {
                            let params = JSON.parse(body)
                            params.values.unshift("📝")
                            console[params.type].apply(this, params.values)
                        } catch (error) { }
                        response.end('ok');
                    });
                }
                else if (request.url === "/version") {
                    response.end(fs.readFileSync("node_modules/.tmp/app.js.version", { encoding: "utf-8" }))
                }
                else if (request.url === "/source") {
                    response.end(fs.readFileSync("node_modules/.tmp/app.js", { encoding: "utf-8" }))
                }
                else if (request.url === "/livereload") {
                    response.end(fs.readFileSync("node_modules/.tmp/reload.js", { encoding: "utf-8" }))
                }
                else {
                    response.end("")
                }
            } catch (error) {
                response.end("")
            }
        }).listen(port)
        this.printIPs(port)
    }

    printIPs(port) {
        var os = require('os');
        var ifaces = os.networkInterfaces();
        Object.keys(ifaces).forEach(function (ifname) {
            var alias = 0;
            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                    return;
                }
                if (alias >= 1) {
                    console.log("Debug Server", iface.address, port);
                } else {
                    console.log("Debug Server", iface.address, port);
                }
                ++alias;
            });
        });
    }

}

const resBundler = new ResBundler()
const outputFile = process.argv.indexOf("--output") >= 0 ? process.argv[process.argv.indexOf("--output") + 1] : './build/app.js'
const srcBundler = new SrcBundler(outputFile)

if (process.argv.includes('build')) {
    srcBundler.build()
}
else if (process.argv.includes('watch')) {
    srcBundler.build(true)
}
else if (process.argv.includes('debug')) {
    const port = process.argv.indexOf("--port") >= 0 ? process.argv[process.argv.indexOf("--port") + 1] : 8090
    srcBundler.debug(port)
}
else if (process.argv.includes('init')) {
    const manager = new ProjectManager()
    manager.init()
    manager.copy()
    manager.rename()
}
else {
    srcBundler.build(outputFile)
}