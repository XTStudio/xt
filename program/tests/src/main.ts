/// <reference path="../../../types/index.d.ts" />

@UIReload("MainViewController", sender => {
    sender.viewWillLayoutSubviews()
})
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
        this.fooLabel.frame = UIRectMake(0, 0, 300, 300)
        this.fooLabel.backgroundColor = UIColor.yellow
        console.info("viewWillLayoutSubviews")
    }

}

global.main = new MainViewController
