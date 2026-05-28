// Skärm för att hantera aktivitetsmallar
// Mallar kan ha antingen fast tid (07:20-15:40) eller fast längd (90 min)
// Alla mallar delas mellan alla användare

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Template, TemplateType } from '../types';
import { USERS } from '../constants';

const COLORS_OPTIONS = [
  '#6200ee', '#03dac6', '#ff6d00', '#1565c0',
  '#2e7d32', '#f9a825', '#6d4c41', '#00838f',
  '#558b2f', '#c62828', '#ad1457', '#4527a0',
];

// Formaterar timme och minut till HH:MM
const formatTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

// Formaterar minuter till läsbar text, t.ex. 90 -> "1 tim 30 min"
const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60} tim`;
  return `${Math.floor(minutes / 60)} tim ${minutes % 60} min`;
};

export default function TemplatesScreen() {
  const navigation = useNavigation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS_OPTIONS[0]);
  const [createdBy, setCreatedBy] = useState(1);

  // Malltyp — fast tid eller fast längd
  const [templateType, setTemplateType] = useState<TemplateType>('fixed_time');

  // Fast tid
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('09');
  const [endMinute, setEndMinute] = useState('00');

  // Fast längd
  const [durationMinutes, setDurationMinutes] = useState('90');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'families', 'reichstein', 'templates'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Template[];
        setTemplates(data);
      }
    );
    return () => unsubscribe();
  }, []);

  const openCreate = () => {
    setEditingTemplate(null);
    setName('');
    setSelectedColor(COLORS_OPTIONS[0]);
    setTemplateType('fixed_time');
    setStartHour('08');
    setStartMinute('00');
    setEndHour('09');
    setEndMinute('00');
    setDurationMinutes('90');
    setCreatedBy(1);
    setShowModal(true);
  };

  const openEdit = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setSelectedColor(template.color);
    setTemplateType(template.type ?? 'fixed_time');
    setStartHour(String(template.startHour ?? 8).padStart(2, '0'));
    setStartMinute(String(template.startMinute ?? 0).padStart(2, '0'));
    setEndHour(String(template.endHour ?? 9).padStart(2, '0'));
    setEndMinute(String(template.endMinute ?? 0).padStart(2, '0'));
    setDurationMinutes(String(template.durationMinutes ?? 90));
    setCreatedBy(template.createdBy);
    setShowModal(true);
  };

  const validateFixedTime = () => {
    const sh = parseInt(startHour);
    const sm = parseInt(startMinute);
    const eh = parseInt(endHour);
    const em = parseInt(endMinute);
    if (isNaN(sh) || sh < 0 || sh > 23) { Alert.alert('Ogiltig starttimme (0-23)'); return false; }
    if (isNaN(sm) || sm < 0 || sm > 59) { Alert.alert('Ogiltig startminut (0-59)'); return false; }
    if (isNaN(eh) || eh < 0 || eh > 23) { Alert.alert('Ogiltig sluttimme (0-23)'); return false; }
    if (isNaN(em) || em < 0 || em > 59) { Alert.alert('Ogiltig slutminut (0-59)'); return false; }
    if (sh * 60 + sm >= eh * 60 + em) { Alert.alert('Sluttid måste vara efter starttid'); return false; }
    return true;
  };

  const validateDuration = () => {
    const d = parseInt(durationMinutes);
    if (isNaN(d) || d < 1) { Alert.alert('Ogiltig längd — ange minuter t.ex. 90'); return false; }
    return true;
  };

  const saveTemplate = async () => {
    if (!name.trim()) { Alert.alert('Namn krävs'); return; }

    let data: any = {
      name: name.trim(),
      color: selectedColor,
      type: templateType,
      createdBy,
    };

    if (templateType === 'fixed_time') {
      if (!validateFixedTime()) return;
      data = {
        ...data,
        startHour: parseInt(startHour),
        startMinute: parseInt(startMinute),
        endHour: parseInt(endHour),
        endMinute: parseInt(endMinute),
      };
    } else {
      if (!validateDuration()) return;
      data = {
        ...data,
        durationMinutes: parseInt(durationMinutes),
      };
    }

    if (editingTemplate) {
      await updateDoc(doc(db, 'families', 'reichstein', 'templates', editingTemplate.id), data);
    } else {
      await addDoc(collection(db, 'families', 'reichstein', 'templates'), data);
    }
    setShowModal(false);
  };

  const deleteTemplate = (id: string) => {
    Alert.alert('Ta bort mall?', 'Vill du ta bort denna aktivitetsmall?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: () => deleteDoc(doc(db, 'families', 'reichstein', 'templates', id)),
      },
    ]);
  };

  // Visar rätt tidsinformation beroende på malltyp
  const renderTemplateMeta = (item: Template) => {
    if (item.type === 'duration') {
      return formatDuration(item.durationMinutes ?? 0);
    }
    return `${formatTime(item.startHour ?? 0, item.startMinute ?? 0)} - ${formatTime(item.endHour ?? 0, item.endMinute ?? 0)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Tillbaka</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Aktivitetsmallar</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Ny</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Inga mallar ännu — skapa din första!</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftColor: item.color }]}>
            <View style={styles.cardLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <View>
                <Text style={styles.templateName}>{item.name}</Text>
                <Text style={styles.templateMeta}>
                  {renderTemplateMeta(item)} · {USERS[item.createdBy]}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Redigera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTemplate(item.id)}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>
                {editingTemplate ? 'Redigera mall' : 'Ny aktivitetsmall'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Namn (t.ex. Arbete, Padel)"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Färg</Text>
              <View style={styles.colorGrid}>
                {COLORS_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>

              {/* Växlare mellan fast tid och fast längd */}
              <Text style={styles.label}>Typ av mall</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    templateType === 'fixed_time' && { backgroundColor: selectedColor },
                  ]}
                  onPress={() => setTemplateType('fixed_time')}
                >
                  <Text style={[
                    styles.typeBtnText,
                    templateType === 'fixed_time' && { color: '#fff' },
                  ]}>
                    Fast tid
                  </Text>
                  <Text style={[
                    styles.typeBtnSub,
                    templateType === 'fixed_time' && { color: '#fff' },
                  ]}>
                    t.ex. 07:20 - 15:40
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    templateType === 'duration' && { backgroundColor: selectedColor },
                  ]}
                  onPress={() => setTemplateType('duration')}
                >
                  <Text style={[
                    styles.typeBtnText,
                    templateType === 'duration' && { color: '#fff' },
                  ]}>
                    Fast längd
                  </Text>
                  <Text style={[
                    styles.typeBtnSub,
                    templateType === 'duration' && { color: '#fff' },
                  ]}>
                    t.ex. 90 min
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Fast tid — visa tidsväljare */}
              {templateType === 'fixed_time' && (
                <>
                  <Text style={styles.label}>Starttid</Text>
                  <View style={styles.timeRow}>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="08"
                      value={startHour}
                      onChangeText={setStartHour}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                    />
                    <Text style={styles.timeSeparator}>:</Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="00"
                      value={startMinute}
                      onChangeText={setStartMinute}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                    />
                  </View>

                  <Text style={styles.label}>Sluttid</Text>
                  <View style={styles.timeRow}>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="09"
                      value={endHour}
                      onChangeText={setEndHour}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                    />
                    <Text style={styles.timeSeparator}>:</Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="00"
                      value={endMinute}
                      onChangeText={setEndMinute}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                    />
                  </View>
                </>
              )}

              {/* Fast längd — visa minutinput */}
              {templateType === 'duration' && (
                <>
                  <Text style={styles.label}>Längd i minuter</Text>
                  <View style={styles.durationRow}>
                    <TextInput
                      style={styles.durationInput}
                      placeholder="90"
                      value={durationMinutes}
                      onChangeText={setDurationMinutes}
                      keyboardType="number-pad"
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text style={styles.durationLabel}>
                      min {durationMinutes ? `(${formatDuration(parseInt(durationMinutes) || 0)})` : ''}
                    </Text>
                  </View>
                </>
              )}

              <Text style={styles.label}>Skapad av</Text>
              <View style={styles.userRow}>
                {Object.entries(USERS).map(([id, uname]) => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.userBtn,
                      createdBy === Number(id) && { backgroundColor: selectedColor },
                    ]}
                    onPress={() => setCreatedBy(Number(id))}
                  >
                    <Text style={[
                      styles.userBtnText,
                      createdBy === Number(id) && { color: '#fff' },
                    ]}>
                      {uname}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: selectedColor }]}
                onPress={saveTemplate}
              >
                <Text style={styles.saveBtnText}>
                  {editingTemplate ? 'Spara ändringar' : 'Skapa mall'}
                </Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: '#6200ee' },
  header: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  addBtn: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  templateName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  templateMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 13, color: '#333' },
  deleteBtnText: { fontSize: 16, color: '#c62828', padding: 4 },
  empty: { textAlign: 'center', marginTop: 40, color: '#aaa' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorOption: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: '#1a1a1a' },
  // Växlare mellan malltyper
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  typeBtnSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    width: 70,
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  // Längdinput
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    width: 100,
  },
  durationLabel: {
    fontSize: 16,
    color: '#666',
  },
  userRow: { flexDirection: 'row', gap: 8 },
  userBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  userBtnText: { fontWeight: '600', color: '#333' },
  saveBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelText: { textAlign: 'center', color: '#888', padding: 8 },
});