package com.alex.schedulerapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

// Kanal-ID för notiser — måste vara unikt för appen
const val CHANNEL_ID = "scheduler_reminders"
const val CHANNEL_NAME = "Påminnelser"

@HiltWorker
class ReminderWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        // Hämtar data som skickades med när notisen schemalagdes
        val eventTitle = inputData.getString("event_title") ?: "Påminnelse"
        val eventId = inputData.getInt("event_id", 0)

        // Skapar notiskanalen (krävs Android 8+)
        createNotificationChannel()

        // Bygger och skickar notisen
        sendNotification(eventId, eventTitle)

        return Result.success()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            // IMPORTANCE_HIGH gör att notisen visas som popup
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Påminnelser för schemalagda händelser"
        }

        val notificationManager = applicationContext
            .getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.createNotificationChannel(channel)
    }

    private fun sendNotification(eventId: Int, title: String) {
        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Påminnelse")
            .setContentText(title)
            // AUTO_CANCEL stänger notisen när användaren trycker på den
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        val notificationManager = applicationContext
            .getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        // Använder eventId som notis-ID så varje händelse har unik notis
        notificationManager.notify(eventId, notification)
    }
}