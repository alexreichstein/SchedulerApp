package com.alex.schedulerapp.data.local

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

// Migration från version 1 till 2
// Lägger till categories-tabellen och categoryId i events
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // Skapar kategorier-tabellen
        db.execSQL(
            "CREATE TABLE IF NOT EXISTS categories (" +
                    "id INTEGER PRIMARY KEY NOT NULL, " +
                    "name TEXT NOT NULL, " +
                    "color INTEGER NOT NULL)"
        )
        // Lägger till categoryId i events-tabellen
        db.execSQL(
            "ALTER TABLE events ADD COLUMN categoryId INTEGER"
        )
    }
}