require('../../src/app')

Page({
    data: {},
    onLoad: function () {
        if (global.main) {
            global.main.attach(this, "main")
        }
    }
})
