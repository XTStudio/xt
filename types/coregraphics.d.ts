declare class CALayer {
    frame: Rect
    readonly superlayer: CALayer | undefined
    removeFromSuperlayer(): void
    readonly sublayers: CALayer[]
    addSublayer(layer: CALayer): void
    insertSublayerAtIndex(layer: CALayer, index: number): void
    insertSublayerBelow(layer: CALayer, below: CALayer): void
    insertSublayerAbove(layer: CALayer, above: CALayer): void
    replaceSublayer(oldLayer: CALayer, newLayer: CALayer): void
    hidden: boolean
    mask: CALayer | undefined
    masksToBounds: boolean
    backgroundColor: UIColor | undefined
    cornerRadius: number
    borderWidth: number
    borderColor: UIColor | undefined
    opacity: number
    shadowColor: UIColor | undefined
    shadowOpacity: number
    shadowOffset: Size
    shadowRadius: number
}

declare class CAGradientLayer extends CALayer {
    colors: UIColor[]
    locations: number[]
    startPoint: Point
    endPoint: Point
}

declare class CAShapeLayer extends CALayer {
    path: UIBezierPath | undefined
    fillColor: UIColor | undefined
    fillRule: CAShapeFillRule
    lineCap: CAShapeLineCap
    lineDashPattern: number[]
    lineDashPhase: number
    lineJoin: CAShapeLineJoin
    lineWidth: number
    miterLimit: number
    strokeColor: UIColor | undefined
    strokeStart: number
    strokeEnd: number
}

declare enum CAShapeFillRule {
    nonZero,
    evenOdd,
}

declare enum CAShapeLineCap {
    butt,
    round,
    square,
}

declare enum CAShapeLineJoin {
    miter,
    round,
    bevel,
}

declare class CADisplayLink {
    constructor(vsyncBlock: () => void)
    timestamp: number
    active(): void
    invalidate(): void
}