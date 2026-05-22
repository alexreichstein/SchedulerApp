import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from './navigation';
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet,
  ActivityIndicator, TouchableOpacity, Modal,
  TextInput, Alert, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, onSnapshot, orderBy, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

type Event = {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  userId: number;
  categoryId: number | null;
  reminderMinutes: number;
  templateColor: string | null;
};

type Template = {
  id: string;
  name: string;
  color: string;
  durationMinutes: number;
  createdBy: number;
};

const USERS: Record<number, string> = {
  1: 'Alex',
  2: 'Melinda',
  3: 'Ryan',
};

const COLORS: Record<number, string> = {
  1: '#6200ee',
  2: '#03dac6',
  3: '#ff6d00',
};

const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function CalendarView({ events, selectedDate, onSelectDate, currentMonth, onPrevMonth, onNextMonth }: {
  events: Event[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
  const monthName = currentMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });

  const hasEvent = (date: Date) => events.some(e => {
    const d = new Date(e.startTime);
    return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
  });

  const getEventUsers = (date: Date) => [...new Set(events
    .filter(e => { const d = new Date(e.startTime); return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate(); })
    .map(e => e.userId))];

  const isSelected = (date: Date) => date.getFullYear() === selectedDate.getFullYear() && date.getMonth() === selectedDate.getMonth() && date.getDate() === selectedDate.getDate();
  const isToday = (date: Date) => { const t = new Date(); return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate(); };

  return (
    <View style={styles.calendar}>
      <View style={styles.calNav}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn}><Text style={styles.navText}>‹</Text></TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn}><Text style={styles.navText}>›</Text></TouchableOpacity>
      </View>
      <View style={styles.weekRow}>
        {DAYS.map(d => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
      </View>
      <View style={styles.grid}>
        {days.map((date, i) => (
          <TouchableOpacity key={i} style={[styles.cell, date && isSelected(date) && styles.selectedCell, date && isToday(date) && !isSelected(date) && styles.todayCell]} onPress={() => date && onSelectDate(date)} disabled={!date}>
            {date && (<>
              <Text style={[styles.dayNum, isSelected(date) && styles.selectedDayNum, isToday(date) && !isSelected(date) && styles.todayNum]}>{date.getDate()}</Text>
              {hasEvent(date) && <View style={styles.dots}>{getEventUsers(date).slice(0, 3).map(uid => <View key={uid} style={[styles.dot, { backgroundColor: COLORS[uid] ?? '#ccc' }]} />)}</View>}
            </>)}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUserId, setActiveUserId] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'families', 'reichstein', 'events'), orderBy('startTime', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
      setEvents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'families', 'reichstein', 'templates'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Template[];
        setTemplates(data);
      }
    );
    return () => unsubscribe();
  }, []);

  const openModal = () => {
    const start = new Date(selectedDate);
    start.setHours(8, 0, 0, 0);
    setStartTime(start);
    setEndTime(new Date(start.getTime() + 3600000));
    setNewTitle('');
    setNewDescription('');
    setSelectedTemplate(null);
    setShowModal(true);
  };

  const applyTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setNewTitle(template.name);
    // Sluttid räknas ut från starttid + mallens längd
    setEndTime(new Date(startTime.getTime() + template.durationMinutes * 60 * 1000));
  };

  const onStartTimeChange = (_: any, date?: Date) => {
    setShowStartPicker(false);
    if (!date) return;
    // Kombinera vald dag med vald tid
    const combined = new Date(selectedDate);
    combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setStartTime(combined);
    // Om mall vald, räkna om sluttid automatiskt
    if (selectedTemplate) {
      setEndTime(new Date(combined.getTime() + selectedTemplate.durationMinutes * 60 * 1000));
    }
  };

  const onEndTimeChange = (_: any, date?: Date) => {
    setShowEndPicker(false);
    if (!date) return;
    const combined = new Date(selectedDate);
    combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setEndTime(combined);
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (millis: number) => new Date(millis).toLocaleDateString('sv-SE', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const addEvent = async () => {
    if (!newTitle.trim()) { Alert.alert('Titel krävs'); return; }
    if (endTime <= startTime) { Alert.alert('Sluttid måste vara efter starttid'); return; }
    await addDoc(collection(db, 'families', 'reichstein', 'events'), {
      title: newTitle.trim(),
      description: newDescription.trim(),
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
      userId: activeUserId,
      categoryId: null,
      reminderMinutes: 15,
      templateColor: selectedTemplate?.color ?? null,
    });
    setShowModal(false);
  };

  const deleteEvent = (id: string) => {
    Alert.alert('Ta bort?', 'Vill du ta bort denna händelse?', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Ta bort', style: 'destructive', onPress: () => deleteDoc(doc(db, 'families', 'reichstein', 'events', id)) },
    ]);
  };

  const eventsForSelectedDate = events.filter(e => {
    const d = new Date(e.startTime);
    return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate();
  });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6200ee" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Familjekalender</Text>
        <TouchableOpacity style={styles.templatesBtn} onPress={() => navigation.navigate('Templates')}>
          <Text style={styles.templatesBtnText}>Mallar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.userRow}>
        {Object.entries(USERS).map(([id, name]) => (
          <TouchableOpacity key={id} style={[styles.userBtn, activeUserId === Number(id) && { backgroundColor: COLORS[Number(id)] }]} onPress={() => setActiveUserId(Number(id))}>
            <Text style={[styles.userBtnText, activeUserId === Number(id) && { color: '#fff' }]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        <CalendarView events={events} selectedDate={selectedDate} onSelectDate={setSelectedDate} currentMonth={currentMonth} onPrevMonth={prevMonth} onNextMonth={nextMonth} />
        <Text style={styles.sectionTitle}>{selectedDate.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        {eventsForSelectedDate.length === 0 ? (
          <Text style={styles.empty}>Inga händelser denna dag</Text>
        ) : (
          eventsForSelectedDate.map(item => (
            <TouchableOpacity key={item.id} onLongPress={() => deleteEvent(item.id)}>
              <View style={[styles.card, { borderLeftColor: item.templateColor ?? COLORS[item.userId] ?? '#ccc' }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={[styles.user, { color: COLORS[item.userId] ?? '#ccc' }]}>{USERS[item.userId] ?? 'Okänd'}</Text>
                </View>
                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                <Text style={styles.time}>{formatDate(item.startTime)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS[activeUserId] }]} onPress={openModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Ny händelse som {USERS[activeUserId]}</Text>
              <Text style={styles.dateLabel}>{selectedDate.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

              {/* Mallar */}
              {templates.length > 0 && (
                <>
                  <Text style={styles.label}>Välj mall</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.templateRow}>
                      {templates.map(t => (
                        <TouchableOpacity
                          key={t.id}
                          style={[styles.templateChip, { borderColor: t.color }, selectedTemplate?.id === t.id && { backgroundColor: t.color }]}
                          onPress={() => applyTemplate(t)}
                        >
                          <Text style={[styles.templateChipText, selectedTemplate?.id === t.id && { color: '#fff' }]}>{t.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}

              <TextInput style={styles.input} placeholder="Titel" value={newTitle} onChangeText={setNewTitle} />
              <TextInput style={styles.input} placeholder="Beskrivning (valfritt)" value={newDescription} onChangeText={setNewDescription} />

              {/* Starttid — alltid klocka */}
              <Text style={styles.label}>Starttid</Text>
              <TouchableOpacity style={styles.timeBtn} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.timeBtnText}>{formatTime(startTime)}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onStartTimeChange}
                />
              )}

              {/* Sluttid — bara om ingen mall vald */}
              {!selectedTemplate && (
                <>
                  <Text style={styles.label}>Sluttid</Text>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => setShowEndPicker(true)}>
                    <Text style={styles.timeBtnText}>{formatTime(endTime)}</Text>
                  </TouchableOpacity>
                  {showEndPicker && (
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onEndTimeChange}
                    />
                  )}
                </>
              )}

              {/* Visa beräknad sluttid om mall vald */}
              {selectedTemplate && (
                <View style={styles.autoEndRow}>
                  <Text style={styles.autoEndLabel}>Sluttid (automatisk)</Text>
                  <Text style={[styles.autoEndTime, { color: selectedTemplate.color }]}>{formatTime(endTime)}</Text>
                </View>
              )}

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: selectedTemplate?.color ?? COLORS[activeUserId] }]} onPress={addEvent}>
                <Text style={styles.saveBtnText}>Spara</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Avbryt</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  templatesBtn: { backgroundColor: '#6200ee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  templatesBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  userRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginVertical: 12 },
  userBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0' },
  userBtnText: { fontWeight: '600', color: '#333' },
  calendar: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 12, marginBottom: 12, elevation: 2 },
  calNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
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
  sectionTitle: { fontSize: 15, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8, textTransform: 'capitalize', color: '#333' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, elevation: 2, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  user: { fontSize: 13, fontWeight: '500' },
  description: { fontSize: 14, color: '#555', marginBottom: 4 },
  time: { fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', marginTop: 20, color: '#aaa', paddingBottom: 20 },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  dateLabel: { fontSize: 14, color: '#888', textTransform: 'capitalize' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  templateRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  templateChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  templateChipText: { fontSize: 14, fontWeight: '600', color: '#333' },
  timeBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, alignItems: 'center' },
  timeBtnText: { fontSize: 20, fontWeight: '600', color: '#333' },
  autoEndRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 },
  autoEndLabel: { fontSize: 14, color: '#666' },
  autoEndTime: { fontSize: 18, fontWeight: '700' },
  saveBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelText: { textAlign: 'center', color: '#888', padding: 8 },
});