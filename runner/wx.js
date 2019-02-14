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
const fs_1 = require("fs");
const path_1 = require("path");
const child_process = require('child_process');
class WXRunner {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.checkDevtools();
                this.startProject();
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    checkDevtools() {
        if (!fs_1.existsSync('/Applications/wechatwebdevtools.app/Contents/MacOS/cli')) {
            throw Error("微信开发者工具尚未安装 @see https://developers.weixin.qq.com/miniprogram/dev/");
        }
    }
    startProject() {
        console.log("正在启动微信开发者工具");
        console.log("如果项目没有成功启动，请检查 platform/wx/project.config.json 中的 appid 是否正确，你可以到微信开发者平台申请测试号并获取 appid。 @see https://developers.weixin.qq.com/sandbox");
        const toolProcess = child_process.exec('/Applications/wechatwebdevtools.app/Contents/MacOS/cli -o ' + path_1.resolve('platform', 'wx'), { cwd: './' });
        toolProcess.stdout.on("data", (data) => {
            console.log(data);
        });
    }
}
exports.WXRunner = WXRunner;
