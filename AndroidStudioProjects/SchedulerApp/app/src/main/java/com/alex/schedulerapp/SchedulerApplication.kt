package com.alex.schedulerapp

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

// @HiltAndroidApp aktiverar Hilt för hela appen
// Den här klassen måste registreras i AndroidManifest.xml
@HiltAndroidApp
class SchedulerApplication : Application()