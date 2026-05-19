package com.alex.schedulerapp.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.alex.schedulerapp.data.local.dao.CategoryDao
import com.alex.schedulerapp.data.local.dao.EventDao
import com.alex.schedulerapp.data.local.dao.UserDao
import com.alex.schedulerapp.data.local.entity.Category
import com.alex.schedulerapp.data.local.entity.Event
import com.alex.schedulerapp.data.local.entity.User

@Database(
    entities = [User::class, Event::class, Category::class],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun eventDao(): EventDao
    abstract fun categoryDao(): CategoryDao

    companion object {
        val PREPOPULATE_USERS = listOf(
            User(id = 1, name = "Alex", color = 0xFF4285F4),
            User(id = 2, name = "Melinda", color = 0xFF34A853),
            User(id = 3, name = "Ryan", color = 0xFFEA4335)
        )

        val PREPOPULATE_CATEGORIES = listOf(
            Category(id = 1, name = "Skola",  color = 0xFF4285F4),
            Category(id = 2, name = "Arbete", color = 0xFF34A853),
            Category(id = 3, name = "Fritis", color = 0xFFFF6D00),
            Category(id = 4, name = "Häst",   color = 0xFF795548),
            Category(id = 5, name = "Padel",  color = 0xFF00BCD4),
            Category(id = 6, name = "Golf",   color = 0xFF8BC34A)
        )
    }
}