/// <reference path="../../../types/index.d.ts" />

// @UIReload("MainViewController", sender => {
//     sender.viewWillLayoutSubviews()
// })
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
        this.fooLabel.backgroundColor = UIColor.yellow
        console.info("viewWillLayoutSubviews`1123123")
    }

}

global.main = new MainViewController
