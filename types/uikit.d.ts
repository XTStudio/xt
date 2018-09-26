// Base

interface EventEmitter<T> {
    on<K extends keyof T>(type: K, listener: T[K]): this
    once<K extends keyof T>(type: K, listener: T[K]): this
    off<K extends keyof T>(type: K, listener: T[K]): this
    emit<K extends keyof T>(type: K, ...p: any[]): this
}

interface BaseEventMap { }

declare class BaseObject<T> implements EventEmitter<T> {
    on<K extends keyof T>(type: K, listener: T[K]): this
    once<K extends keyof T>(type: K, listener: T[K]): this
    off<K extends keyof T>(type: K, listener: T[K]): this
    emit<K extends keyof T>(type: K, ...p: any[]): this
}

// Enums

declare enum UIViewContentMode {
    scaleToFill,
    scaleAspectFit,
    scaleAspectFill,
}

declare enum UIControlState {
    normal,
    highlighted,
    disabled,
    selected,
}

declare enum UIControlContentVerticalAlignment {
    center,
    top,
    bottom,
    fill,
}

declare enum UIControlContentHorizontalAlignment {
    center,
    left,
    right,
    fill,
}

declare enum UITextAlignment {
    left,
    center,
    right,
}

declare enum UILineBreakMode {
    wordWrapping,
    charWrapping,
    clipping,
    truncatingHead,
    truncatingTail,
    truncatingMiddle,
}

declare enum UITextFieldViewMode {
    never,
    whileEditing,
    unlessEditing,
    always,
}

declare enum UITextAutocapitalizationType {
    none,
    words,
    sentences,
    allCharacters,
}

declare enum UITextAutocorrectionType {
    default,
    no,
    yes,
}

declare enum UITextSpellCheckingType {
    default,
    no,
    yes
}

declare enum UIKeyboardType {
    default,
    ASCIICapable,
    numbersAndPunctuation,
    numberPad,
    phonePad,
    emailAddress,
    decimalPad
}

declare enum UIReturnKeyType {
    default,
    go,
    next,
    send,
    done
}

declare enum UILayoutConstraintAxis {
    horizontal,
    vertical,
}

declare enum UIStackViewDistribution {
    fill,
    fillEqually,
    fillProportionally,
    equalSpacing,
    equalCentering,
}

declare enum UIStackViewAlignment {
    fill,
    leading,
    center,
    trailing,
}

declare enum UIStatusBarStyle {
    default,
    lightContent,
}

// Interfaces

declare interface Rect { x: number, y: number, width: number, height: number }
declare interface Point { x: number, y: number }
declare interface Size { width: number, height: number }
declare interface AffineTransform { a: number, b: number, c: number, d: number, tx: number, ty: number }
declare interface EdgeInsets { top: number, left: number, bottom: number, right: number }
declare interface Range { location: number, length: number }

// Views

declare class UIView {
    readonly layer: CALayer
    frame: Rect
    bounds: Rect
    center: Point
    transform: AffineTransform
    // Hierarchy
    tag: number
    readonly superview: UIView | undefined
    readonly subviews: UIView[]
    readonly window: UIWindow | undefined
    removeFromSuperview(): void
    insertSubviewAtIndex(view: UIView, index: number): void
    exchangeSubview(index1: number, index2: number): void
    addSubview(view: UIView): void
    insertSubviewBelowSubview(view: UIView, belowSubview: UIView): void
    insertSubviewAboveSubview(view: UIView, aboveSubview: UIView): void
    bringSubviewToFront(view: UIView): void
    sendSubviewToBack(view: UIView): void
    isDescendantOfView(view: UIView): boolean
    viewWithTag(tag: number): UIView | undefined
    // Delegates
    didAddSubview(subview: UIView): void
    willRemoveSubview(subview: UIView): void
    willMoveToSuperview(newSuperview: UIView): void
    didMoveToSuperview(): void
    setNeedsLayout(): void
    layoutIfNeeded(): void
    layoutSubviews(): void
    // Rendering
    setNeedsDisplay(): void
    clipsToBounds: boolean
    backgroundColor: UIColor | undefined
    alpha: number
    hidden: boolean
    opaque: boolean
    contentMode: UIViewContentMode
    tintColor: UIColor
    tintColorDidChange(): void
    // GestureRecognizers
    userInteractionEnabled: boolean
    gestureRecognizers: UIGestureRecognizer[]
    addGestureRecognizer(gestureRecognizer: UIGestureRecognizer): void
    removeGestureRecognizer(gestureRecognizer: UIGestureRecognizer): void
    // Accessibility
    isAccessibilityElement: boolean
    accessibilityLabel: string
    accessibilityHint: string
    accessibilityValue: string
    accessibilityIdentifier: string
}

interface UIButtonEventMap extends BaseEventMap {
    "touchDown": (sender: UIButton) => void,
    "touchDownRepeat": (sender: UIButton) => void,
    "touchDragInside": (sender: UIButton) => void,
    "touchDragOutside": (sender: UIButton) => void,
    "touchDragEnter": (sender: UIButton) => void,
    "touchDragExit": (sender: UIButton) => void,
    "touchUpInside": (sender: UIButton) => void,
    "touchUpOutside": (sender: UIButton) => void,
    "touchCancel": (sender: UIButton) => void,
}

declare class UIButton extends UIView {
    constructor(isCustom?: boolean)
    enabled: boolean
    selected: boolean
    readonly highlighted: boolean
    readonly tracking: boolean
    readonly touchInside: boolean
    contentVerticalAlignment: UIControlContentVerticalAlignment
    contentHorizontalAlignment: UIControlContentHorizontalAlignment
    setTitle(title: string | undefined, state: UIControlState): void
    setTitleColor(color: UIColor | undefined, state: UIControlState): void
    setTitleFont(font: UIFont): void
    setImage(image: UIImage | undefined, state: UIControlState): void
    setAttributedTitle(title: UIAttributedString | undefined, state: UIControlState): void
    contentEdgeInsets: EdgeInsets
    titleEdgeInsets: EdgeInsets
    imageEdgeInsets: EdgeInsets
    // EventEmitter
    on<K extends keyof UIButtonEventMap>(type: K, listener: UIButtonEventMap[K]): this
    once<K extends keyof UIButtonEventMap>(type: K, listener: UIButtonEventMap[K]): this
    off<K extends keyof UIButtonEventMap>(type: K, listener: UIButtonEventMap[K]): this
    emit<K extends keyof UIButtonEventMap>(type: K, ...args: any[]): this
}

declare class UIImageView extends UIView {
    image: UIImage | undefined
    loadImageWithURLString(URLString?: string, placeholder?: UIImage): void
}

declare class UILabel extends UIView {
    text: string | undefined
    attributedText: UIAttributedString | undefined
    font: UIFont | undefined
    textColor: UIColor | undefined
    textAlignment: UITextAlignment
    lineBreakMode: UILineBreakMode
    numberOfLines: number
}

interface UITextFieldEventMap {
    "shouldBeginEditing": (sender: UITextField) => boolean,
    "didBeginEditing": (sender: UITextField) => void,
    "shouldEndEditing": (sender: UITextField) => boolean,
    "didEndEditing": (sender: UITextField) => void,
    "shouldChange": (sender: UITextField, charactersInRange: Range, replacementString: string) => boolean,
    "shouldClear": (sender: UITextField) => boolean,
    "shouldReturn": (sender: UITextField) => boolean,
}

declare class UITextField extends UIView {
    text: string | undefined
    textColor: UIColor | undefined
    font: UIFont | undefined
    textAlignment: UITextAlignment
    placeholder: string | undefined
    clearsOnBeginEditing: boolean
    readonly editing: boolean
    clearButtonMode: UITextFieldViewMode
    leftView: UIView | undefined
    leftViewMode: UITextFieldViewMode
    rightView: UIView | undefined
    rightViewMode: UITextFieldViewMode
    clearsOnInsertion: boolean
    focus(): void
    blur(): void
    autocapitalizationType: UITextAutocapitalizationType
    autocorrectionType: UITextAutocorrectionType
    spellCheckingType: UITextSpellCheckingType
    keyboardType: UIKeyboardType
    returnKeyType: UIReturnKeyType
    secureTextEntry: boolean
    // EventEmitter
    on<K extends keyof UITextFieldEventMap>(type: K, listener: UITextFieldEventMap[K]): this
    once<K extends keyof UITextFieldEventMap>(type: K, listener: UITextFieldEventMap[K]): this
    off<K extends keyof UITextFieldEventMap>(type: K, listener: UITextFieldEventMap[K]): this
}

interface UITextViewEventMap extends BaseEventMap {
    "shouldBeginEditing": (sender: UITextView) => boolean,
    "didBeginEditing": (sender: UITextView) => void,
    "shouldEndEditing": (sender: UITextView) => boolean,
    "didEndEditing": (sender: UITextView) => void,
    "shouldChange": (sender: UITextView, charactersInRange: Range, replacementString: string) => boolean,
}

declare class UITextView extends UIView {
    text: string | undefined
    textColor: UIColor | undefined
    font: UIFont | undefined
    textAlignment: UITextAlignment
    editable: boolean
    selectable: boolean
    readonly editing: boolean
    scrollRangeToVisible(range: Range): void
    focus(): void
    blur(): void
    autocapitalizationType: UITextAutocapitalizationType
    autocorrectionType: UITextAutocorrectionType
    spellCheckingType: UITextSpellCheckingType
    keyboardType: UIKeyboardType
    returnKeyType: UIReturnKeyType
    secureTextEntry: boolean
    // EventEmitter
    on<K extends keyof UITextViewEventMap>(type: K, listener: UITextViewEventMap[K]): this
    once<K extends keyof UITextViewEventMap>(type: K, listener: UITextViewEventMap[K]): this
    off<K extends keyof UITextViewEventMap>(type: K, listener: UITextViewEventMap[K]): this
    emit<K extends keyof UITextViewEventMap>(type: K, ...args: any[]): this
}

interface UICollectionViewEventMap extends UIScrollViewEventMap {
    "numberOfSections": () => number,
    "numberOfItems": (inSection: number) => number,
    "cellForItem": (indexPath: UIIndexPath) => UICollectionViewCell,
    "didSelectItem": (indexPath: UIIndexPath, cell: UICollectionViewCell) => void,
    "didDeselectItem": (indexPath: UIIndexPath, cell: UICollectionViewCell) => void,
}

declare class UICollectionView extends UIScrollView {
    constructor(collectionViewLayout: UICollectionViewLayout)
    readonly collectionViewLayout: UICollectionViewLayout
    allowsSelection: boolean
    allowsMultipleSelection: boolean
    register(initializer: (context: any) => UICollectionViewCell, reuseIdentifier: string): void
    dequeueReusableCell(reuseIdentifier: string, indexPath: UIIndexPath): UICollectionViewCell
    reloadData(): void
    selectItem(indexPath: UIIndexPath, animated: boolean): void
    deselectItem(indexPath: UIIndexPath, animated: boolean): void
    // EventEmitter
    on<K extends keyof UICollectionViewEventMap>(type: K, listener: UICollectionViewEventMap[K]): this
    once<K extends keyof UICollectionViewEventMap>(type: K, listener: UICollectionViewEventMap[K]): this
    off<K extends keyof UICollectionViewEventMap>(type: K, listener: UICollectionViewEventMap[K]): this
    emit<K extends keyof UICollectionViewEventMap>(type: K, ...args: any[]): this
}

interface UICollectionViewCellEventMap extends BaseEventMap {
    "selected": (sender: UICollectionViewCell, selected: boolean) => void,
    "highlighted": (sender: UICollectionViewCell, highlighted: boolean) => void,
}

declare class UICollectionViewCell extends UIView {
    constructor(context: any)
    readonly contentView: UIView
    readonly reuseIdentifier: string | undefined
    // EventEmitter
    on<K extends keyof UICollectionViewCellEventMap>(type: K, listener: UICollectionViewCellEventMap[K]): this
    once<K extends keyof UICollectionViewCellEventMap>(type: K, listener: UICollectionViewCellEventMap[K]): this
    off<K extends keyof UICollectionViewCellEventMap>(type: K, listener: UICollectionViewCellEventMap[K]): this
    emit<K extends keyof UICollectionViewCellEventMap>(type: K, ...args: any[]): this
}

declare class UICollectionViewLayout {
    readonly collectionView: UICollectionView | undefined
    invalidateLayout(): void
}

declare enum UICollectionViewScrollDirection {
    vertical,
    horizontal,
}

interface UICollectionViewFlowLayoutEventMap extends BaseEventMap {
    "sizeForItem": (indexPath: UIIndexPath) => Size,
    "insetForSection": (inSection: number) => EdgeInsets,
    "minimumLineSpacing": (inSection: number) => number,
    "minimumInteritemSpacing": (inSection: number) => number,
    "referenceSizeForHeader": (inSection: number) => Size,
    "referenceSizeForFooter": (inSection: number) => Size,
}

declare class UICollectionViewFlowLayout extends UICollectionViewLayout {
    minimumLineSpacing: number
    minimumInteritemSpacing: number
    itemSize: Size
    headerReferenceSize: Size
    footerReferenceSize: Size
    sectionInset: EdgeInsets
    scrollDirection: UICollectionViewScrollDirection
    // EventEmitter
    on<K extends keyof UICollectionViewFlowLayoutEventMap>(type: K, listener: UICollectionViewFlowLayoutEventMap[K]): this
    once<K extends keyof UICollectionViewFlowLayoutEventMap>(type: K, listener: UICollectionViewFlowLayoutEventMap[K]): this
    off<K extends keyof UICollectionViewFlowLayoutEventMap>(type: K, listener: UICollectionViewFlowLayoutEventMap[K]): this
    emit<K extends keyof UICollectionViewFlowLayoutEventMap>(type: K, ...args: any[]): this
}

interface UITableViewEventMap extends UIScrollViewEventMap {
    "numberOfSections": () => number,
    "numberOfRows": (inSection: number) => number,
    "heightForRow": (indexPath: UIIndexPath) => number,
    "cellForRow": (indexPath: UIIndexPath) => UITableViewCell,
    "viewForHeader": (inSection: number) => UIView | undefined,
    "heightForHeader": (inSection: number) => number,
    "viewForFooter": (inSection: number) => UIView | undefined,
    "heightForFooter": (inSection: number) => number,
    "didSelectRow": (indexPath: UIIndexPath, cell: UITableViewCell) => void,
    "didDeselectRow": (indexPath: UIIndexPath, cell: UITableViewCell) => void,
}

declare class UITableView extends UIScrollView {
    tableHeaderView: UIView | undefined
    tableFooterView: UIView | undefined
    separatorColor: UIColor | undefined
    separatorInset: EdgeInsets
    allowsSelection: boolean
    allowsMultipleSelection: boolean
    register(initializer: (context: any) => UITableViewCell, reuseIdentifier: string): void
    dequeueReusableCell(reuseIdentifier: string, indexPath: UIIndexPath): UITableViewCell
    reloadData(): void
    selectRow(indexPath: UIIndexPath, animated: boolean): void
    deselectRow(indexPath: UIIndexPath, animated: boolean): void
    // EventEmitter
    on<K extends keyof UITableViewEventMap>(type: K, listener: UITableViewEventMap[K]): this
    once<K extends keyof UITableViewEventMap>(type: K, listener: UITableViewEventMap[K]): this
    off<K extends keyof UITableViewEventMap>(type: K, listener: UITableViewEventMap[K]): this
    emit<K extends keyof UITableViewEventMap>(type: K, ...args: any[]): this
}

interface UITableViewCellEventMap extends BaseEventMap {
    "selected": (sender: UITableViewCell, selected: boolean, animated: boolean) => void,
    "highlighted": (sender: UITableViewCell, highlighted: boolean, animated: boolean) => void,
}

declare class UITableViewCell extends UIView {
    constructor(context: any)
    readonly contentView: UIView
    readonly reuseIdentifier: string | undefined
    hasSelectionStyle: boolean
    // EventEmitter
    on<K extends keyof UITableViewCellEventMap>(type: K, listener: UITableViewCellEventMap[K]): this
    once<K extends keyof UITableViewCellEventMap>(type: K, listener: UITableViewCellEventMap[K]): this
    off<K extends keyof UITableViewCellEventMap>(type: K, listener: UITableViewCellEventMap[K]): this
    emit<K extends keyof UITableViewCellEventMap>(type: K, ...args: any[]): this
}

interface UIScrollViewEventMap extends BaseEventMap {
    "didScroll": (sender: UIScrollView) => void,
    "willBeginDragging": (sender: UIScrollView) => void,
    "willEndDragging": (sender: UIScrollView, velocity: Point) => Point | undefined,
    "didEndDragging": (sender: UIScrollView, decelerate: boolean) => void,
    "willBeginDecelerating": (sender: UIScrollView) => void,
    "didEndDecelerating": (sender: UIScrollView) => void,
    "didEndScrollingAnimation": (sender: UIScrollView) => void,
    "didScrollToTop": (sender: UIScrollView) => void,
}

declare class UIScrollView extends UIView {
    contentOffset: Point
    contentSize: Size
    contentInset: EdgeInsets
    directionalLockEnabled: boolean
    bounces: boolean
    alwaysBounceVertical: boolean
    alwaysBounceHorizontal: boolean
    pagingEnabled: boolean
    scrollEnabled: boolean
    showsHorizontalScrollIndicator: boolean
    showsVerticalScrollIndicator: boolean
    setContentOffset(contentOffset: Point, animated: boolean): void
    scrollRectToVisible(rect: Rect, animated: boolean): void
    readonly tracking: boolean
    readonly dragging: boolean
    readonly decelerating: boolean
    scrollsToTop: boolean
    // EventEmitter
    on<K extends keyof UIScrollViewEventMap>(type: K, listener: UIScrollViewEventMap[K]): this
    once<K extends keyof UIScrollViewEventMap>(type: K, listener: UIScrollViewEventMap[K]): this
    off<K extends keyof UIScrollViewEventMap>(type: K, listener: UIScrollViewEventMap[K]): this
    emit<K extends keyof UIScrollViewEventMap>(type: K, ...args: any[]): this
}

interface UIRefreshControlEventMap extends BaseEventMap {
    "refresh": (sender: UIRefreshControl) => void,
}

declare class UIRefreshControl extends UIView {
    enabled: boolean
    readonly refreshing: boolean
    tintColor: UIColor
    beginRefreshing(): void
    endRefreshing(): void
    // EventEmitter
    on<K extends keyof UIRefreshControlEventMap>(type: K, listener: UIRefreshControlEventMap[K]): this
    once<K extends keyof UIRefreshControlEventMap>(type: K, listener: UIRefreshControlEventMap[K]): this
    off<K extends keyof UIRefreshControlEventMap>(type: K, listener: UIRefreshControlEventMap[K]): this
    emit<K extends keyof UIRefreshControlEventMap>(type: K, ...args: any[]): this
}

interface UIFetchMoreControlEventMap extends BaseEventMap {
    "fetch": (sender: UIFetchMoreControl) => void,
}

declare class UIFetchMoreControl extends UIView {
    enabled: boolean
    readonly fetching: boolean
    tintColor: UIColor
    beginFetching(): void
    endFetching(): void
    // EventEmitter
    on<K extends keyof UIFetchMoreControlEventMap>(type: K, listener: UIFetchMoreControlEventMap[K]): this
    once<K extends keyof UIFetchMoreControlEventMap>(type: K, listener: UIFetchMoreControlEventMap[K]): this
    off<K extends keyof UIFetchMoreControlEventMap>(type: K, listener: UIFetchMoreControlEventMap[K]): this
    emit<K extends keyof UIFetchMoreControlEventMap>(type: K, ...args: any[]): this
}

declare class UIAlert {
    constructor(message: string, buttonText?: string)
    show(completed?: () => void): void
}

declare class UIPrompt {
    constructor(message: string)
    confirmTitle: string
    cancelTitle: string
    placeholder: string
    defaultValue: string
    show(completed: (text: string) => void, cancelled?: () => void): void
}

declare class UIConfirm {
    constructor(message: string)
    confirmTitle: string
    cancelTitle: string
    show(completed?: () => void, cancelled?: () => void): void
}

declare class UIActionSheet {
    message: string | undefined
    addRegularAction(title: string, acitonBlock?: () => void): void
    addDangerAction(title: string, acitonBlock?: () => void): void
    addCancelAction(title: string, acitonBlock?: () => void): void
    show(): void
}

declare class UIActivityIndicatorView extends UIView {
    color: UIColor
    largeStyle: boolean
    readonly animating: boolean
    startAnimating(): void
    stopAnimating(): void
}

interface UISwitchEventMap extends BaseEventMap {
    "valueChanged": (sender: UISwitch) => void,
}

declare class UISwitch extends UIView {
    onTintColor: UIColor | undefined
    thumbTintColor: UIColor | undefined
    isOn: boolean
    setOn(on: boolean, animated: boolean): void
    // EventEmitter
    on<K extends keyof UISwitchEventMap>(type: K, listener: UISwitchEventMap[K]): this
    once<K extends keyof UISwitchEventMap>(type: K, listener: UISwitchEventMap[K]): this
    off<K extends keyof UISwitchEventMap>(type: K, listener: UISwitchEventMap[K]): this
    emit<K extends keyof UISwitchEventMap>(type: K, ...args: any[]): this
}

interface UISliderEventMap extends BaseEventMap {
    "valueChanged": (sender: UISlider) => void,
}

declare class UISlider extends UIView {
    value: number
    minimumValue: number
    maximumValue: number
    minimumTrackTintColor: UIColor | undefined
    maximumTrackTintColor: UIColor | undefined
    thumbTintColor: UIColor | undefined
    setValue(value: number, animated: boolean): void
    // EventEmitter
    on<K extends keyof UISliderEventMap>(type: K, listener: UISliderEventMap[K]): this
    once<K extends keyof UISliderEventMap>(type: K, listener: UISliderEventMap[K]): this
    off<K extends keyof UISliderEventMap>(type: K, listener: UISliderEventMap[K]): this
    emit<K extends keyof UISliderEventMap>(type: K, ...args: any[]): this
}

interface UIProgressViewEventMap extends BaseEventMap {
    "valueChanged": (sender: UIProgressView) => void,
}

declare class UIProgressView extends UIView {
    progress: number
    setProgress(value: number, animated: boolean): void
    progressTintColor: UIColor | undefined
    trackTintColor: UIColor | undefined
    // EventEmitter
    on<K extends keyof UIProgressViewEventMap>(type: K, listener: UIProgressViewEventMap[K]): this
    once<K extends keyof UIProgressViewEventMap>(type: K, listener: UIProgressViewEventMap[K]): this
    off<K extends keyof UIProgressViewEventMap>(type: K, listener: UIProgressViewEventMap[K]): this
    emit<K extends keyof UIProgressViewEventMap>(type: K, ...args: any[]): this
}

interface UIWebViewEventMap extends BaseEventMap {
    "newRequest": (request: URLRequest) => boolean,
    "didStart": () => void,
    "didFinish": () => void,
    "didFail": (error: Error) => void,
    "message": (message: string) => void,
}

declare class UIWebView extends UIView {
    readonly title: string | undefined
    readonly URL: URL | undefined
    readonly loading: boolean
    loadRequest(request: URLRequest): void
    loadHTMLString(HTMLString: string, baseURL: URL): void
    goBack(): void
    goForward(): void
    reload(): void
    stopLoading(): void
    evaluateJavaScript(script: string, completed: (result?: any, error?: Error) => void): void
    // EventEmitter
    on<K extends keyof UIWebViewEventMap>(type: K, listener: UIWebViewEventMap[K]): this
    once<K extends keyof UIWebViewEventMap>(type: K, listener: UIWebViewEventMap[K]): this
    off<K extends keyof UIWebViewEventMap>(type: K, listener: UIWebViewEventMap[K]): this
    emit<K extends keyof UIWebViewEventMap>(type: K, ...args: any[]): this
}

declare class UIStackView extends UIView {
    constructor(arrangedSubviews: UIView[])
    readonly arrangedSubviews: UIView[]
    addArrangedSubview(view: UIView): void
    removeArrangedSubview(view: UIView): void
    insertArrangedSubview(view: UIView, atIndex: number): void
    layoutArrangedSubview(subview: UIView, size: { width?: number, height?: number }): void
    axis: UILayoutConstraintAxis
    distribution: UIStackViewDistribution
    alignment: UIStackViewAlignment
    spacing: number
}

declare class UIWindow extends UIView {
    rootViewController?: UIViewController
    endEditing(): void
}

// View Controllers

interface UIViewControllerEventMap extends BaseEventMap {
    "viewWillLayoutSubviews": (sender: UIViewController) => void,
    "keyboardWillShow": (keyboardRect: Rect, animationDuration: number) => void,
    "keyboardWillHide": (animationDuration: number) => void,
    "statusBarStyle": () => UIStatusBarStyle,
}

declare class UIViewController {
    title: string
    view: UIView
    safeAreaInsets: EdgeInsets
    viewDidLoad(): void
    viewWillAppear(animated: boolean): void
    viewDidAppear(animated: boolean): void
    viewWillDisappear(animated: boolean): void
    viewDidDisappear(animated: boolean): void
    viewWillLayoutSubviews(): void
    viewDidLayoutSubviews(): void
    readonly parentViewController: UIViewController | undefined
    readonly presentedViewController: UIViewController | undefined
    readonly presentingViewController: UIViewController | undefined
    presentViewController(viewController: UIViewController, animated?: boolean, completion?: () => void): void
    dismissViewController(animated?: boolean, completion?: () => void): void
    readonly childViewControllers: UIViewController[]
    addChildViewController(viewController: UIViewController): void
    removeFromParentViewController(): void
    willMoveToParentViewController(parent?: UIViewController): void
    didMoveToParentViewController(parent?: UIViewController): void
    readonly navigationController: UINavigationController | undefined
    readonly navigationItem: UINavigationItem
    readonly tabBarController: UITabBarController
    readonly tabBarItem: UITabBarItem
    setNeedsStatusBarAppearanceUpdate(): void
    // EventEmitter
    on<K extends keyof UIViewControllerEventMap>(type: K, listener: UIViewControllerEventMap[K]): this
    once<K extends keyof UIViewControllerEventMap>(type: K, listener: UIViewControllerEventMap[K]): this
    off<K extends keyof UIViewControllerEventMap>(type: K, listener: UIViewControllerEventMap[K]): this
    emit<K extends keyof UIViewControllerEventMap>(type: K, ...args: any[]): this
}

declare class UINavigationBarViewController extends UIViewController {
    navigationBarContentHeight: number
    navigationBarInFront: boolean
    navigationBar: UIView
}

declare class UINavigationController extends UIViewController {
    constructor(rootViewController?: UIViewController)
    pushViewController(viewController: UIViewController, animated?: boolean): void
    popViewController(animated?: boolean): UIViewController | undefined
    popToViewController(viewController: UIViewController, animated?: boolean): UIViewController[]
    popToRootViewController(animated?: boolean): UIViewController[]
    setViewControllers(viewControllers: UIViewController[], animated?: boolean): void
    readonly navigationBar: UINavigationBar
    setNavigationBarHidden(hidden: boolean, animated: boolean): void
}

declare class UINavigationBar extends UIView {
    translucent: boolean
    barTintColor: UIColor | undefined
    titleTextAttributes: { [key: string]: any }   // key: UIAttributedStringKey
    backIndicatorImage: UIImage | undefined
    backIndicatorTransitionMaskImage: UIImage | undefined
}

declare class UINavigationItem {
    title: string
    hidesBackButton: boolean
    leftBarButtonItem: UIBarButtonItem
    leftBarButtonItems: UIBarButtonItem[]
    rightBarButtonItem: UIBarButtonItem
    rightBarButtonItems: UIBarButtonItem[]
}

interface UIBarButtonItemEventMap extends BaseEventMap {
    "touchUpInside": (sender: UIBarButtonItem) => void,
}

declare class UIBarButtonItem {
    title: string | undefined
    titleAttributes: { [key: string]: any }   // key: UIAttributedStringKey
    image: UIImage | undefined
    tintColor: UIColor
    width: number
    customView: UIView | undefined
    // EventEmitter
    on<K extends keyof UIBarButtonItemEventMap>(type: K, listener: UIBarButtonItemEventMap[K]): this
    once<K extends keyof UIBarButtonItemEventMap>(type: K, listener: UIBarButtonItemEventMap[K]): this
    off<K extends keyof UIBarButtonItemEventMap>(type: K, listener: UIBarButtonItemEventMap[K]): this
    emit<K extends keyof UIBarButtonItemEventMap>(type: K, ...args: any[]): this
}

interface UITabBarControllerEventMap extends UIViewControllerEventMap {
    "onSelectedViewController": (sender: UITabBarController, repeat: boolean) => void,
}

declare class UITabBarController extends UIViewController {
    selectedIndex: number
    selectedViewController: UIViewController | undefined
    setViewControllers(viewControllers: UIViewController[], animated?: boolean): void
    readonly tabBar: UITabBar
    // EventEmitter
    on<K extends keyof UITabBarControllerEventMap>(type: K, listener: UITabBarControllerEventMap[K]): this
    once<K extends keyof UITabBarControllerEventMap>(type: K, listener: UITabBarControllerEventMap[K]): this
    off<K extends keyof UITabBarControllerEventMap>(type: K, listener: UITabBarControllerEventMap[K]): this
    emit<K extends keyof UITabBarControllerEventMap>(type: K, ...args: any[]): this
}

declare class UITabBar extends UIView {
    translucent: boolean
    barTintColor: UIColor
    tintColor: UIColor
    unselectedItemTintColor: UIColor
}

declare class UITabBarItem {
    title: string | undefined
    image: UIImage | undefined
    selectedImage: UIImage | undefined
    imageInsets: EdgeInsets
}

interface UIPageViewControllerEventMap extends UIViewControllerEventMap {
    "beforeViewController": (currentPage: UIViewController) => UIViewController | undefined,
    "afterViewController": (currentPage: UIViewController) => UIViewController | undefined,
    "didFinishAnimating": (currentPage: UIViewController, previousPage: UIViewController) => void,
}

declare class UIPageViewController extends UIViewController {
    constructor(isVertical?: boolean)
    loops: boolean
    pageItems: UIViewController[]
    currentPage: UIViewController | undefined
    scrollToNextPage(animated?: boolean): void
    scrollToPreviousPage(animated?: boolean): void
    // EventEmitter
    on<K extends keyof UIPageViewControllerEventMap>(type: K, listener: UIPageViewControllerEventMap[K]): this
    once<K extends keyof UIPageViewControllerEventMap>(type: K, listener: UIPageViewControllerEventMap[K]): this
    off<K extends keyof UIPageViewControllerEventMap>(type: K, listener: UIPageViewControllerEventMap[K]): this
    emit<K extends keyof UIPageViewControllerEventMap>(type: K, ...args: any[]): this
}

// Other Classes

declare class UIAnimator {
    static curve(duration: number, animations: () => void, completion?: (finished: boolean) => void): void
    static linear(duration: number, animations: () => void, completion?: (finished: boolean) => void): void
    static spring(tension: number, friction: number, animations: () => void, completion?: () => void): void
    static bouncy(bounciness: number, speed: number, animations: () => void, completion?: () => void): void
}

declare enum UIGestureRecognizerState {
    possible,
    began,
    changed,
    ended,
    cancelled,
    failed,
}

declare class UIGestureRecognizer {
    readonly state: UIGestureRecognizerState
    enabled: boolean
    readonly view: UIView | undefined
    requiresExclusiveTouchType: boolean
    requireGestureRecognizerToFail(otherGestureRecognizer: UIGestureRecognizer): void
    locationInView(view: UIView): Point
}

interface UITapGestureRecognizerEventMap extends BaseEventMap {
    "touch": (sender: UITapGestureRecognizer) => void,
}

declare class UITapGestureRecognizer extends UIGestureRecognizer {
    numberOfTapsRequired: number
    numberOfTouchesRequired: number
    // EventEmitter
    on<K extends keyof UITapGestureRecognizerEventMap>(type: K, listener: UITapGestureRecognizerEventMap[K]): this
    once<K extends keyof UITapGestureRecognizerEventMap>(type: K, listener: UITapGestureRecognizerEventMap[K]): this
    off<K extends keyof UITapGestureRecognizerEventMap>(type: K, listener: UITapGestureRecognizerEventMap[K]): this
    emit<K extends keyof UITapGestureRecognizerEventMap>(type: K, ...args: any[]): this
}

interface UILongPressGestureRecognizerEventMap extends BaseEventMap {
    "began": (sender: UILongPressGestureRecognizer) => void,
    "changed": (sender: UILongPressGestureRecognizer) => void,
    "ended": (sender: UILongPressGestureRecognizer) => void,
    "cancelled": (sender: UILongPressGestureRecognizer) => void,
}

declare class UILongPressGestureRecognizer extends UIGestureRecognizer {
    numberOfTapsRequired: number
    numberOfTouchesRequired: number
    minimumPressDuration: number
    allowableMovement: number
    // EventEmitter
    on<K extends keyof UILongPressGestureRecognizerEventMap>(type: K, listener: UILongPressGestureRecognizerEventMap[K]): this
    once<K extends keyof UILongPressGestureRecognizerEventMap>(type: K, listener: UILongPressGestureRecognizerEventMap[K]): this
    off<K extends keyof UILongPressGestureRecognizerEventMap>(type: K, listener: UILongPressGestureRecognizerEventMap[K]): this
    emit<K extends keyof UILongPressGestureRecognizerEventMap>(type: K, ...args: any[]): this
}

interface UIPanGestureRecognizerEventMap extends BaseEventMap {
    "began": (sender: UIPanGestureRecognizer) => void,
    "changed": (sender: UIPanGestureRecognizer) => void,
    "ended": (sender: UIPanGestureRecognizer) => void,
    "cancelled": (sender: UIPanGestureRecognizer) => void,
}

declare class UIPanGestureRecognizer extends UIGestureRecognizer {
    minimumNumberOfTouches: number
    maximumNumberOfTouches: number
    translationInView(view?: UIView): Point
    setTranslation(translate: Point, inView?: UIView): void
    velocityInView(view?: UIView): Point
    // EventEmitter
    on<K extends keyof UIPanGestureRecognizerEventMap>(type: K, listener: UIPanGestureRecognizerEventMap[K]): this
    once<K extends keyof UIPanGestureRecognizerEventMap>(type: K, listener: UIPanGestureRecognizerEventMap[K]): this
    off<K extends keyof UIPanGestureRecognizerEventMap>(type: K, listener: UIPanGestureRecognizerEventMap[K]): this
    emit<K extends keyof UIPanGestureRecognizerEventMap>(type: K, ...args: any[]): this
}

interface UIPinchGestureRecognizerEventMap extends BaseEventMap {
    "began": (sender: UIPinchGestureRecognizer) => void,
    "changed": (sender: UIPinchGestureRecognizer) => void,
    "ended": (sender: UIPinchGestureRecognizer) => void,
    "cancelled": (sender: UIPinchGestureRecognizer) => void,
}

declare class UIPinchGestureRecognizer extends UIGestureRecognizer {
    scale: number
    readonly velocity: number
    // EventEmitter
    on<K extends keyof UIPinchGestureRecognizerEventMap>(type: K, listener: UIPinchGestureRecognizerEventMap[K]): this
    once<K extends keyof UIPinchGestureRecognizerEventMap>(type: K, listener: UIPinchGestureRecognizerEventMap[K]): this
    off<K extends keyof UIPinchGestureRecognizerEventMap>(type: K, listener: UIPinchGestureRecognizerEventMap[K]): this
    emit<K extends keyof UIPinchGestureRecognizerEventMap>(type: K, ...args: any[]): this
}

interface UIRotationGestureRecognizerEventMap extends BaseEventMap {
    "began": (sender: UIRotationGestureRecognizer) => void,
    "changed": (sender: UIRotationGestureRecognizer) => void,
    "ended": (sender: UIRotationGestureRecognizer) => void,
    "cancelled": (sender: UIRotationGestureRecognizer) => void,
}

declare class UIRotationGestureRecognizer extends UIGestureRecognizer {
    rotation: number
    readonly velocity: number
    // EventEmitter
    on<K extends keyof UIRotationGestureRecognizerEventMap>(type: K, listener: UIRotationGestureRecognizerEventMap[K]): this
    once<K extends keyof UIRotationGestureRecognizerEventMap>(type: K, listener: UIRotationGestureRecognizerEventMap[K]): this
    off<K extends keyof UIRotationGestureRecognizerEventMap>(type: K, listener: UIRotationGestureRecognizerEventMap[K]): this
    emit<K extends keyof UIRotationGestureRecognizerEventMap>(type: K, ...args: any[]): this
}

declare class UIColor {
    static readonly black: UIColor
    static readonly clear: UIColor
    static readonly gray: UIColor
    static readonly red: UIColor
    static readonly yellow: UIColor
    static readonly green: UIColor
    static readonly blue: UIColor
    static readonly white: UIColor
    constructor(r: number, g: number, b: number, a: number)
}

declare class UIFont {
    constructor(
        pointSize: number,
        fontStyle?: "thin" | "light" | "regular" | "medium" | "bold" | "heavy" | "black" | "italic",
        fontName?: string
    )
}

declare enum UIImageRenderingMode {
    automatic,
    alwaysOriginal,
    alwaysTemplate,
}

declare class UIImage {
    constructor(options: { name?: string, base64?: string, data?: Data, renderingMode?: UIImageRenderingMode })
    readonly size: Size
    readonly scale: number
}

declare class UIAttributedString {
    constructor(str: string, attributes: { [key: string]: any })  // attributes -> key: UIAttributedStringKey
    measure(inSize: Size): Rect
    mutable(): UIMutableAttributedString
}

declare class UIMutableAttributedString extends UIAttributedString {
    constructor(str: string, attributes: { [key: string]: any })  // attributes -> key: UIAttributedStringKey
    replaceCharacters(inRange: Range, withString: string): void
    setAttributes(attributes: { [key: string]: any }, range: Range): void
    addAttribute(attrName: string, value: any, range: Range): void
    addAttributes(attributes: { [key: string]: any }, range: Range): void
    removeAttribute(attrName: string, range: Range): void
    replaceCharactersWithAttributedString(inRange: Range, withAttributedString: UIAttributedString): void
    insertAttributedString(attributedString: UIAttributedString, atIndex: number): void
    appendAttributedString(attributedString: UIAttributedString): void
    deleteCharacters(inRange: Range): void
    immutable(): UIAttributedString
}

declare enum UIAttributedStringKey {
    foregroundColor,      // value: UIColor
    font,                 // value: UIFont
    backgroundColor,      // value: UIColor
    kern,                 // value: number
    strikethroughStyle,   // value: number
    underlineStyle,       // value: number
    strokeColor,          // value: UIColor
    strokeWidth,          // value: number
    underlineColor,       // value: UIColor
    strikethroughColor,   // value: UIColor
    paragraphStyle,       // value: NSParagraphStyle
}

declare class UIParagraphStyle {
    lineSpacing: number
    alignment: UITextAlignment
    lineBreakMode: UILineBreakMode
    minimumLineHeight: number
    maximumLineHeight: number
    lineHeightMultiple: number
}

declare class UIIndexPath {
    constructor(row: number, section: number)
    readonly row: number
    readonly section: number
}

declare class UIScreen {
    static readonly main: UIScreen
    readonly bounds: Rect
    readonly scale: number
}

declare class UIDevice {
    static readonly current: UIDevice
    readonly name: string
    readonly model: string
    readonly systemName: string
    readonly systemVersion: string
    readonly identifierForVendor: UUID
}

declare class UIBezierPath {
    moveTo(toPoint: Point): void
    addLineTo(toPoint: Point): void
    addArcTo(toCenter: Point, radius: number, startAngle: number, endAngle: number, closewise: boolean): void
    addCurveTo(toPoint: Point, controlPoint1: Point, controlPoint2: Point): void
    addQuadCurveTo(toPoint: Point, controlPoint: Point): void
    closePath(): void
    removeAllPoints(): void
    appendPath(path: UIBezierPath): void
}

declare class UIPasteboard {
    static readonly shared: UIPasteboard
    string: string | undefined
}

declare class UIMenu {
    addMenuItem(title: string, actionBlock:() => void): void
    show(inView: UIView): void
}