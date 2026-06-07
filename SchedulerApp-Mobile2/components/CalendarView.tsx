// CalendarView.tsx
// Kalenderkomponent som visar ett månadsrutnät
// Tar upp hela skärmen och visar händelser som färgade block med titel i dagrutan
// Vänster halva = användarens färg, höger halva = aktivitetens färg
// Swipe vänster = nästa månad, swipe höger = föregående månad
// Fas 4: röda dagar (lördag/söndag + svenska helgdagar), idag-knapp i headern

import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder, ScrollView } from 'react-native';
import { Event } from '../types';
import { COLORS, DAYS } from '../constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_WIDTH = SCREEN_WIDTH / 7;

const DAY_NUM_HEIGHT = 18;
const EVENT_HEIGHT = 14;
const EVENT_GAP = 1;
const CELL_PADDING = 4;
const MIN_CELL_HEIGHT = CELL_WIDTH * 1.2;

type Props = {
  events: Event[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void; // Ny prop — anropas när användaren trycker på idag-knappen
};

// Beräknar påskdagen för ett givet år med den anonyma gregoriska algoritmen
// Returnerar ett Date-objekt för påskdagen
const getEaster = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

// Returnerar en Set med datumsträngar (YYYY-MM-DD) för svenska helgdagar ett givet år
// Inkluderar fasta helgdagar och rörliga helgdagar baserade på påsk
const getSwedishHolidays = (year: number): Set<string> => {
  const easter = getEaster(year);

  // Hjälpfunktion för att lägga till dagar till ett datum
  const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  // Hjälpfunktion för att formatera datum till YYYY-MM-DD
  const fmt = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  // Midsommarafton — fredagen mellan 19-25 juni
  const midsummerEve = (() => {
    const d = new Date(year, 5, 19); // 19 juni
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1); // Hitta nästa fredag
    return d;
  })();

  // Alla helgons dag — lördagen mellan 31 okt och 6 nov
  const allSaints = (() => {
    const d = new Date(year, 9, 31); // 31 oktober
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1); // Hitta nästa lördag
    return d;
  })();

  return new Set([
    // Fasta helgdagar
    fmt(new Date(year, 0, 1)),   // Nyårsdagen
    fmt(new Date(year, 0, 6)),   // Trettondedag jul
    fmt(new Date(year, 4, 1)),   // Första maj
    fmt(new Date(year, 5, 6)),   // Sveriges nationaldag
    fmt(new Date(year, 11, 24)), // Julafton
    fmt(new Date(year, 11, 25)), // Juldagen
    fmt(new Date(year, 11, 26)), // Annandag jul
    fmt(new Date(year, 11, 31)), // Nyårsafton

    // Rörliga helgdagar baserade på påsk
    fmt(addDays(easter, -2)),    // Långfredag
    fmt(addDays(easter, -1)),    // Påskafton
    fmt(easter),                  // Påskdagen
    fmt(addDays(easter, 1)),     // Annandag påsk
    fmt(addDays(easter, 39)),    // Kristi himmelsfärdsdag
    fmt(addDays(easter, 49)),    // Pingstdagen

    // Rörliga helgdagar baserade på datum
    fmt(midsummerEve),           // Midsommarafton
    fmt(addDays(midsummerEve, 1)), // Midsommardagen
    fmt(allSaints),              // Alla helgons dag
  ]);
};

export default function CalendarView({
  events,
  selectedDate,
  onSelectDate,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
}: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  const monthName = currentMonth.toLocaleDateString('sv-SE', {
    month: 'long',
    year: 'numeric',
  });

  // Svenska helgdagar för aktuellt år — beräknas en gång per månad
  const holidays = getSwedishHolidays(year);

  // Kontrollerar om ett datum är en röd dag
  // Röda dagar = lördag, söndag eller svensk helgdag
  const isRedDay = (date: Date): boolean => {
    const dow = date.getDay(); // 0 = söndag, 6 = lördag
    if (dow === 0 || dow === 6) return true;
    const fmt = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.has(fmt);
  };

  // Kontrollerar om kalendern visar den aktuella månaden
  // Används för att avgöra om idag-knappen ska visas
  const isCurrentMonth = (): boolean => {
    const today = new Date();
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth()
    );
  };

  // Hanterar swipe-gester för att byta månad
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 20
      );
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) onNextMonth();
      else if (gestureState.dx > 50) onPrevMonth();
    },
  });

  const getEventsForDate = (date: Date) =>
    events.filter((e) => {
      const d = new Date(e.startTime);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });

  // Räknar max antal händelser för någon dag i månaden → bestämmer cellhöjden
  const maxEventsInMonth = Math.max(
    1,
    ...days.map((date) => (date ? getEventsForDate(date).length : 0))
  );

  const cellHeight = Math.max(
    MIN_CELL_HEIGHT,
    CELL_PADDING + DAY_NUM_HEIGHT + maxEventsInMonth * (EVENT_HEIGHT + EVENT_GAP) + CELL_PADDING
  );

  const isSelected = (date: Date) =>
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate();

  const isToday = (date: Date) => {
    const t = new Date();
    return (
      date.getFullYear() === t.getFullYear() &&
      date.getMonth() === t.getMonth() &&
      date.getDate() === t.getDate()
    );
  };

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

  const weeks: number[] = [];
  days.forEach((date, index) => {
    if (index % 7 === 0 && date) weeks.push(getWeekNumber(date));
    else if (index % 7 === 0) weeks.push(0);
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>

      {/* Header med navigeringsknappar, månadsnamn och idag-knapp */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthTitle}>{monthName}</Text>

        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>

        {/* Idag-knapp — visas bara när man tittar på en annan månad än aktuell */}
        {!isCurrentMonth() && (
          <TouchableOpacity onPress={onGoToToday} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>Idag</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Veckodagsrad — lör och sön visas i rött */}
      <View style={styles.weekDayRow}>
        <View style={styles.weekNumHeader} />
        {DAYS.map((d, index) => (
          <Text
            key={d}
            style={[
              styles.dayLabel,
              // Lördag (index 5) och söndag (index 6) får röd text
              (index === 5 || index === 6) && styles.redDayLabel,
            ]}
          >
            {d}
          </Text>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {Array.from({ length: Math.ceil(days.length / 7) }).map((_, rowIndex) => (
            <View key={rowIndex} style={[styles.row, { height: cellHeight }]}>
              <View style={styles.weekNumCell}>
                <Text style={styles.weekNum}>
                  {weeks[rowIndex] > 0 ? weeks[rowIndex] : ''}
                </Text>
              </View>

              {days.slice(rowIndex * 7, rowIndex * 7 + 7).map((date, colIndex) => {
                const dayEvents = date ? getEventsForDate(date) : [];
                const selected = date ? isSelected(date) : false;
                const today = date ? isToday(date) : false;
                const redDay = date ? isRedDay(date) : false; // Röd dag check

                return (
                  <TouchableOpacity
                    key={colIndex}
                    style={[
                      styles.cell,
                      { height: cellHeight },
                      selected && styles.selectedCell,
                      today && !selected && styles.todayCell,
                    ]}
                    onPress={() => date && onSelectDate(date)}
                    disabled={!date}
                  >
                    {date && (
                      <>
                        <Text style={[
                          styles.dayNum,
                          // Röd dag — röd text (lördag, söndag, helgdag)
                          redDay && styles.redDayNum,
                          // Idag — lila text (överskriver röd om idag är helgdag)
                          today && !selected && styles.todayNum,
                          // Vald dag — lila fet text
                          selected && styles.selectedDayNum,
                        ]}>
                          {date.getDate()}
                        </Text>

                        <View style={styles.eventBlocks}>
                          {dayEvents.map((event) => {
                            const userColor = COLORS[event.userId] ?? '#ccc';
                            const activityColor = event.templateColor ?? userColor;

                            return (
                              <View key={event.id} style={styles.eventBlock}>
                                {/* Vänster halva — användarens färg */}
                                <View style={[styles.eventBlockLeft, { backgroundColor: userColor }]} />
                                {/* Höger halva — aktivitetens färg */}
                                <View style={[styles.eventBlockRight, { backgroundColor: activityColor }]} />
                                {/* Titel centrerad över blocket */}
                                <Text style={styles.eventBlockText} numberOfLines={1}>
                                  {event.title}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Huvudbehållare — flex: 1 fyller tillgängligt utrymme
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Headerrad med navigeringsknappar och månadsnamn
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Navigeringsknappar (‹ och ›)
  navBtn: {
    padding: 8,
  },
  navText: {
    fontSize: 28,
    color: '#6200ee',
  },

  // Månadsnamn i mitten av headern
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
    flex: 1,            // Tar upp utrymmet mellan navigeringsknapparna
    textAlign: 'center',
  },

  // Idag-knapp — visas till höger om nästa-knappen när man är på annan månad
  todayBtn: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 4,
  },
  todayBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Veckodagsrad (Mån, Tis, ... Sön)
  weekDayRow: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weekNumHeader: {
    width: 28,
  },

  // Veckodagsetikett — grå som standard
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },

  // Röd veckodagsetikett för lördag och söndag
  redDayLabel: {
    color: '#e53935',
  },

  // ScrollView för rutnätet
  scrollView: {
    flex: 1,
  },
  grid: {},

  // Rad i rutnätet — höjd sätts dynamiskt baserat på max händelser
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  // Veckonummercell till vänster om varje rad
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

  // Dagcell — höjd sätts dynamiskt
  cell: {
    flex: 1,
    padding: 2,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },

  // Vald dag — lila bakgrund
  selectedCell: {
    backgroundColor: '#ede7f6',
  },

  // Dagens datum — lila kant
  todayCell: {
    borderWidth: 1,
    borderColor: '#6200ee',
  },

  // Dagsiffra — mörk som standard
  dayNum: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 2,
  },

  // Röd dagsiffra för helgdagar och helger
  redDayNum: {
    color: '#e53935',
  },

  // Vald dag — lila fet text
  selectedDayNum: {
    color: '#6200ee',
    fontWeight: '700',
  },

  // Dagens datum — lila fet text
  todayNum: {
    color: '#6200ee',
    fontWeight: '700',
  },

  // Behållare för händelseblock
  eventBlocks: {
    gap: 1,
  },

  // Enskilt händelseblock med delad färg
  eventBlock: {
    height: 14,
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    marginHorizontal: 1,
    position: 'relative',
  },

  // Vänster halva av händelseblocket — användarens färg
  eventBlockLeft: {
    flex: 1,
  },

  // Höger halva av händelseblocket — aktivitetens färg
  eventBlockRight: {
    flex: 1,
  },

  // Titel på händelseblocket — centrerad och vit
  eventBlockText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});