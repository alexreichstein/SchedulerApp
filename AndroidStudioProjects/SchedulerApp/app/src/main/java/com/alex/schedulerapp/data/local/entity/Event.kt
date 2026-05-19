package com.alex.schedulerapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "events")
data class Event(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val description: String = "",
    val startTime: Long,
    val endTime: Long,
    val userId: Int,
    val categoryId: Int? = null,
    val reminderMinutes: Int = 15
)