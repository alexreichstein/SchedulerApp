package com.alex.schedulerapp.ui.event

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun CreateEventScreen(
    onNavigateBack: () -> Unit,
    viewModel: EventViewModel = hiltViewModel()
) {
    LaunchedEffect(Unit) { viewModel.resetForm() }

    val title by viewModel.title.collectAsState()
    val description by viewModel.description.collectAsState()
    val selectedUserId by viewModel.selectedUserId.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    val startTime by viewModel.startTime.collectAsState()
    val endTime by viewModel.endTime.collectAsState()
    val reminderMinutes by viewModel.reminderMinutes.collectAsState()
    val titleError by viewModel.titleError.collectAsState()
    val timeError by viewModel.timeError.collectAsState()
    val allUsers by viewModel.allUsers.collectAsState()
    val allCategories by viewModel.allCategories.collectAsState()
    val selectedCategoryId by viewModel.selectedCategoryId.collectAsState()

    var showDatePicker by remember { mutableStateOf(false) }
    var showStartTimePicker by remember { mutableStateOf(false) }
    var showEndTimePicker by remember { mutableStateOf(false) }

    val dateFormatter = DateTimeFormatter.ofPattern("d MMMM yyyy", java.util.Locale("sv"))
    val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ny händelse") },
                navigationIcon = {
                    TextButton(onClick = onNavigateBack) { Text("Avbryt") }
                },
                actions = {
                    TextButton(onClick = {
                        viewModel.saveEvent(onSuccess = onNavigateBack)
                    }) {
                        Text("Spara")
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = title,
                onValueChange = { viewModel.title.value = it },
                label = { Text("Titel") },
                modifier = Modifier.fillMaxWidth(),
                isError = titleError != null,
                supportingText = { titleError?.let { Text(it) } },
                singleLine = true
            )

            OutlinedTextField(
                value = description,
                onValueChange = { viewModel.description.value = it },
                label = { Text("Beskrivning (valfri)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2
            )

            Text("Användare", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                allUsers.forEach { user ->
                    FilterChip(
                        selected = user.id == selectedUserId,
                        onClick = { viewModel.selectedUserId.value = user.id },
                        label = { Text(user.name) }
                    )
                }
            }

            Text("Kategori", style = MaterialTheme.typography.labelLarge)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                allCategories.forEach { category ->
                    FilterChip(
                        selected = category.id == selectedCategoryId,
                        onClick = {
                            viewModel.selectedCategoryId.value =
                                if (category.id == selectedCategoryId) null else category.id
                        },
                        label = { Text(category.name) },
                        leadingIcon = {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .background(
                                        androidx.compose.ui.graphics.Color(category.color),
                                        shape = androidx.compose.foundation.shape.CircleShape
                                    )
                            )
                        }
                    )
                }
            }

            OutlinedCard(
                onClick = { showDatePicker = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                ListItem(
                    headlineContent = { Text("Datum") },
                    trailingContent = { Text(selectedDate.format(dateFormatter)) }
                )
            }

            timeError?.let {
                Text(it, color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall)
            }
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedCard(
                    onClick = { showStartTimePicker = true },
                    modifier = Modifier.weight(1f)
                ) {
                    ListItem(
                        headlineContent = { Text("Start") },
                        trailingContent = { Text(startTime.format(timeFormatter)) }
                    )
                }
                OutlinedCard(
                    onClick = { showEndTimePicker = true },
                    modifier = Modifier.weight(1f)
                ) {
                    ListItem(
                        headlineContent = { Text("Slut") },
                        trailingContent = { Text(endTime.format(timeFormatter)) }
                    )
                }
            }

            Text("Påminnelse", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(5, 15, 30, 60).forEach { minutes ->
                    FilterChip(
                        selected = minutes == reminderMinutes,
                        onClick = { viewModel.reminderMinutes.value = minutes },
                        label = { Text(if (minutes < 60) "$minutes min" else "1 tim") }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = selectedDate
                .atStartOfDay(java.time.ZoneId.systemDefault())
                .toInstant().toEpochMilli()
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        viewModel.selectedDate.value = java.time.Instant.ofEpochMilli(millis)
                            .atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                    }
                    showDatePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Avbryt") }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    if (showStartTimePicker) {
        val timePickerState = rememberTimePickerState(
            initialHour = startTime.hour,
            initialMinute = startTime.minute,
            is24Hour = true
        )
        AlertDialog(
            onDismissRequest = { showStartTimePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.startTime.value = java.time.LocalTime.of(
                        timePickerState.hour, timePickerState.minute)
                    showStartTimePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showStartTimePicker = false }) { Text("Avbryt") }
            },
            text = { TimePicker(state = timePickerState) }
        )
    }

    if (showEndTimePicker) {
        val timePickerState = rememberTimePickerState(
            initialHour = endTime.hour,
            initialMinute = endTime.minute,
            is24Hour = true
        )
        AlertDialog(
            onDismissRequest = { showEndTimePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.endTime.value = java.time.LocalTime.of(
                        timePickerState.hour, timePickerState.minute)
                    showEndTimePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showEndTimePicker = false }) { Text("Avbryt") }
            },
            text = { TimePicker(state = timePickerState) }
        )
    }
}