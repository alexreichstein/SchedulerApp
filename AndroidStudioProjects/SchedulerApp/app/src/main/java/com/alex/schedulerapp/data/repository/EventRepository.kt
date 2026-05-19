package com.alex.schedulerapp.data.repository

import com.alex.schedulerapp.data.local.dao.EventDao
import com.alex.schedulerapp.data.local.dao.UserDao
import com.alex.schedulerapp.data.local.entity.Event
import com.alex.schedulerapp.data.local.entity.User
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EventRepository @Inject constructor(
    private val eventDao: EventDao,
    private val userDao: UserDao
) {
    fun getAllEvents(): Flow<List<Event>> = eventDao.getAllEvents()

    fun getEventsByUser(userId: Int): Flow<List<Event>> =
        eventDao.getEventsByUser(userId)

    fun getAllUsers(): Flow<List<User>> = userDao.getAllUsers()

    suspend fun insertEvent(event: Event): Long = eventDao.insertEvent(event)

    suspend fun updateEvent(event: Event) = eventDao.updateEvent(event)

    suspend fun deleteEvent(event: Event) = eventDao.deleteEvent(event)

    suspend fun getEventById(eventId: Int): Event? = eventDao.getEventById(eventId)
}