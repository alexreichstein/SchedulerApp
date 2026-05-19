package com.alex.schedulerapp.ui.event

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.alex.schedulerapp.ReminderWorker
import com.alex.schedulerapp.data.local.entity.Event
import com.alex.schedulerapp.data.local.entity.User
import com.alex.schedulerapp.data.repository.EventRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@HiltViewModel
class EventViewModel @Inject constructor(
    private val repository: EventRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    val title = MutableStateFlow("")
    val description = MutableStateFlow("")
    val selectedUserId = MutableStateFlow(1)
    val selectedDate = MutableStateFlow(LocalDate.now())
    val startTime = MutableStateFlow(LocalTime.of(8, 0))
    val endTime = MutableStateFlow(LocalTime.of(9, 0))
    val reminderMinutes = MutableStateFlow(15)
    val titleError = MutableStateFlow<String?>(null)
    val timeError = MutableStateFlow<String?>(null)
    private var currentEventId: Int = 0

    val allUsers: StateFlow<List<User>> = repository.getAllUsers()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun loadEvent(event: Event) {
        val zone = ZoneId.systemDefault()
        val start = java.time.Instant.ofEpochMilli(event.startTime).atZone(zone)
        val end = java.time.Instant.ofEpochMilli(event.endTime).atZone(zone)
        title.value = event.title
        description.value = event.description
        selectedUserId.value = event.userId
        selectedDate.value = start.toLocalDate()
        startTime.value = start.toLocalTime()
        endTime.value = end.toLocalTime()
        reminderMinutes.value = event.reminderMinutes
    }

    fun loadEventById(eventId: Int) {
        viewModelScope.launch {
            val event = repository.getEventById(eventId) ?: return@launch
            currentEventId = event.id
            loadEvent(event)
        }
    }

    fun saveEvent(onSuccess: () -> Unit) {
        titleError.value = null
        timeError.value = null
        if (title.value.isBlank()) { titleError.value = "Titel krävs"; return }
        if (endTime.value <= startTime.value) { timeError.value = "Sluttid måste vara efter starttid"; return }

        val zone = ZoneId.systemDefault()
        val startMillis = selectedDate.value.atTime(startTime.value).atZone(zone).toInstant().toEpochMilli()
        val endMillis = selectedDate.value.atTime(endTime.value).atZone(zone).toInstant().toEpochMilli()

        viewModelScope.launch {
            val insertedId = repository.insertEvent(
                Event(
                    title = title.value.trim(),
                    description = description.value.trim(),
                    startTime = startMillis,
                    endTime = endMillis,
                    userId = selectedUserId.value,
                    reminderMinutes = reminderMinutes.value
                )
            ).toInt()
            scheduleReminder(insertedId, title.value.trim(), startMillis, reminderMinutes.value)
            onSuccess()
        }
    }

    fun updateEvent(onSuccess: () -> Unit) {
        titleError.value = null
        timeError.value = null
        if (title.value.isBlank()) { titleError.value = "Titel krävs"; return }
        if (endTime.value <= startTime.value) { timeError.value = "Sluttid måste vara efter starttid"; return }

        val zone = ZoneId.systemDefault()
        val startMillis = selectedDate.value.atTime(startTime.value).atZone(zone).toInstant().toEpochMilli()
        val endMillis = selectedDate.value.atTime(endTime.value).atZone(zone).toInstant().toEpochMilli()

        viewModelScope.launch {
            repository.updateEvent(
                Event(
                    id = currentEventId,
                    title = title.value.trim(),
                    description = description.value.trim(),
                    startTime = startMillis,
                    endTime = endMillis,
                    userId = selectedUserId.value,
                    reminderMinutes = reminderMinutes.value
                )
            )
            cancelReminder(currentEventId)
            scheduleReminder(currentEventId, title.value.trim(), startMillis, reminderMinutes.value)
            onSuccess()
        }
    }

    // Schemalägger en WorkManager-notis innan händelsen börjar
    private fun scheduleReminder(eventId: Int, title: String, startMillis: Long, reminderMinutes: Int) {
        val delay = startMillis - System.currentTimeMillis() - (reminderMinutes * 60 * 1000L)
        if (delay <= 0) return

        val inputData = Data.Builder()
            .putString("event_title", title)
            .putInt("event_id", eventId)
            .build()

        val workRequest = OneTimeWorkRequestBuilder<ReminderWorker>()
            .setInitialDelay(delay, TimeUnit.MILLISECONDS)
            .setInputData(inputData)
            .addTag("reminder_$eventId")
            .build()

        WorkManager.getInstance(context).enqueue(workRequest)
    }

    // Avbokar notis för ett event
    fun cancelReminder(eventId: Int) {
        WorkManager.getInstance(context).cancelAllWorkByTag("reminder_$eventId")
    }

    fun resetForm() {
        title.value = ""
        description.value = ""
        selectedUserId.value = 1
        selectedDate.value = LocalDate.now()
        startTime.value = LocalTime.of(8, 0)
        endTime.value = LocalTime.of(9, 0)
        reminderMinutes.value = 15
        titleError.value = null
        timeError.value = null
        currentEventId = 0
    }
}