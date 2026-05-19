package com.alex.schedulerapp.di

import android.content.Context
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.alex.schedulerapp.data.local.AppDatabase
import com.alex.schedulerapp.data.local.dao.CategoryDao
import com.alex.schedulerapp.data.local.dao.EventDao
import com.alex.schedulerapp.data.local.dao.UserDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Singleton
import com.alex.schedulerapp.data.local.MIGRATION_1_2

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "scheduler_db"
        ).addCallback(object : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                CoroutineScope(Dispatchers.IO).launch {
                    provideDatabase(context).let { database ->
                        // Förpopulerar användare
                        AppDatabase.PREPOPULATE_USERS.forEach {
                            database.userDao().insertUser(it)
                        }
                        // Förpopulerar kategorier
                        AppDatabase.PREPOPULATE_CATEGORIES.forEach {
                            database.categoryDao().insertCategory(it)
                        }
                    }
                }
            }
        }).addMigrations(MIGRATION_1_2)
            .build()
    }

    @Provides
    fun provideUserDao(db: AppDatabase): UserDao = db.userDao()

    @Provides
    fun provideEventDao(db: AppDatabase): EventDao = db.eventDao()

    @Provides
    fun provideCategoryDao(db: AppDatabase): CategoryDao = db.categoryDao()
}