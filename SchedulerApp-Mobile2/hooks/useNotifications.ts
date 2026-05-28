// Hook för att hantera lokala notiser
// Begär tillstånd från användaren och schemalägger påminnelser
// Notisen skickas 15 minuter innan händelsen startar som standard

import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Konfigurerar hur notiser visas när appen är öppen
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Visa notis även när appen är öppen
    shouldPlaySound: true,   // Spela ljud
    shouldSetBadge: false,   // Visa inte badge på appikonen
  }),
});

export function useNotifications() {
  // Begär tillstånd för notiser när hooken används första gången
  useEffect(() => {
    requestPermissions();
  }, []);

  // Begär tillstånd från användaren
  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notistillstånd nekades');
    }
  };

  // Schemalägger en påminnelse för en händelse
  // reminderMinutes = hur många minuter innan händelsen notisen ska skickas
  const scheduleReminder = async (
    eventId: string,
    title: string,
    startTime: number,
    reminderMinutes: number = 15
  ) => {
    // Beräknar när notisen ska skickas
    const triggerTime = new Date(startTime - reminderMinutes * 60 * 1000);

    // Skickar inte notis om tiden redan har passerat
    if (triggerTime <= new Date()) return;

    // Avbryter eventuell tidigare notis för samma händelse
    await cancelReminder(eventId);

    // Schemalägger notisen
    await Notifications.scheduleNotificationAsync({
      identifier: eventId,
      content: {
        title: '📅 Påminnelse',
        body: `${title} börjar om ${reminderMinutes} minuter`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerTime,
      },
    });
  };

  // Avbryter en schemalagd notis
  const cancelReminder = async (eventId: string) => {
    await Notifications.cancelScheduledNotificationAsync(eventId);
  };

  return { scheduleReminder, cancelReminder };
}