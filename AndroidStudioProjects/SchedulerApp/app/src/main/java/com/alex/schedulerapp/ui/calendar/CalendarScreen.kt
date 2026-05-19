package com.alex.schedulerapp.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScreen(
    onDayClick: (LocalDate) -> Unit = {},
    onCreateEvent: () -> Unit = {}
) {
    // Håller koll på vilken månad som visas
    var currentMonth by remember { mutableStateOf(YearMonth.now()) }
    // Håller koll på vald dag
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    // Visar månad och år i toppbaren
                    Text(
                        text = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("sv")) +
                                " ${currentMonth.year}"
                    )
                },
                actions = {
                    // Knapp för att gå till föregående månad
                    TextButton(onClick = { currentMonth = currentMonth.minusMonths(1) }) {
                        Text("‹")
                    }
                    // Knapp för att gå till nästa månad
                    TextButton(onClick = { currentMonth = currentMonth.plusMonths(1) }) {
                        Text("›")
                    }
                }
            )
        },
        floatingActionButton = {
            // FAB för att skapa ny händelse
            FloatingActionButton(onClick = onCreateEvent) {
                Text("+")
            }
        }
    ) { innerPadding ->
        Column(modifier = Modifier.padding(innerPadding)) {
            // Veckodagsrubriker
            WeekDayHeaders()
            // Kalenderrutnätet
            MonthGrid(
                yearMonth = currentMonth,
                selectedDate = selectedDate,
                onDayClick = {
                    selectedDate = it
                    onDayClick(it)
                }
            )
        }
    }
}

@Composable
fun WeekDayHeaders() {
    val days = listOf("Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön")
    Row(modifier = Modifier.fillMaxWidth()) {
        days.forEach { day ->
            Text(
                text = day,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun MonthGrid(
    yearMonth: YearMonth,
    selectedDate: LocalDate,
    onDayClick: (LocalDate) -> Unit
) {
    // Räknar ut vilken veckodag månaden börjar på (1=Mån, 7=Sön)
    val firstDayOfMonth = yearMonth.atDay(1)
    val firstDayOfWeek = firstDayOfMonth.dayOfWeek.value
    val daysInMonth = yearMonth.lengthOfMonth()

    // Bygger en lista med null för tomma rutor i början + dagar i månaden
    val dayItems = List(firstDayOfWeek - 1) { null } +
            (1..daysInMonth).map { yearMonth.atDay(it) }

    LazyVerticalGrid(
        columns = GridCells.Fixed(7),
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(4.dp)
    ) {
        items(dayItems) { date ->
            if (date == null) {
                // Tom ruta för dagar utanför månaden
                Box(modifier = Modifier.size(48.dp))
            } else {
                DayCell(
                    date = date,
                    isSelected = date == selectedDate,
                    isToday = date == LocalDate.now(),
                    onDayClick = onDayClick
                )
            }
        }
    }
}

@Composable
fun DayCell(
    date: LocalDate,
    isSelected: Boolean,
    isToday: Boolean,
    onDayClick: (LocalDate) -> Unit
) {
    val bgColor = when {
        isSelected -> MaterialTheme.colorScheme.primary
        isToday -> MaterialTheme.colorScheme.primaryContainer
        else -> MaterialTheme.colorScheme.surface
    }
    val textColor = when {
        isSelected -> MaterialTheme.colorScheme.onPrimary
        else -> MaterialTheme.colorScheme.onSurface
    }

    Box(
        modifier = Modifier
            .size(48.dp)
            .padding(4.dp)
            .background(bgColor, shape = MaterialTheme.shapes.small)
            .clickable { onDayClick(date) },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = date.dayOfMonth.toString(),
            color = textColor,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}