package com.alex.schedulerapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.rememberNavController
import com.alex.schedulerapp.ui.SchedulerNavHost
import com.alex.schedulerapp.ui.theme.SchedulerAppTheme
import dagger.hilt.android.AndroidEntryPoint

// Talar om för Hilt att den här Activity kan ta emot injekterade beroenden
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SchedulerAppTheme {
                val navController = rememberNavController()
                SchedulerNavHost(navController = navController)
            }
        }
    }
}