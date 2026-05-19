package com.alex.schedulerapp.ui.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.alex.schedulerapp.data.local.entity.Event
import com.alex.schedulerapp.data.local.entity.User
import com.alex.schedulerapp.data.repository.EventRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth
import javax.inject.Inject

// @HiltViewModel låter Hilt skapa och injektera ViewModel automatiskt
@HiltViewModel
class CalendarViewModel @Inject constructor(
    private val repository: EventRepository
) : ViewModel() {

    // Vilken månad som visas just nu
    private val _currentMonth = MutableStateFlow(YearMonth.now())
    val currentMonth: StateFlow<YearMonth> = _currentMonth

    // Vald dag
    private val _selectedDate = MutableStateFlow(LocalDate.now())
    val selectedDate: StateFlow<LocalDate> = _selectedDate

    // Aktiv användare (standard: användare 1)
    private val _activeUserId = MutableStateFlow(1)
    val activeUserId: StateFlow<Int> = _activeUserId

    // Alla händelser från databasen — uppdateras automatiskt via Flow
    val allEvents: StateFlow<List<Event>> = repository.getAllEvents()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // Alla användare från databasen
    val allUsers: StateFlow<List<User>> = repository.getAllUsers()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // Byter till föregående månad
    fun previousMonth() {
        _currentMonth.value = _currentMonth.value.minusMonths(1)
    }

    // Byter till nästa månad
    fun nextMonth() {
        _currentMonth.value = _currentMonth.value.plusMonths(1)
    }

    // Sätter vald dag
    fun selectDate(date: LocalDate) {
        _selectedDate.value = date
    }

    // Byter aktiv användare
    fun setActiveUser(userId: Int) {
        _activeUserId.value = userId
    }

    // Tar bort en händelse
    fun deleteEvent(event: Event) {
        viewModelScope.launch {
            repository.deleteEvent(event)
        }
    }
}