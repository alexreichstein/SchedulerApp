package com.alex.schedulerapp.ui

import com.alex.schedulerapp.ui.event.EditEventScreen
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.alex.schedulerapp.ui.calendar.CalendarScreen
import com.alex.schedulerapp.ui.event.CreateEventScreen

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
    NavHost(
        navController = navController,
        startDestination = Screen.Calendar.route
    ) {
        composable(Screen.Calendar.route) {
            CalendarScreen(
                onCreateEvent = { navController.navigate(Screen.CreateEvent.route) },
                onEditEvent = { eventId ->
                    navController.navigate(Screen.EditEvent.createRoute(eventId))
                }
            )
        }

        composable(Screen.CreateEvent.route) {
            CreateEventScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.EditEvent.route) { backStackEntry ->
            val eventId = backStackEntry.arguments?.getString("eventId")?.toIntOrNull() ?: return@composable
            EditEventScreen(
                eventId = eventId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}