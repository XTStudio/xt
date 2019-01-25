const ts = require('typescript')

function transformStatements(node, sourceFile) {
    const statements = node.statements.slice()
    let newStatements = []
    let declaredVariables = []
    if (node.parent) {
        const parentNode = node.parent
        if (ts.isFunctionLike(parentNode)) {
            parentNode.parameters.forEach(it => {
                declaredVariables.push(it)
            })
        }
    }
    statements.forEach(it => {
        if (it.pos >= 0) {
            let info = ts.getLineAndCharacterOfPosition(sourceFile, it.getStart(sourceFile))
            const originalFileName = sourceFile.originalFileName.replace(sourceFile.originalFileName.replace(new RegExp(sourceFile.fileName, "ig"), ""), "")
            let uri = `${originalFileName}:${info.line + 1}`
            let stepStatement = ts.createCall(
                ts.createIdentifier("$__debugger.step"),
                ts.createNodeArray(),
                ts.createNodeArray([
                    ts.createLiteral(uri),
                    ts.createIdentifier("(script) => { console.log(eval(script), '<<< REPL'); }"),
                    ts.createObjectLiteral(declaredVariables.map(it => {
                        return ts.createShorthandPropertyAssignment(it.name)
                    }))
                ]
                )
            )
            newStatements.push(stepStatement)
        }
        newStatements.push(it)
        if (ts.isVariableStatement(it)) {
            it.declarationList.declarations.forEach(it => {
                declaredVariables.push(it)
            })
        }
    })
    node.statements = ts.createNodeArray(newStatements)
}

module.exports.transformer = (() => {
    function visitor(ctx, sourceFile) {
        const visitor = (node) => {
            if (ts.isBlock(node) || ts.isSourceFile(node)) {
                transformStatements(node, sourceFile)
            }
            return ts.visitEachChild(node, visitor, ctx)
        }
        return visitor
    }
    return (ctx) => {
        return (sourceFile) => ts.visitNode(sourceFile, visitor(ctx, sourceFile))
    }
})()