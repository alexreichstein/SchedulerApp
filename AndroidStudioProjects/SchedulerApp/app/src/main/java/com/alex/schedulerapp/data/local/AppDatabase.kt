package com.alex.schedulerapp.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.alex.schedulerapp.data.local.dao.EventDao
import com.alex.schedulerapp.data.local.dao.UserDao
import com.alex.schedulerapp.data.local.entity.Event
import com.alex.schedulerapp.data.local.entity.User

@Database(
    entities = [User::class, Event::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun eventDao(): EventDao

    companion object {
        val PREPOPULATE_USERS = listOf(
            User(id = 1, name = "Alex", color = 0xFF4285F4),
            User(id = 2, name = "Melinda", color = 0xFF34A853),
            User(id = 3, name = "Ryan", color = 0xFFEA4335)
        )
    }
}