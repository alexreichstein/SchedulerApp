package com.alex.schedulerapp.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.alex.schedulerapp.ui.calendar.CalendarScreen

// Definierar alla skärmar i appen som sealed class
// Sealed class = en stängd hierarki, bara dessa routes kan existera
sealed class Screen(val route: String) {
    object Calendar : Screen("calendar")
    object CreateEvent : Screen("create_event")
    object EditEvent : Screen("edit_event/{eventId}") {
        fun createRoute(eventId: Int) = "edit_event/$eventId"
    }
}

@Composable
fun SchedulerNavHost(
    navController: NavHostController = rememberNavController()
) {
    // NavHost håller koll på vilken skärm som visas
    // startDestination = vilken skärm som visas vid appstart
    NavHost(
        navController = navController,
        startDestination = Screen.Calendar.route
    ) {
        composable(Screen.Calendar.route) {
            CalendarScreen(
                onCreateEvent = { navController.navigate(Screen.CreateEvent.route) }
            )
        }

        composable(Screen.CreateEvent.route) {
            androidx.compose.material3.Text("Skapa händelse kommer här")
        }

        composable(Screen.EditEvent.route) {
            androidx.compose.material3.Text("Redigera händelse kommer här")
        }
    }
}