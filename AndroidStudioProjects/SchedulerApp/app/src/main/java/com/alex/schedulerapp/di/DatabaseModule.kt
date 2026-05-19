package com.alex.schedulerapp.di

import android.content.Context
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.alex.schedulerapp.data.local.AppDatabase
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

// @Module talar om för Hilt att den här klassen tillhandahåller beroenden
// @InstallIn(SingletonComponent) betyder att allt här lever lika länge som hela appen
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    // @Provides säger till Hilt hur den ska skapa ett AppDatabase-objekt
    // @Singleton säkerställer att det bara finns EN databas-instans i hela appen
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "scheduler_db" // Namnet på SQLite-filen på enheten
        ).addCallback(object : RoomDatabase.Callback() {
            // onCreate körs automatiskt första gången databasen skapas (vid första appstart)
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                // Kör på en bakgrundstråd via Coroutines så att UI inte fryser
                CoroutineScope(Dispatchers.IO).launch {
                    // Hämtar userDao och loopar igenom de tre fördefinierade användarna
                    // och sparar dem i databasen automatiskt vid installation
                    provideDatabase(context).userDao().let { dao ->
                        AppDatabase.PREPOPULATE_USERS.forEach { dao.insertUser(it) }
                    }
                }
            }
        }).build()
    }

    // Berättar för Hilt hur den ska skapa en UserDao
    // Hilt vet automatiskt att den ska använda AppDatabase från provideDatabase ovan
    @Provides
    fun provideUserDao(db: AppDatabase): UserDao = db.userDao()

    // Samma sak för EventDao — Hilt injekterar AppDatabase automatiskt
    @Provides
    fun provideEventDao(db: AppDatabase): EventDao = db.eventDao()
}