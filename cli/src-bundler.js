"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const http = require("http");
const path = require("path");
const ts = require("typescript");
const res_bundler_1 = require("./res-bundler");
const browserify = require('browserify');
const watchify = require('watchify');
const tsify = require('../local_modules/tsify');
const through = require('through');
const strip_json_comments = require('strip-json-comments');
const { TinyDebugger } = require('tiny-debugger/server/index');
require("./utils").consoleMethodSwizzler();
class SrcBundler {
    constructor(dist, isWatching, isDebugging = false) {
        this.dist = dist;
        this.isWatching = isWatching;
        this.isDebugging = isDebugging;
        this.resBundler = new res_bundler_1.ResBundler;
        this.browserifyInstance = this.createBrowserify();
        this.builtCodes = {};
        this.reloadingCodes = {};
        this.versionResponsesHandler = [];
        if (isDebugging) {
            this.dist = "node_modules/.tmp/app.js";
        }
    }
    triggerBuild(reloading = false) {
        let resHanlder = undefined;
        this.browserifyInstance.bundle((error) => {
            if (error) {
                console.error(error);
            }
            else {
                if (this.isDebugging) {
                    fs.writeFileSync("node_modules/.tmp/app.js.version", new Date().getTime() + (reloading ? ".reload" : ""));
                    this.flushVersionCalls();
                }
                console.log("✅ Built at: " + new Date());
                if (resHanlder) {
                    resHanlder();
                }
                return new ArrayBuffer(0);
            }
        })
            .on('error', (error) => {
            console.error(error);
        })
            .pipe((() => {
            let stream = fs.createWriteStream(this.dist);
            stream.on("close", () => {
                this.debugPatch();
                this.wxPatch();
            });
            return stream;
        })());
        console.log("📌 Started at: " + new Date());
        return new Promise((res) => { resHanlder = res; });
    }
    compilerOptions() {
        try {
            const tsconfig = fs.readFileSync('tsconfig.json', { encoding: "utf-8" });
            return JSON.parse(strip_json_comments(tsconfig)).compilerOptions;
        }
        catch (error) {
            return {};
        }
    }
    createBrowserify() {
        var self = this;
        var instance = browserify({
            cache: {},
            packageCache: {},
            debug: this.isDebugging,
            ignoreMissing: true,
            plugin: [(this.isWatching ? watchify : undefined)],
        })
            .add('src/main.ts')
            .plugin(tsify, this.compilerOptions())
            .transform(function (file) {
            var data = '';
            return through(write, end);
            function write(buf) { data += buf; }
            function end() {
                if (file.endsWith(".ts") && data.indexOf(`UIReload("`) >= 0) {
                    self.fetchReloadingNode(file);
                }
                if (file.endsWith(".ts")) {
                    self.builtCodes[file] = fs.readFileSync(file, { encoding: "utf-8" });
                }
                if (file == path.resolve('src/main.ts')) {
                    data = self.resBundler.bundle() + "\n" + data;
                }
                //@ts-ignore
                this.queue(data);
                //@ts-ignore
                this.queue(null);
            }
        });
        if (this.isDebugging !== true) {
            instance = instance.transform('uglifyify', { sourceMap: false });
        }
        instance.on("update", (files) => {
            if ((files.every((file) => {
                return fs.readFileSync(file, { encoding: "utf-8" }) === this.builtCodes[file];
            }))) {
                this.browserifyInstance.bundle(() => { });
                return;
            }
            if (this.isDebugging) {
                let reloadingNodes = [];
                files.forEach(file => {
                    this.diffReloadingNode(file).forEach(it => reloadingNodes.push(it));
                });
                if (reloadingNodes.length > 0) {
                    this.buildReloading(reloadingNodes);
                }
                this.triggerBuild(reloadingNodes.length > 0);
            }
            else {
                this.triggerBuild();
            }
        });
        return instance;
    }
    fetchReloadingNode(file) {
        const program = ts.createProgram([file], { noResolve: true });
        const sourceFile = program.getSourceFile(file);
        const fetchNode = (node) => {
            if (ts.isClassDeclaration(node) && node.decorators && node.decorators.length > 0 && node.decorators.filter(it => it.getText(sourceFile).indexOf("@UIReload") >= 0)) {
                const reloadIdentifier = (() => {
                    const decorator = node.decorators.filter(it => it.getText(sourceFile).indexOf("@UIReload") >= 0)[0];
                    //@ts-ignore
                    return decorator.expression.arguments[0].text;
                })();
                this.reloadingCodes[reloadIdentifier] = node.getText(sourceFile);
            }
            node.forEachChild(it => fetchNode(it));
        };
        if (sourceFile) {
            fetchNode(sourceFile);
        }
    }
    diffReloadingNode(file) {
        let nodeChanges = [];
        const program = ts.createProgram([file], { noResolve: true });
        const sourceFile = program.getSourceFile(file);
        const fetchNode = (node) => {
            if (ts.isClassDeclaration(node) && node.decorators && node.decorators.length > 0 && node.decorators.filter(it => it.getText(sourceFile).indexOf("@UIReload") >= 0)) {
                const reloadIdentifier = (() => {
                    const decorator = node.decorators.filter(it => it.getText(sourceFile).indexOf("@UIReload") >= 0)[0];
                    //@ts-ignore
                    return decorator.expression.arguments[0].text;
                })();
                if (this.reloadingCodes[reloadIdentifier] !== undefined && this.reloadingCodes[reloadIdentifier] !== node.getText(sourceFile)) {
                    node.sourceFile = sourceFile;
                    nodeChanges.push(node);
                }
            }
            node.forEachChild(it => fetchNode(it));
        };
        if (sourceFile) {
            fetchNode(sourceFile);
        }
        return nodeChanges;
    }
    buildReloading(nodes) {
        if (nodes.length == 0) {
            return;
        }
        if (!this.isDebugging) {
            return;
        }
        let dist = '';
        nodes.forEach(node => {
            if (ts.isClassDeclaration(node)) {
                const reloadIdentifier = (() => {
                    if (!node.decorators) {
                        return "";
                    }
                    const decorator = node.decorators.filter(it => it.getText(node.sourceFile).indexOf("@UIReload") >= 0)[0];
                    //@ts-ignore
                    return decorator.expression.arguments[0].text;
                })();
                let extendsName = undefined;
                if (node.heritageClauses) {
                    node.heritageClauses.forEach(it => {
                        if (it.token === ts.SyntaxKind.ExtendsKeyword) {
                            extendsName = it.getText(node.sourceFile).replace('extends ', '');
                        }
                    });
                }
                dist += `
                (function(){
                    ${extendsName ? `let ${extendsName} = UIReloader.shared.items["${reloadIdentifier}"].superItem.clazz.constructor;` : ''}
                    ${node.getText(node.sourceFile)}
                })()
                `;
            }
        });
        fs.writeFileSync("node_modules/.tmp/reload.js", ts.transpile(dist, { target: ts.ScriptTarget.ES5 }));
    }
    debugPatch() {
        if (process.argv.indexOf("debug") >= 0) {
            try {
                let data = fs.readFileSync(this.dist, { encoding: "utf-8" });
                const debuggerScript = fs.readFileSync(path.resolve('node_modules', 'tiny-debugger', 'client/index.js'), { encoding: "utf-8" });
                data = `var $__debugger;(function(){${debuggerScript.replace('var $debugger = ', '$__debugger =')}})();$__debugger.start();\n${data}`;
                fs.writeFileSync(this.dist, data);
            }
            catch (error) { }
        }
    }
    wxPatch() {
        if (process.argv.indexOf("--wx") > 0) {
            try {
                let data = fs.readFileSync(this.dist, { encoding: "utf-8" });
                data = `;var Bundle, Data, MutableData, DispatchQueue, FileManager, Timer, URL, URLRequestCachePolicy, URLRequest, MutableURLRequest, URLResponse, URLSession, URLSessionTaskState, URLSessionTask, UserDefaults, UUID, CADisplayLink, CAGradientLayer, CALayer, CAShapeFillRule, CAShapeLineCap, CAShapeLineJoin, CAShapeLayer, KMCore, UIActionSheet, UIActivityIndicatorView, UIAlert, UIAffineTransformIdentity, UIAffineTransformMake, UIAffineTransformMakeTranslation, UIAffineTransformMakeScale, UIAffineTransformMakeRotation, UIAffineTransformTranslate, UIAffineTransformScale, UIAffineTransformRotate, UIAffineTransformInvert, UIAffineTransformConcat, UIAffineTransformEqualToTransform, UIAffineTransformIsIdentity, UIAnimator, UIAttributedStringKey, UIParagraphStyle, UIAttributedString, UIMutableAttributedString, UIBezierPath, UIButton, UICollectionElementKindCell, UICollectionViewItemKey, UICollectionViewLayoutAttributes, UICollectionViewLayout, UICollectionView, UICollectionReusableView, UICollectionViewCell, UICollectionViewData, UICollectionViewScrollDirection, UIFlowLayoutHorizontalAlignment, UICollectionViewFlowLayout, UIColor, UIConfirm, UIDevice, UIEdgeInsetsZero, UIEdgeInsetsMake, UIEdgeInsetsInsetRect, UIEdgeInsetsEqualToEdgeInsets, UIViewContentMode, UIControlState, UIControlContentVerticalAlignment, UIControlContentHorizontalAlignment, UITextAlignment, UILineBreakMode, UITextFieldViewMode, UITextAutocapitalizationType, UITextAutocorrectionType, UITextSpellCheckingType, UIKeyboardType, UIReturnKeyType, UILayoutConstraintAxis, UIStackViewDistribution, UIStackViewAlignment, UIStatusBarStyle, UIFetchMoreControl, UIFont, UIGestureRecognizerState, UIGestureRecognizer, UIImageRenderingMode, UIImage, UIImageView, UILabel, UILongPressGestureRecognizer, UINavigationItem, UIBarButtonItem, UINavigationBar, UINavigationBarViewController, UINavigationController, UIPageViewController, UIPanGestureRecognizer, UIPinchGestureRecognizer, UIPointZero, UIPointMake, UIPointEqualToPoint, UIProgressView, UIRectZero, UIRectMake, UIRectEqualToRect, UIRectInset, UIRectOffset, UIRectContainsPoint, UIRectContainsRect, UIRectIntersectsRect, UIRectUnion, UIRectIsEmpty, UIRefreshControl, UIRotationGestureRecognizer, UIScreen, UIScrollView, UISizeZero, UISizeMake, UISizeEqualToSize, UISlider, UIStackView, UISwitch, UITabBarController, UITapGestureRecognizer, UITableView, UITableViewCell, UITextField, UITextView, UITouchPhase, UITouch, UIView, UIWindow, UIViewController, UIWebView;(function(){ const _ = require("xt-framework-wx"); Bundle = _.Bundle;Data = _.Data;MutableData = _.MutableData;DispatchQueue = _.DispatchQueue;FileManager = _.FileManager;Timer = _.Timer;URL = _.URL;URLRequestCachePolicy = _.URLRequestCachePolicy;URLRequest = _.URLRequest;MutableURLRequest = _.MutableURLRequest;URLResponse = _.URLResponse;URLSession = _.URLSession;URLSessionTaskState = _.URLSessionTaskState;URLSessionTask = _.URLSessionTask;UserDefaults = _.UserDefaults;UUID = _.UUID;CADisplayLink = _.CADisplayLink;CAGradientLayer = _.CAGradientLayer;CALayer = _.CALayer;CAShapeFillRule = _.CAShapeFillRule;CAShapeLineCap = _.CAShapeLineCap;CAShapeLineJoin = _.CAShapeLineJoin;CAShapeLayer = _.CAShapeLayer;KMCore = _.KMCore;UIActionSheet = _.UIActionSheet;UIActivityIndicatorView = _.UIActivityIndicatorView;UIAlert = _.UIAlert;UIAffineTransformIdentity = _.UIAffineTransformIdentity;UIAffineTransformMake = _.UIAffineTransformMake;UIAffineTransformMakeTranslation = _.UIAffineTransformMakeTranslation;UIAffineTransformMakeScale = _.UIAffineTransformMakeScale;UIAffineTransformMakeRotation = _.UIAffineTransformMakeRotation;UIAffineTransformTranslate = _.UIAffineTransformTranslate;UIAffineTransformScale = _.UIAffineTransformScale;UIAffineTransformRotate = _.UIAffineTransformRotate;UIAffineTransformInvert = _.UIAffineTransformInvert;UIAffineTransformConcat = _.UIAffineTransformConcat;UIAffineTransformEqualToTransform = _.UIAffineTransformEqualToTransform;UIAffineTransformIsIdentity = _.UIAffineTransformIsIdentity;UIAnimator = _.UIAnimator;UIAttributedStringKey = _.UIAttributedStringKey;UIParagraphStyle = _.UIParagraphStyle;UIAttributedString = _.UIAttributedString;UIMutableAttributedString = _.UIMutableAttributedString;UIBezierPath = _.UIBezierPath;UIButton = _.UIButton;UICollectionElementKindCell = _.UICollectionElementKindCell;UICollectionViewItemKey = _.UICollectionViewItemKey;UICollectionViewLayoutAttributes = _.UICollectionViewLayoutAttributes;UICollectionViewLayout = _.UICollectionViewLayout;UICollectionView = _.UICollectionView;UICollectionReusableView = _.UICollectionReusableView;UICollectionViewCell = _.UICollectionViewCell;UICollectionViewData = _.UICollectionViewData;UICollectionViewScrollDirection = _.UICollectionViewScrollDirection;UIFlowLayoutHorizontalAlignment = _.UIFlowLayoutHorizontalAlignment;UICollectionViewFlowLayout = _.UICollectionViewFlowLayout;UIColor = _.UIColor;UIConfirm = _.UIConfirm;UIDevice = _.UIDevice;UIEdgeInsetsZero = _.UIEdgeInsetsZero;UIEdgeInsetsMake = _.UIEdgeInsetsMake;UIEdgeInsetsInsetRect = _.UIEdgeInsetsInsetRect;UIEdgeInsetsEqualToEdgeInsets = _.UIEdgeInsetsEqualToEdgeInsets;UIViewContentMode = _.UIViewContentMode;UIControlState = _.UIControlState;UIControlContentVerticalAlignment = _.UIControlContentVerticalAlignment;UIControlContentHorizontalAlignment = _.UIControlContentHorizontalAlignment;UITextAlignment = _.UITextAlignment;UILineBreakMode = _.UILineBreakMode;UITextFieldViewMode = _.UITextFieldViewMode;UITextAutocapitalizationType = _.UITextAutocapitalizationType;UITextAutocorrectionType = _.UITextAutocorrectionType;UITextSpellCheckingType = _.UITextSpellCheckingType;UIKeyboardType = _.UIKeyboardType;UIReturnKeyType = _.UIReturnKeyType;UILayoutConstraintAxis = _.UILayoutConstraintAxis;UIStackViewDistribution = _.UIStackViewDistribution;UIStackViewAlignment = _.UIStackViewAlignment;UIStatusBarStyle = _.UIStatusBarStyle;UIFetchMoreControl = _.UIFetchMoreControl;UIFont = _.UIFont;UIGestureRecognizerState = _.UIGestureRecognizerState;UIGestureRecognizer = _.UIGestureRecognizer;UIImageRenderingMode = _.UIImageRenderingMode;UIImage = _.UIImage;UIImageView = _.UIImageView;UILabel = _.UILabel;UILongPressGestureRecognizer = _.UILongPressGestureRecognizer;UINavigationItem = _.UINavigationItem;UIBarButtonItem = _.UIBarButtonItem;UINavigationBar = _.UINavigationBar;UINavigationBarViewController = _.UINavigationBarViewController;UINavigationController = _.UINavigationController;UIPageViewController = _.UIPageViewController;UIPanGestureRecognizer = _.UIPanGestureRecognizer;UIPinchGestureRecognizer = _.UIPinchGestureRecognizer;UIPointZero = _.UIPointZero;UIPointMake = _.UIPointMake;UIPointEqualToPoint = _.UIPointEqualToPoint;UIProgressView = _.UIProgressView;UIRectZero = _.UIRectZero;UIRectMake = _.UIRectMake;UIRectEqualToRect = _.UIRectEqualToRect;UIRectInset = _.UIRectInset;UIRectOffset = _.UIRectOffset;UIRectContainsPoint = _.UIRectContainsPoint;UIRectContainsRect = _.UIRectContainsRect;UIRectIntersectsRect = _.UIRectIntersectsRect;UIRectUnion = _.UIRectUnion;UIRectIsEmpty = _.UIRectIsEmpty;UIRefreshControl = _.UIRefreshControl;UIRotationGestureRecognizer = _.UIRotationGestureRecognizer;UIScreen = _.UIScreen;UIScrollView = _.UIScrollView;UISizeZero = _.UISizeZero;UISizeMake = _.UISizeMake;UISizeEqualToSize = _.UISizeEqualToSize;UISlider = _.UISlider;UIStackView = _.UIStackView;UISwitch = _.UISwitch;UITabBarController = _.UITabBarController;UITapGestureRecognizer = _.UITapGestureRecognizer;UITableView = _.UITableView;UITableViewCell = _.UITableViewCell;UITextField = _.UITextField;UITextView = _.UITextView;UITouchPhase = _.UITouchPhase;UITouch = _.UITouch;UIView = _.UIView;UIWindow = _.UIWindow;UIViewController = _.UIViewController;UIWebView = _.UIWebView })();\n${data}`;
                fs.writeFileSync(this.dist, data);
            }
            catch (error) { }
        }
    }
    triggerDebug(port) {
        try {
            fs.mkdirSync('node_modules/.tmp');
        }
        catch (error) { }
        this.versionResponsesHandler = [];
        setInterval(() => {
            this.flushVersionCalls();
        }, 30000);
        http.createServer((request, response) => {
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            response.setHeader('Access-Control-Allow-Headers', '*,code-version');
            if (request.method === "OPTIONS") {
                response.statusCode = 200;
                return response.end();
            }
            try {
                if (request.url === "/console") {
                    let body = '';
                    request.on('data', chunk => {
                        body += chunk.toString();
                    });
                    request.on('end', () => {
                        try {
                            let params = JSON.parse(body);
                            params.values.unshift("📝");
                            //@ts-ignore
                            console[params.type].apply(this, params.values);
                        }
                        catch (error) { }
                        response.end('ok');
                    });
                }
                else if (request.url === "/version") {
                    if (request.headers && request.headers["code-version"] && request.headers["code-version"] !== "undefined" && fs.readFileSync("node_modules/.tmp/app.js.version", { encoding: "utf-8" }) === request.headers["code-version"]) {
                        this.versionResponsesHandler.push(() => {
                            response.end(fs.readFileSync("node_modules/.tmp/app.js.version", { encoding: "utf-8" }));
                        });
                    }
                    else {
                        response.end(fs.readFileSync("node_modules/.tmp/app.js.version", { encoding: "utf-8" }));
                    }
                }
                else if (request.url === "/source") {
                    response.end(fs.readFileSync("node_modules/.tmp/app.js", { encoding: "utf-8" }));
                }
                else if (request.url === "/livereload") {
                    response.end(fs.readFileSync("node_modules/.tmp/reload.js", { encoding: "utf-8" }));
                }
                else {
                    response.end("");
                }
            }
            catch (error) {
                response.end("");
            }
        }).listen(port);
        this.printIPs(port);
        return this.triggerBuild();
    }
    setupTinyDebugger() {
        const tinyDebugger = new TinyDebugger();
        tinyDebugger.on("client.paused", (client, params) => {
            if (client && params && params.uri) {
                console.log(`[Tiny-Debugger] Break on ${params.uri}`);
                if (params.variables && Object.keys(params.variables).length > 0) {
                    console.log(`[Tiny-Debugger] Break variables ${new Buffer(JSON.stringify(params.variables)).toString('base64')}`);
                }
                console.log(`[Tiny-Debugger] Enter 'c' to continue. Enter 'n' to next. Type scripts to eval.`);
                let prompt = () => {
                    process.stdin.once("data", (data) => {
                        if (data.toString() === "c\n") {
                            client.emit("resume");
                        }
                        else if (data.toString() === "n\n") {
                            client.emit("resume", { next: true });
                        }
                        else if (data.toString().length > 0) {
                            client.emit("resume", { eval: data.toString() });
                            prompt();
                        }
                        else {
                            prompt();
                        }
                    });
                };
                prompt();
            }
        });
        process.stdin.on("data", (data) => {
            if (typeof data === "object" || typeof data === "string") {
                const values = data.toString();
                values.split("\n").forEach(value => {
                    if (value.indexOf("[Tiny-Debugger] setBreakpoint on ") === 0) {
                        tinyDebugger.setBreakpoint(value.replace("[Tiny-Debugger] setBreakpoint on ", "").trim());
                    }
                    else if (value.indexOf("[Tiny-Debugger] setBreakpoints on ") === 0) {
                        tinyDebugger.setBreakpoints(JSON.parse(value.replace("[Tiny-Debugger] setBreakpoints on ", "").trim()));
                    }
                    else if (value.indexOf("[Tiny-Debugger] removeBreakpoint on ") === 0) {
                        tinyDebugger.removeBreakpoint(value.replace("[Tiny-Debugger] removeBreakpoint on ", "").trim());
                    }
                    else if (value.indexOf("[Tiny-Debugger] removeAllBreakpoints") === 0) {
                        tinyDebugger.removeAllBreakpoints();
                    }
                    else if (value.indexOf("[Tiny-Debugger] removeBreakpointsWithPrefix ") === 0) {
                        tinyDebugger.removeBreakpointsWithPrefix(value.replace("[Tiny-Debugger] removeBreakpointsWithPrefix ", "").trim());
                    }
                });
            }
        });
        tinyDebugger.createServer();
    }
    flushVersionCalls() {
        this.versionResponsesHandler.forEach(it => it());
        this.versionResponsesHandler = [];
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
                }
                else {
                    console.log("Debug Server", iface.address, port);
                }
                ++alias;
            });
        });
    }
}
exports.SrcBundler = SrcBundler;
