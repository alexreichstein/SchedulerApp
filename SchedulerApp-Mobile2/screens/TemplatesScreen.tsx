import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';

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

const COLORS_OPTIONS = [
  '#6200ee', '#03dac6', '#ff6d00', '#1565c0',
  '#2e7d32', '#f9a825', '#6d4c41', '#00838f',
  '#558b2f', '#c62828', '#ad1457', '#4527a0',
];

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '1 tim', value: 60 },
  { label: '1.5 tim', value: 90 },
  { label: '2 tim', value: 120 },
  { label: '3 tim', value: 180 },
  { label: '4 tim', value: 240 },
  { label: '6 tim', value: 360 },
  { label: 'Heldag', value: 480 },
];

export default function TemplatesScreen() {
  const navigation = useNavigation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS_OPTIONS[0]);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [createdBy, setCreatedBy] = useState(1);

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

  const openCreate = () => {
    setEditingTemplate(null);
    setName('');
    setSelectedColor(COLORS_OPTIONS[0]);
    setSelectedDuration(60);
    setCreatedBy(1);
    setShowModal(true);
  };

  const openEdit = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setSelectedColor(template.color);
    setSelectedDuration(template.durationMinutes);
    setCreatedBy(template.createdBy);
    setShowModal(true);
  };

  const saveTemplate = async () => {
    if (!name.trim()) { Alert.alert('Namn krävs'); return; }
    if (editingTemplate) {
      await updateDoc(doc(db, 'families', 'reichstein', 'templates', editingTemplate.id), {
        name: name.trim(), color: selectedColor, durationMinutes: selectedDuration, createdBy,
      });
    } else {
      await addDoc(collection(db, 'families', 'reichstein', 'templates'), {
        name: name.trim(), color: selectedColor, durationMinutes: selectedDuration, createdBy,
      });
    }
    setShowModal(false);
  };

  const deleteTemplate = (id: string) => {
    Alert.alert('Ta bort mall?', 'Vill du ta bort denna aktivitetsmall?', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Ta bort', style: 'destructive', onPress: () => deleteDoc(doc(db, 'families', 'reichstein', 'templates', id)) },
    ]);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes % 60 === 0) return `${minutes / 60} tim`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
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
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={styles.empty}>Inga mallar ännu — skapa din första!</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftColor: item.color }]}>
            <View style={styles.cardLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <View>
                <Text style={styles.templateName}>{item.name}</Text>
                <Text style={styles.templateMeta}>{formatDuration(item.durationMinutes)} · Skapad av {USERS[item.createdBy]}</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Redigera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTemplate(item.id)} style={styles.deleteBtn}>
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
              <Text style={styles.modalTitle}>{editingTemplate ? 'Redigera mall' : 'Ny aktivitetsmall'}</Text>

              <TextInput style={styles.input} placeholder="Namn (t.ex. Häst, Padel)" value={name} onChangeText={setName} />

              <Text style={styles.label}>Färg</Text>
              <View style={styles.colorGrid}>
                {COLORS_OPTIONS.map(color => (
                  <TouchableOpacity key={color} style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorSelected]} onPress={() => setSelectedColor(color)} />
                ))}
              </View>

              <Text style={styles.label}>Längd</Text>
              <View style={styles.durationGrid}>
                {DURATIONS.map(d => (
                  <TouchableOpacity key={d.value} style={[styles.durationBtn, selectedDuration === d.value && { backgroundColor: selectedColor }]} onPress={() => setSelectedDuration(d.value)}>
                    <Text style={[styles.durationBtnText, selectedDuration === d.value && { color: '#fff' }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Skapad av</Text>
              <View style={styles.userRow}>
                {Object.entries(USERS).map(([id, uname]) => (
                  <TouchableOpacity key={id} style={[styles.userBtn, createdBy === Number(id) && { backgroundColor: selectedColor }]} onPress={() => setCreatedBy(Number(id))}>
                    <Text style={[styles.userBtnText, createdBy === Number(id) && { color: '#fff' }]}>{uname}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: selectedColor }]} onPress={saveTemplate}>
                <Text style={styles.saveBtnText}>{editingTemplate ? 'Spara ändringar' : 'Skapa mall'}</Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: '#6200ee' },
  header: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  addBtn: { backgroundColor: '#6200ee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderLeftWidth: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  templateName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  templateMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  editBtnText: { fontSize: 13, color: '#333' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16, color: '#c62828' },
  empty: { textAlign: 'center', marginTop: 40, color: '#aaa' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorOption: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: '#1a1a1a' },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e0e0e0' },
  durationBtnText: { fontSize: 13, fontWeight: '600', color: '#333' },
  userRow: { flexDirection: 'row', gap: 8 },
  userBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0' },
  userBtnText: { fontWeight: '600', color: '#333' },
  saveBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelText: { textAlign: 'center', color: '#888', padding: 8 },
});