import * as fs from "fs";

export class ResBundler {

    contentCache: { [key: string]: any } = {}

    files(dir: string) {
        var files: string[] = []
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