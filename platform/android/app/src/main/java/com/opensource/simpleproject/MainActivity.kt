package com.opensource.simpleproject

import android.app.Activity
import android.os.Bundle
import android.os.SystemClock
import android.widget.Toast
import com.xt.endo.EDOExporter
import com.xt.endo.EDOObjectTransfer
import com.xt.jscore.JSContext
import com.xt.kimi.debugger.KIMIDebugger
import com.xt.kimi.uikit.UIViewController

class MainActivity : Activity() {

    var mainContext: JSContext? = null
    var mainViewController: UIViewController? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        this.setupDebugger()
    }

    fun setupDebugger() {
        val debugger = KIMIDebugger(this)
        debugger.connect({
            it["main"]?.let {
                (EDOObjectTransfer.convertToJavaObjectWithJSValue(it, it, null) as? UIViewController)?.let {
                    it.attachToActivity(this, true)
                    this.mainViewController = it
                }
            }
            this.mainContext = it
        }, {
            this.setupContext()
        })
    }

    fun setupContext() {
        val mainContext = JSContext()
        EDOExporter.sharedExporter.exportWithContext(mainContext)
        val script = String(this.assets.open("app.js").use { return@use it.readBytes() })
        mainContext.evaluateScript(script)
        mainContext["main"]?.let {
            (EDOObjectTransfer.convertToJavaObjectWithJSValue(it, it, null) as? UIViewController)?.let {
                it.attachToActivity(this, true)
                this.mainViewController = it
            }
        }
        this.mainContext = mainContext
    }

    private var nextBackTime: Long = 0

    override fun onBackPressed() {
        if (this.mainViewController?.canGoBack() == true) {
            this.mainViewController?.goBack()
            return
        }
        if (nextBackTime > SystemClock.uptimeMillis()) {
            super.onBackPressed()
        }
        else {
            nextBackTime = SystemClock.uptimeMillis() + 2000
            val toast = Toast.makeText(this, "Double tap back button will exit application.", Toast.LENGTH_SHORT)
            toast.show()
        }
    }

}
