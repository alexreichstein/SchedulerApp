// CalendarScreen.tsx
// Huvudskärmen för familjekalendern
// Visar månadskalender, användarknappar och knapp för att lägga till händelser
// Tryck på en dag öppnar en modal med väder och händelser för den dagen
// Inkluderar: felhantering vid Firebase-problem, offline-cache via AsyncStorage
// Fas 2: redigering av befintliga händelser via tryck på EventCard
// Fas 3: valbar påminnelsetid per händelse
// Fas 4: röda dagar, idag-knapp
// Fas 5: haptisk feedback vid interaktioner

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation';
import { useEvents } from '../hooks/useEvents';
import { useTemplates } from '../hooks/useTemplates';
import { useWeather, weatherEmoji, weatherDescription } from '../hooks/useWeather';
import { useNotifications } from '../hooks/useNotifications';
import useHaptics from '../hooks/useHaptics';import CalendarView from '../components/CalendarView';
import EventCard from '../components/EventCard';
import AddEventModal from '../components/AddEventModal';
import { USERS, COLORS } from '../constants';
import { Event } from '../types';

export default function CalendarScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, loading, error, addEvent, updateEvent, deleteEvent } = useEvents(currentMonth);
  const { templates } = useTemplates();
  const { fetchWeather } = useWeather();
  const { scheduleReminder, cancelReminder } = useNotifications();

  // Haptisk feedback — olika nivåer för olika interaktioner
  const { lightTap, mediumTap, heavyTap, errorTap, successTap } = useHaptics();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeUserId, setActiveUserId] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [weather, setWeather] = useState<{ temperature: number; weatherCode: number } | null>(null);

  // Går till föregående månad — lätt haptic
  const prevMonth = () => {
    lightTap();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  // Går till nästa månad — lätt haptic
  const nextMonth = () => {
    lightTap();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Hoppar till aktuell månad och markerar dagens datum — medium haptic
  const goToToday = () => {
    mediumTap();
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Hämtar väder när dagmodalen öppnas eller när vald dag ändras
  useEffect(() => {
    if (showDayModal) {
      setWeather(null);
      fetchWeather(selectedDate).then(setWeather);
    }
  }, [selectedDate, showDayModal]);

  // Anropas när användaren trycker på en dag — lätt haptic
  const handleSelectDate = (date: Date) => {
    lightTap();
    setSelectedDate(date);
    setShowDayModal(true);
  };

  // Filtrerar fram händelser för den valda dagen
  const eventsForSelectedDate = events.filter((e) => {
    const d = new Date(e.startTime);
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    );
  });

  // Sparar händelse — success haptic vid lyckat sparande, error haptic vid fel
  const handleSave = async (data: {
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    userId: number;
    templateColor: string | null;
    reminderMinutes: number;
  }) => {
    try {
      if (editingEvent) {
        // Redigeringsläge — uppdatera befintlig händelse
        await updateEvent(editingEvent.id, {
          ...data,
          categoryId: null,
          reminderMinutes: data.reminderMinutes,
        });

        await cancelReminder(editingEvent.id);
        if (data.reminderMinutes > 0) {
          await scheduleReminder(
            editingEvent.id,
            data.title,
            data.startTime,
            data.reminderMinutes
          );
        }
      } else {
        // Skapandeläge — skapa ny händelse
        const id = await addEvent({
          ...data,
          categoryId: null,
          reminderMinutes: data.reminderMinutes,
        });

        if (id && data.reminderMinutes > 0) {
          await scheduleReminder(id, data.title, data.startTime, data.reminderMinutes);
        }
      }

      // Lyckat sparande — framgångsfeedback
      await successTap();
      setEditingEvent(null);
      setShowAddModal(false);
    } catch (e) {
      // Fel vid sparande — felFeedback
      await errorTap();
      Alert.alert('Fel', 'Kunde inte spara händelsen. Kontrollera din anslutning.');
    }
  };

  // Raderar händelse — tung haptic vid bekräftelse, error haptic vid fel
  const handleDelete = (id: string) => {
    Alert.alert('Ta bort?', 'Vill du ta bort denna händelse?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: async () => {
          try {
            // Tung feedback för destruktiv åtgärd
            await heavyTap();
            await cancelReminder(id);
            await deleteEvent(id);
          } catch (e) {
            await errorTap();
            Alert.alert('Fel', 'Kunde inte radera händelsen. Kontrollera din anslutning.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Laddar...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Översta raden med titel och knapp till Mallar-skärmen */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Familjekalender</Text>
        <TouchableOpacity
          style={styles.templatesBtn}
          onPress={() => {
            lightTap(); // Lätt feedback vid navigering
            navigation.navigate('Templates');
          }}
        >
          <Text style={styles.templatesBtnText}>Mallar</Text>
        </TouchableOpacity>
      </View>

      {/* Användarrad — aktiv användare får sin färg som bakgrund */}
      <View style={styles.userRow}>
        {Object.entries(USERS).map(([id, name]) => (
          <TouchableOpacity
            key={id}
            style={[
              styles.userBtn,
              activeUserId === Number(id) && {
                backgroundColor: COLORS[Number(id)],
              },
            ]}
            onPress={() => {
              lightTap(); // Lätt feedback vid användarbyte
              setActiveUserId(Number(id));
            }}
          >
            <Text
              style={[
                styles.userBtnText,
                activeUserId === Number(id) && { color: '#fff' },
              ]}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gul varningsbanner om Firebase är nere */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Kalenderbehållare — flex: 1 tar upp allt tillgängligt utrymme */}
      <View style={styles.calendarContainer}>
        <CalendarView
          events={events}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          currentMonth={currentMonth}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onGoToToday={goToToday}
        />
      </View>

      {/* Knapp för att lägga till ny händelse */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: COLORS[activeUserId] }]}
          onPress={() => {
            mediumTap(); // Medium feedback vid öppning av skapandemodal
            setEditingEvent(null);
            setShowAddModal(true);
          }}
        >
          <Text style={styles.addBtnText}>+ Lägg till händelse</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Dagmodal ─────────────────────────────────────────────────────────── */}
      <Modal visible={showDayModal} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.dayModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDayModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.dayModal}>

              {/* Rubrikrad med datum och stängknapp */}
              <View style={styles.dayModalHeader}>
                <Text style={styles.dayModalTitle}>
                  {selectedDate.toLocaleDateString('sv-SE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
                <TouchableOpacity onPress={() => setShowDayModal(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Väderrad */}
              <View style={styles.weatherRow}>
                {weather ? (
                  <>
                    <Text style={styles.weatherEmoji}>
                      {weatherEmoji(weather.weatherCode)}
                    </Text>
                    <Text style={styles.weatherTemp}>
                      {weather.temperature}°C
                    </Text>
                    <Text style={styles.weatherDesc}>
                      {weatherDescription(weather.weatherCode)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.weatherLoading}>Hämtar väder...</Text>
                )}
              </View>

              {/* Händelselista — tryck redigerar, långtryck raderar */}
              <ScrollView
                style={styles.eventScroll}
                showsVerticalScrollIndicator={false}
              >
                {eventsForSelectedDate.length === 0 ? (
                  <Text style={styles.empty}>Inga händelser denna dag</Text>
                ) : (
                  eventsForSelectedDate.map((item) => (
                    <EventCard
                      key={item.id}
                      event={item}
                      onPress={() => {
                        lightTap(); // Lätt feedback vid öppning av redigering
                        setEditingEvent(item);
                        setShowDayModal(false);
                        setShowAddModal(true);
                      }}
                      onLongPress={() => handleDelete(item.id)}
                    />
                  ))
                )}
              </ScrollView>

              {/* Knapp för att lägga till händelse på vald dag */}
              <TouchableOpacity
                style={[styles.addDayBtn, { backgroundColor: COLORS[activeUserId] }]}
                onPress={() => {
                  mediumTap(); // Medium feedback vid öppning av skapandemodal
                  setEditingEvent(null);
                  setShowDayModal(false);
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.addDayBtnText}>+ Lägg till händelse</Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {/* ─── Slut dagmodal ────────────────────────────────────────────────────── */}

      {/* Modal för att skapa eller redigera händelse */}
      <AddEventModal
        visible={showAddModal}
        onClose={() => {
          lightTap(); // Lätt feedback vid stängning
          setEditingEvent(null);
          setShowAddModal(false);
        }}
        onSave={handleSave}
        templates={templates}
        selectedDate={selectedDate}
        activeUserId={activeUserId}
        existingEvent={editingEvent}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  templatesBtn: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  templatesBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  userBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  userBtnText: {
    fontWeight: '600',
    color: '#333',
  },
  errorBanner: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  errorText: {
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
  },
  calendarContainer: {
    flex: 1,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  dayModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dayModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  dayModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
    color: '#1a1a1a',
  },
  closeBtn: {
    fontSize: 18,
    color: '#888',
    padding: 4,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  weatherEmoji: { fontSize: 24 },
  weatherTemp: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  weatherDesc: { fontSize: 14, color: '#666' },
  weatherLoading: { fontSize: 13, color: '#aaa' },
  eventScroll: {
    maxHeight: 300,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#aaa',
    marginBottom: 20,
  },
  addDayBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  addDayBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});