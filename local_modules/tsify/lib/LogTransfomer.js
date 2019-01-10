const ts = require('typescript')

function isConsoleCall(node, sourceFile) {
    if (!node.expression) { return false }
    let expressionText = node.expression.getText(sourceFile)
    if (expressionText.indexOf("console.") === 0) {
        return true
    }
    else {
        return false
    }
}

module.exports.transformer = (() => {
    function visitor(ctx, sourceFile) {
        const visitor = (node) => {
            if (ts.isCallExpression(node) && isConsoleCall(node, sourceFile) && node.pos >= 0) {
                const args = node.arguments.slice()
                let codeLine = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile)).line
                args.push(ts.createLiteral(`<<< ${sourceFile.fileName}:${codeLine + 1}`))
                node.arguments = ts.createNodeArray(args)
            }
            return ts.visitEachChild(node, visitor, ctx)
        }
        return visitor
    }
    return (ctx) => {
        return (sourceFile) => ts.visitNode(sourceFile, visitor(ctx, sourceFile))
    }
})()