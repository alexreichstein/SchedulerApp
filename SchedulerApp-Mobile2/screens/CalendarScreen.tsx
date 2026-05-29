// CalendarScreen.tsx
// Huvudskärmen för familjekalendern
// Visar månadskalender, användarknappar och knapp för att lägga till händelser
// Tryck på en dag öppnar en modal med väder och händelser för den dagen
// Inkluderar: felhantering vid Firebase-problem, offline-cache via AsyncStorage
// Fas 2: redigering av befintliga händelser via tryck på EventCard

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
import { SafeAreaView } from 'react-native-safe-area-context'; // Hanterar safe area (notch, statusbar)
import { useNavigation } from '@react-navigation/native';      // Hook för navigering mellan skärmar
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation';
import { useEvents } from '../hooks/useEvents';                          // CRUD för händelser mot Firebase
import { useTemplates } from '../hooks/useTemplates';                    // Hämtar mallar från Firebase
import { useWeather, weatherEmoji, weatherDescription } from '../hooks/useWeather'; // Väderdata från Open-Meteo
import { useNotifications } from '../hooks/useNotifications';            // Lokala push-notiser via Expo
import CalendarView from '../components/CalendarView';                   // Månadsrutnät med händelseblock
import EventCard from '../components/EventCard';                         // Kort som visar en enskild händelse
import AddEventModal from '../components/AddEventModal';                 // Modal för att skapa/redigera händelse
import { USERS, COLORS } from '../constants';                            // Användarnamn och färger per användare
import { Event } from '../types';                                        // Event-typen för editingEvent-state

export default function CalendarScreen() {
  // Navigation — används för att gå till Mallar-skärmen
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Vilken månad som visas i kalendern just nu
  // Definieras innan useEvents så att den kan skickas med som argument
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Händelser från Firebase för aktuell månad
  // error är null om allt fungerar, annars ett felmeddelande
  // updateEvent används vid redigering av befintlig händelse
  const { events, loading, error, addEvent, updateEvent, deleteEvent } = useEvents(currentMonth);

  // Mallar från Firebase — skickas till AddEventModal för att välja förifylld mall
  const { templates } = useTemplates();

  // Väder — fetchWeather tar ett Date-objekt och returnerar temperatur + väderkod
  const { fetchWeather } = useWeather();

  // Notiser — scheduleReminder skapar en lokal notis, cancelReminder tar bort den
  const { scheduleReminder, cancelReminder } = useNotifications();

  // Vilken dag användaren har tryckt på — markeras i kalendern och visas i dagmodalen
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Vilken användare som är aktiv — styr färg på knappar och nya händelser
  const [activeUserId, setActiveUserId] = useState(1);

  // Styr om AddEventModal (skapa/redigera händelse) är synlig
  const [showAddModal, setShowAddModal] = useState(false);

  // Styr om dagmodalen (händelser + väder för vald dag) är synlig
  const [showDayModal, setShowDayModal] = useState(false);

  // Håller den händelse som ska redigeras — null betyder att vi skapar en ny händelse
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Väderdata för vald dag — null medan den laddas eller om den inte hämtats än
  const [weather, setWeather] = useState<{ temperature: number; weatherCode: number } | null>(null);

  // Går till föregående månad genom att skapa ett nytt Date med månaden -1
  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );

  // Går till nästa månad genom att skapa ett nytt Date med månaden +1
  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  // Hämtar väder när dagmodalen öppnas eller när vald dag ändras
  // Återställer weather till null först så att "Hämtar väder..." visas under laddning
  useEffect(() => {
    if (showDayModal) {
      setWeather(null);
      fetchWeather(selectedDate).then(setWeather);
    }
  }, [selectedDate, showDayModal]);

  // Anropas när användaren trycker på en dag i kalendern
  // Sätter vald dag och öppnar dagmodalen
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  // Filtrerar fram händelser som tillhör den valda dagen
  // Jämför år, månad och dag separat för att undvika tidzonsproblem
  const eventsForSelectedDate = events.filter((e) => {
    const d = new Date(e.startTime);
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    );
  });

  // Sparar händelse — hanterar både skapa ny och uppdatera befintlig
  // Om editingEvent finns körs updateEvent, annars addEvent
  const handleSave = async (data: {
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    userId: number;
    templateColor: string | null;
  }) => {
    try {
      if (editingEvent) {
        // Redigeringsläge — uppdatera befintlig händelse i Firebase
        await updateEvent(editingEvent.id, {
          ...data,
          categoryId: null,
          reminderMinutes: 15,
        });

        // Avbryt gammal notis och schemalägg ny med uppdaterad tid och titel
        await cancelReminder(editingEvent.id);
        await scheduleReminder(editingEvent.id, data.title, data.startTime, 15);
      } else {
        // Skapandeläge — skapa ny händelse i Firebase
        const id = await addEvent({
          ...data,
          categoryId: null,
          reminderMinutes: 15,
        });

        // Schemalägg påminnelse 15 min innan den nya händelsen
        if (id) {
          await scheduleReminder(id, data.title, data.startTime, 15);
        }
      }

      // Återställ redigeringsläge och stäng modalen
      setEditingEvent(null);
      setShowAddModal(false);
    } catch (e) {
      // Visar felmeddelande om Firebase inte svarar
      Alert.alert('Fel', 'Kunde inte spara händelsen. Kontrollera din anslutning.');
    }
  };

  // Visar en bekräftelsedialog innan händelsen raderas
  // Vid bekräftelse: avbryt notisen och radera händelsen från Firebase
  const handleDelete = (id: string) => {
    Alert.alert('Ta bort?', 'Vill du ta bort denna händelse?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelReminder(id); // Avbryt den schemalagda notisen
            await deleteEvent(id);    // Radera från Firebase
          } catch (e) {
            Alert.alert('Fel', 'Kunde inte radera händelsen. Kontrollera din anslutning.');
          }
        },
      },
    ]);
  };

  // Visas medan händelser laddas från Firebase vid första uppstart
  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Laddar...</Text>
      </View>
    );
  }

  return (
    // SafeAreaView säkerställer att innehållet inte döljs av notch eller statusbar
    <SafeAreaView style={styles.container}>

      {/* Översta raden med titel och knapp till Mallar-skärmen */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Familjekalender</Text>
        <TouchableOpacity
          style={styles.templatesBtn}
          onPress={() => navigation.navigate('Templates')}
        >
          <Text style={styles.templatesBtnText}>Mallar</Text>
        </TouchableOpacity>
      </View>

      {/* Användarrad — tryck på en användare för att sätta aktiv användare */}
      {/* Aktiv användare får sin färg som bakgrund och vit text */}
      <View style={styles.userRow}>
        {Object.entries(USERS).map(([id, name]) => (
          <TouchableOpacity
            key={id}
            style={[
              styles.userBtn,
              // Aktiv användare får sin personliga färg som bakgrund
              activeUserId === Number(id) && {
                backgroundColor: COLORS[Number(id)],
              },
            ]}
            onPress={() => setActiveUserId(Number(id))}
          >
            <Text
              style={[
                styles.userBtnText,
                // Vit text när knappen har färgad bakgrund
                activeUserId === Number(id) && { color: '#fff' },
              ]}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Felmeddelande — visas som en gul banner om Firebase är nere */}
      {/* error är null när allt fungerar normalt */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Kalenderbehållare — flex: 1 tar upp allt tillgängligt utrymme */}
      {/* Detta eliminerar den döda ytan mellan kalendern och lägg-till-knappen */}
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

      {/* Knapp för att lägga till ny händelse — i flödet under kalendern, inte absolut */}
      {/* Färgen följer aktiv användares färg */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: COLORS[activeUserId] }]}
          onPress={() => {
            // Säkerställ att vi inte är i redigeringsläge när vi skapar ny händelse
            setEditingEvent(null);
            setShowAddModal(true);
          }}
        >
          <Text style={styles.addBtnText}>+ Lägg till händelse</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Dagmodal ─────────────────────────────────────────────────────────── */}
      {/* Visas som ett bottom sheet när användaren trycker på en dag i kalendern */}
      {/* Tryck på overlay utanför modalen stänger den */}
      <Modal visible={showDayModal} animationType="slide" transparent>

        {/* Mörk halvtransparent overlay — täcker hela skärmen bakom modalen */}
        <TouchableOpacity
          style={styles.dayModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDayModal(false)}
        >
          {/* Inre TouchableOpacity förhindrar att tryck inne i modalen stänger den */}
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

              {/* Väderrad — visar emoji, temperatur och textbeskrivning */}
              {/* Visar "Hämtar väder..." medan API-anropet pågår */}
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

              {/* Händelselista — maxHeight begränsar höjden och ScrollView hanterar overflow */}
              {/* Tryck på ett kort öppnar redigeringsmodalen */}
              {/* Långtryck på ett kort öppnar bekräftelsedialog för radering */}
              <ScrollView
                style={styles.eventScroll}
                showsVerticalScrollIndicator={false}
              >
                {eventsForSelectedDate.length === 0 ? (
                  // Visas om inga händelser finns för dagen
                  <Text style={styles.empty}>Inga händelser denna dag</Text>
                ) : (
                  eventsForSelectedDate.map((item) => (
                    <EventCard
                      key={item.id}
                      event={item}
                      // Tryck öppnar redigeringsmodalen med händelsens befintliga data
                      onPress={() => {
                        setEditingEvent(item);
                        setShowDayModal(false);
                        setShowAddModal(true);
                      }}
                      // Långtryck öppnar bekräftelsedialog för radering
                      onLongPress={() => handleDelete(item.id)}
                    />
                  ))
                )}
              </ScrollView>

              {/* Knapp längst ner — stänger dagmodalen och öppnar AddEventModal i skapandeläge */}
              <TouchableOpacity
                style={[styles.addDayBtn, { backgroundColor: COLORS[activeUserId] }]}
                onPress={() => {
                  setEditingEvent(null); // Säkerställ skapandeläge
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
      {/* existingEvent är null vid skapande, annars den händelse som redigeras */}
      {/* selectedDate skickas med så att datumet är förifyllt */}
      {/* activeUserId skickas med så att rätt användare är förvald */}
      <AddEventModal
        visible={showAddModal}
        onClose={() => {
          // Återställ redigeringsläge när modalen stängs utan att spara
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
  // Huvudbehållare — flex: 1 fyller hela skärmen
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Centrerad vy för laddningsskärmen
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Rad med titel och Mallar-knapp
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },

  // Rubriktexten "Familjekalender"
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },

  // Knappen som navigerar till Mallar-skärmen
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

  // Rad med användarknappar (Alex, Melinda, Ryan)
  userRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },

  // Enskild användarknapp — bakgrundsfärg sätts dynamiskt vid aktiv användare
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

  // Gul varningsbanner som visas när Firebase är nere
  // Visas bara när error-statet i useEvents inte är null
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

  // Behållare för CalendarView — flex: 1 tar upp allt ledigt utrymme
  calendarContainer: {
    flex: 1,
  },

  // Behållare för lägg-till-knappen — i flödet under kalendern
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  // Knappen "Lägg till händelse" under kalendern
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

  // Mörk halvtransparent overlay bakom dagmodalen
  dayModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end', // Placerar modalen längst ner (bottom sheet-stil)
  },

  // Själva modalboxen — rundade övre hörn, vit bakgrund
  dayModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%', // Begränsar höjden till 85% av skärmen
  },

  // Rubrikrad i dagmodalen med datum och stängknapp
  dayModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize', // Stor bokstav på veckodagen
    color: '#1a1a1a',
  },
  closeBtn: {
    fontSize: 18,
    color: '#888',
    padding: 4,
  },

  // Väderrad med grå bakgrund
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

  // ScrollView för händelselistan — maxHeight ger utrymme för ~3-4 kort
  // Scrollar automatiskt om det finns fler händelser än vad som ryms
  eventScroll: {
    maxHeight: 300,
  },

  // Text som visas när inga händelser finns för dagen
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#aaa',
    marginBottom: 20,
  },

  // Knappen "Lägg till händelse" inne i dagmodalen
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