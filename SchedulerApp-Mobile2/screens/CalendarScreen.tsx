// Huvudskärmen för kalenderappen
// Kalendern tar upp hela skärmen
// Händelser för vald dag visas i en modal när man trycker på dagen
// Väder för vald dag hämtas från Open-Meteo
// Notiser schemaläggs när en händelse sparas

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
import CalendarView from '../components/CalendarView';
import EventCard from '../components/EventCard';
import AddEventModal from '../components/AddEventModal';
import { USERS, COLORS } from '../constants';

export default function CalendarScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { events, loading, addEvent, deleteEvent } = useEvents();
  const { templates } = useTemplates();
  const { fetchWeather } = useWeather();
  const { scheduleReminder, cancelReminder } = useNotifications();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeUserId, setActiveUserId] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);

  // Väderdata för vald dag
  const [weather, setWeather] = useState<{ temperature: number; weatherCode: number } | null>(null);

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );

  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  // Hämtar väder när vald dag ändras och modalen är öppen
  useEffect(() => {
    if (showDayModal) {
      setWeather(null);
      fetchWeather(selectedDate).then(setWeather);
    }
  }, [selectedDate, showDayModal]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  const eventsForSelectedDate = events.filter((e) => {
    const d = new Date(e.startTime);
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    );
  });

  // Sparar händelse och schemalägger notis
  const handleSave = async (data: {
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    userId: number;
    templateColor: string | null;
  }) => {
    const id = await addEvent({
      ...data,
      categoryId: null,
      reminderMinutes: 15,
    });
    // Schemalägger påminnelse 15 minuter innan händelsen
    if (id) {
      await scheduleReminder(id, data.title, data.startTime, 15);
    }
    setShowAddModal(false);
  };

  // Raderar händelse och avbryter notis
  const handleDelete = (id: string) => {
    Alert.alert('Ta bort?', 'Vill du ta bort denna händelse?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: async () => {
          await cancelReminder(id);
          deleteEvent(id);
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
      <View style={styles.headerRow}>
        <Text style={styles.header}>Familjekalender</Text>
        <TouchableOpacity
          style={styles.templatesBtn}
          onPress={() => navigation.navigate('Templates')}
        >
          <Text style={styles.templatesBtnText}>Mallar</Text>
        </TouchableOpacity>
      </View>

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
            onPress={() => setActiveUserId(Number(id))}
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

      <View style={styles.calendarContainer}>
        <CalendarView
          events={events}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          currentMonth={currentMonth}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />
      </View>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: COLORS[activeUserId] }]}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal för dagens händelser */}
      <Modal visible={showDayModal} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.dayModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDayModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.dayModal}>
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

              {/* Väderinfo */}
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

              <ScrollView>
                {eventsForSelectedDate.length === 0 ? (
                  <Text style={styles.empty}>Inga händelser denna dag</Text>
                ) : (
                  eventsForSelectedDate.map((item) => (
                    <EventCard
                      key={item.id}
                      event={item}
                      onLongPress={() => handleDelete(item.id)}
                    />
                  ))
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.addDayBtn, { backgroundColor: COLORS[activeUserId] }]}
                onPress={() => {
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

      <AddEventModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSave}
        templates={templates}
        selectedDate={selectedDate}
        activeUserId={activeUserId}
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
  calendarContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
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
    maxHeight: '80%',
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