// Kalenderkomponent som visar ett månadsrutnät
// Tar upp hela skärmen och visar händelser som färgade streck i dagrutan
// Användaren trycker på en dag för att se händelserna för den dagen

import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Event } from '../types';
import { COLORS, DAYS } from '../constants';

// Skärmens bredd används för att beräkna cellstorlek
const SCREEN_WIDTH = Dimensions.get('window').width;

// Varje dag tar upp 1/7 av skärmbredden
const CELL_WIDTH = SCREEN_WIDTH / 7;

// Cellhöjd — tillräckligt hög för att visa 2-3 streck per dag
const CELL_HEIGHT = CELL_WIDTH * 1.4;

// Props som komponenten tar emot från föräldrakomponenten
type Props = {
  events: Event[];                        // Alla händelser
  selectedDate: Date;                     // Vald dag
  onSelectDate: (date: Date) => void;     // Callback när användaren trycker på en dag
  currentMonth: Date;                     // Vilken månad som visas
  onPrevMonth: () => void;               // Callback för föregående månad
  onNextMonth: () => void;               // Callback för nästa månad
};

export default function CalendarView({
  events,
  selectedDate,
  onSelectDate,
  currentMonth,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Första dagen i månaden
  const firstDay = new Date(year, month, 1);

  // Sista dagen i månaden
  const lastDay = new Date(year, month + 1, 0);

  // Beräknar var första dagen ska placeras i rutnätet
  // Justerar från Sunday=0 till Monday=0 enligt svensk standard
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  // Bygger en array med null för tomma celler och Date för varje dag
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Formaterar månadsnamnet med stor bokstav, t.ex. "Maj 2026"
  const monthName = currentMonth.toLocaleDateString('sv-SE', {
    month: 'long',
    year: 'numeric',
  });

  // Hämtar alla händelser för en specifik dag
  const getEventsForDate = (date: Date) =>
    events.filter((e) => {
      const d = new Date(e.startTime);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });

  // Kontrollerar om en dag är den valda dagen
  const isSelected = (date: Date) =>
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate();

  // Kontrollerar om en dag är dagens datum
  const isToday = (date: Date) => {
    const t = new Date();
    return (
      date.getFullYear() === t.getFullYear() &&
      date.getMonth() === t.getMonth() &&
      date.getDate() === t.getDate()
    );
  };

  // Beräknar veckonummer enligt ISO 8601 (svensk standard)
  const getWeekNumber = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      )
    );
  };

  // Bygger en array med veckonummer för varje rad i kalendern
  const weeks: number[] = [];
  days.forEach((date, index) => {
    if (index % 7 === 0 && date) {
      weeks.push(getWeekNumber(date));
    } else if (index % 7 === 0) {
      weeks.push(0);
    }
  });

  return (
    <View style={styles.container}>
      {/* Månadsnavigation med pilar och månadsnamn */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Rad med veckodagsnamn och en tom cell för veckonummer */}
      <View style={styles.weekDayRow}>
        {/* Tom cell för veckonummerkolumnen */}
        <View style={styles.weekNumHeader} />
        {DAYS.map((d) => (
          <Text key={d} style={styles.dayLabel}>
            {d}
          </Text>
        ))}
      </View>

      {/* Kalenderrutnät med veckonummer och dagar */}
      <View style={styles.grid}>
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {/* Veckonummer till vänster om varje rad */}
            <View style={styles.weekNumCell}>
              <Text style={styles.weekNum}>
                {weeks[rowIndex] > 0 ? weeks[rowIndex] : ''}
              </Text>
            </View>

            {/* Sju dagceller per rad */}
            {days.slice(rowIndex * 7, rowIndex * 7 + 7).map((date, colIndex) => {
              const dayEvents = date ? getEventsForDate(date) : [];
              const selected = date ? isSelected(date) : false;
              const today = date ? isToday(date) : false;

              return (
                <TouchableOpacity
                  key={colIndex}
                  style={[
                    styles.cell,
                    selected && styles.selectedCell,
                    today && !selected && styles.todayCell,
                  ]}
                  onPress={() => date && onSelectDate(date)}
                  disabled={!date}
                >
                  {date && (
                    <>
                      {/* Datumnummer */}
                      <Text
                        style={[
                          styles.dayNum,
                          selected && styles.selectedDayNum,
                          today && !selected && styles.todayNum,
                        ]}
                      >
                        {date.getDate()}
                      </Text>

                      {/* Färgade streck för händelser — max 3 visas */}
                      <View style={styles.eventStripes}>
                        {dayEvents.slice(0, 3).map((event) => (
                          <View
                            key={event.id}
                            style={[
                              styles.stripe,
                              {
                                backgroundColor:
                                  event.templateColor ??
                                  COLORS[event.userId] ??
                                  '#ccc',
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Hela kalendern fyller tillgängligt utrymme
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Header med månadsnavigation
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: {
    padding: 8,
  },
  navText: {
    fontSize: 28,
    color: '#6200ee',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  // Rad med veckodagsnamn
  weekDayRow: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  // Tom cell för veckonummerkolumnen i header
  weekNumHeader: {
    width: 28,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  // Rutnätet med alla rader
  grid: {
    flex: 1,
  },
  // En rad med 7 dagar
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  // Cell för veckonummer
  weekNumCell: {
    width: 28,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  weekNum: {
    fontSize: 9,
    color: '#bbb',
    fontWeight: '600',
  },
  // Dagcell
  cell: {
    flex: 1,
    minHeight: CELL_HEIGHT,
    padding: 2,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  // Vald dag — lila bakgrund
  selectedCell: {
    backgroundColor: '#ede7f6',
  },
  // Dagens datum — lila kantlinje
  todayCell: {
    borderWidth: 1,
    borderColor: '#6200ee',
  },
  // Datumnummer
  dayNum: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 2,
  },
  selectedDayNum: {
    color: '#6200ee',
    fontWeight: '700',
  },
  todayNum: {
    color: '#6200ee',
    fontWeight: '700',
  },
  // Container för händelsestreck
  eventStripes: {
    gap: 1,
  },
  // Färgat streck för en händelse
  stripe: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});