package com.opensource.tests

import android.app.Application
import com.xt.endo.EDOExporter

class MainApplication: Application() {

    override fun onCreate() {
        super.onCreate()
        EDOExporter.sharedExporter.initializer(this)
    }

}