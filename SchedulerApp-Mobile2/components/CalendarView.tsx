// Kalenderkomponent som visar ett månadsrutnät
// Tar upp hela skärmen och visar händelser som färgade block med titel i dagrutan
// Vänster halva = användarens färg, höger halva = aktivitetens färg
// Swipe vänster = nästa månad, swipe höger = föregående månad

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

  // Räkna max antal händelser för någon dag i månaden → bestämmer cellhöjden
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
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekDayRow}>
        <View style={styles.weekNumHeader} />
        {DAYS.map((d) => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
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
                          selected && styles.selectedDayNum,
                          today && !selected && styles.todayNum,
                        ]}>
                          {date.getDate()}
                        </Text>

                        <View style={styles.eventBlocks}>
                          {dayEvents.map((event) => {
                            const userColor = COLORS[event.userId] ?? '#ccc';
                            const activityColor = event.templateColor ?? userColor;

                            return (
                              <View key={event.id} style={styles.eventBlock}>
                                <View style={[styles.eventBlockLeft, { backgroundColor: userColor }]} />
                                <View style={[styles.eventBlockRight, { backgroundColor: activityColor }]} />
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  weekDayRow: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
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
  scrollView: {
    flex: 1,
  },
  grid: {},
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
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
  cell: {
    flex: 1,
    padding: 2,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  selectedCell: {
    backgroundColor: '#ede7f6',
  },
  todayCell: {
    borderWidth: 1,
    borderColor: '#6200ee',
  },
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
  eventBlocks: {
    gap: 1,
  },
  eventBlock: {
    height: 14,
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    marginHorizontal: 1,
    position: 'relative',
  },
  eventBlockLeft: {
    flex: 1,
  },
  eventBlockRight: {
    flex: 1,
  },
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