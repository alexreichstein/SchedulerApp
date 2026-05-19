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
import androidx.hilt.navigation.compose.hiltViewModel
import com.alex.schedulerapp.data.local.entity.Event
import com.alex.schedulerapp.data.local.entity.User
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScreen(
    onCreateEvent: () -> Unit = {},
    onEditEvent: (Int) -> Unit = {},
    // hiltViewModel() hämtar automatiskt vår ViewModel via Hilt
    viewModel: CalendarViewModel = hiltViewModel()
) {
    // collectAsState() lyssnar på StateFlow och uppdaterar UI automatiskt
    val currentMonth by viewModel.currentMonth.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    val allEvents by viewModel.allEvents.collectAsState()
    val allUsers by viewModel.allUsers.collectAsState()
    val activeUserId by viewModel.activeUserId.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("sv")) +
                                " ${currentMonth.year}"
                    )
                },
                actions = {
                    // Användarbytare — visar en knapp per användare
                    allUsers.forEach { user ->
                        val isActive = user.id == activeUserId
                        TextButton(
                            onClick = { viewModel.setActiveUser(user.id) },
                            colors = ButtonDefaults.textButtonColors(
                                contentColor = if (isActive)
                                    MaterialTheme.colorScheme.primary
                                else
                                    MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        ) {
                            Text(
                                text = user.name,
                                style = if (isActive)
                                    MaterialTheme.typography.titleMedium
                                else
                                    MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                    // Navigationsknappar för månader
                    TextButton(onClick = { viewModel.previousMonth() }) { Text("‹") }
                    TextButton(onClick = { viewModel.nextMonth() }) { Text("›") }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onCreateEvent) {
                Text("+")
            }
        }
    ) { innerPadding ->
        Column(modifier = Modifier.padding(innerPadding)) {
            WeekDayHeaders()
            MonthGrid(
                yearMonth = currentMonth,
                selectedDate = selectedDate,
                events = allEvents,
                onDayClick = { viewModel.selectDate(it) }
            )
            // Visar händelser för vald dag
            SelectedDayEvents(
                date = selectedDate,
                events = allEvents.filter {
                    val eventDate = java.time.Instant.ofEpochMilli(it.startTime)
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                    eventDate == selectedDate
                },
                users = allUsers,
                onEditEvent = onEditEvent,
                onDeleteEvent = { viewModel.deleteEvent(it) }
            )
        }
    }
}

@Composable
fun WeekDayHeaders() {
    val days = listOf("Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön")
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
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
    events: List<Event>,
    onDayClick: (LocalDate) -> Unit
) {
    val firstDayOfWeek = yearMonth.atDay(1).dayOfWeek.value
    val daysInMonth = yearMonth.lengthOfMonth()
    val dayItems = List(firstDayOfWeek - 1) { null } +
            (1..daysInMonth).map { yearMonth.atDay(it) }

    LazyVerticalGrid(
        columns = GridCells.Fixed(7),
        modifier = Modifier
            .fillMaxWidth()
            .height(320.dp),
        contentPadding = PaddingValues(4.dp)
    ) {
        items(dayItems) { date ->
            if (date == null) {
                Box(modifier = Modifier.size(48.dp))
            } else {
                // Räknar händelser på denna dag
                val hasEvents = events.any {
                    val eventDate = java.time.Instant.ofEpochMilli(it.startTime)
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                    eventDate == date
                }
                DayCell(
                    date = date,
                    isSelected = date == selectedDate,
                    isToday = date == LocalDate.now(),
                    hasEvents = hasEvents,
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
    hasEvents: Boolean,
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
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = date.dayOfMonth.toString(),
                color = textColor,
                style = MaterialTheme.typography.bodyMedium
            )
            // Liten prick om det finns händelser på dagen
            if (hasEvents) {
                Box(
                    modifier = Modifier
                        .size(4.dp)
                        .background(
                            if (isSelected)
                                MaterialTheme.colorScheme.onPrimary
                            else
                                MaterialTheme.colorScheme.primary,
                            shape = MaterialTheme.shapes.small
                        )
                )
            }
        }
    }
}

@Composable
fun SelectedDayEvents(
    date: LocalDate,
    events: List<Event>,
    users: List<User>,
    onEditEvent: (Int) -> Unit,
    onDeleteEvent: (Event) -> Unit
) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Text(
            text = "${date.dayOfMonth} ${date.month.getDisplayName(TextStyle.FULL, Locale("sv"))}",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        if (events.isEmpty()) {
            Text(
                text = "Inga händelser",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium
            )
        } else {
            events.forEach { event ->
                val user = users.find { it.id == event.userId }
                EventCard(
                    event = event,
                    user = user,
                    onEdit = { onEditEvent(event.id) },
                    onDelete = { onDeleteEvent(event) }
                )
            }
        }
    }
}

@Composable
fun EventCard(
    event: Event,
    user: User?,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val userColor = user?.color?.let {
        androidx.compose.ui.graphics.Color(it)
    } ?: MaterialTheme.colorScheme.primary

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onEdit() }
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Färgad linje för användarens färg
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(40.dp)
                    .background(userColor, shape = MaterialTheme.shapes.small)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = event.title,
                    style = MaterialTheme.typography.bodyLarge
                )
                user?.let {
                    Text(
                        text = it.name,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            // Radera-knapp
            TextButton(onClick = onDelete) {
                Text("✕", color = MaterialTheme.colorScheme.error)
            }
        }
    }
}