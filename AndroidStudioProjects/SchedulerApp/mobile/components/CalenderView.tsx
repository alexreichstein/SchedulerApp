import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Event = {
  id: string;
  title: string;
  startTime: number;
  userId: number;
};

type Props = {
  events: Event[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  userColors: Record<number, string>;
};

const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export default function CalendarView({
  events, selectedDate, onSelectDate, currentMonth, onPrevMonth, onNextMonth, userColors
}: Props) {

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Måndag = 0, justera från Sunday=0
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));

  const monthName = currentMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });

  const hasEvent = (date: Date) => {
    return events.some(e => {
      const d = new Date(e.startTime);
      return d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate();
    });
  };

  const getEventUsers = (date: Date) => {
    return events
      .filter(e => {
        const d = new Date(e.startTime);
        return d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate();
      })
      .map(e => e.userId)
      .filter((v, i, a) => a.indexOf(v) === i);
  };

  const isSelected = (date: Date) =>
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  };

  return (
    <View style={styles.container}>
      {/* Månadsnavigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Veckodagar */}
      <View style={styles.weekRow}>
        {DAYS.map(d => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
      </View>

      {/* Dagar */}
      <View style={styles.grid}>
        {days.map((date, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.cell,
              date && isSelected(date) && styles.selectedCell,
              date && isToday(date) && !isSelected(date) && styles.todayCell,
            ]}
            onPress={() => date && onSelectDate(date)}
            disabled={!date}
          >
            {date && (
              <>
                <Text style={[
                  styles.dayNum,
                  isSelected(date) && styles.selectedDayNum,
                  isToday(date) && !isSelected(date) && styles.todayNum,
                ]}>
                  {date.getDate()}
                </Text>
                {hasEvent(date) && (
                  <View style={styles.dots}>
                    {getEventUsers(date).slice(0, 3).map(userId => (
                      <View key={userId} style={[styles.dot, { backgroundColor: userColors[userId] ?? '#ccc' }]} />
                    ))}
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 12, marginBottom: 12, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  navBtn: { padding: 8 },
  navText: { fontSize: 24, color: '#6200ee' },
  monthTitle: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: '#999', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  selectedCell: { backgroundColor: '#6200ee' },
  todayCell: { borderWidth: 1, borderColor: '#6200ee' },
  dayNum: { fontSize: 14, color: '#1a1a1a' },
  selectedDayNum: { color: '#fff', fontWeight: '700' },
  todayNum: { color: '#6200ee', fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});