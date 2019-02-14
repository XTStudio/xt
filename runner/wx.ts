import { existsSync } from "fs";
import { resolve } from "path";
const child_process = require('child_process')

export class WXRunner {

    async run() {
        try {
            this.checkDevtools()
            this.installNPM()
            this.startProject()
        } catch (error) {
            console.error(error)
        }
    }

    checkDevtools() {
        if (!existsSync('/Applications/wechatwebdevtools.app/Contents/MacOS/cli')) {
            throw Error("微信开发者工具尚未安装 @see https://developers.weixin.qq.com/miniprogram/dev/")
        }
    }

    installNPM() {
        console.log("正在加载依赖包")
        child_process.execSync('npm i', { cwd: 'platform/wx/' })
    }

    startProject() {
        console.log("正在启动微信开发者工具")
        console.log("如果项目没有成功启动，请检查 platform/wx/project.config.json 中的 appid 是否正确，你可以到微信开发者平台申请测试号并获取 appid。 @see https://developers.weixin.qq.com/sandbox")
        const toolProcess = child_process.exec('/Applications/wechatwebdevtools.app/Contents/MacOS/cli --build-npm ' + resolve('platform', 'wx') + ' -o ' + resolve('platform', 'wx'), { cwd: './' })
        toolProcess.stdout.on("data", (data: any) => {
            console.log(data)
        })
    }

}