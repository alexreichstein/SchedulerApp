// Modal för att skapa en ny händelse
// Hanterar val av mall, titel, beskrivning och starttid
// Om mall är vald räknas sluttid ut automatiskt

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Template } from '../types';
import { USERS, COLORS } from '../constants';

// Props som komponenten tar emot från föräldrakomponenten
type Props = {
  visible: boolean;              // Om modalen är synlig
  onClose: () => void;           // Callback när användaren stänger modalen
  onSave: (data: {              // Callback när användaren sparar händelsen
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    userId: number;
    templateColor: string | null;
  }) => void;
  templates: Template[];         // Lista med tillgängliga mallar
  selectedDate: Date;            // Vald dag från kalendern
  activeUserId: number;          // Aktiv användare
};

export default function AddEventModal({
  visible,
  onClose,
  onSave,
  templates,
  selectedDate,
  activeUserId,
}: Props) {
  // Titel för den nya händelsen
  const [title, setTitle] = useState('');

  // Beskrivning för den nya händelsen
  const [description, setDescription] = useState('');

  // Starttid — sätts till vald dag kl 08:00 som standard
  const [startTime, setStartTime] = useState(() => {
    const d = new Date(selectedDate);
    d.setHours(8, 0, 0, 0);
    return d;
  });

  // Sluttid — en timme efter starttid som standard
  const [endTime, setEndTime] = useState(() => {
    const d = new Date(selectedDate);
    d.setHours(9, 0, 0, 0);
    return d;
  });

  // Om tidväljaren för starttid visas
  const [showStartPicker, setShowStartPicker] = useState(false);

  // Om tidväljaren för sluttid visas
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Vald mall, null om ingen mall är vald
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Applicerar en mall på formuläret
  // Fyller i titel och räknar ut sluttid baserat på mallens längd
  const applyTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setTitle(template.name);
    setEndTime(new Date(startTime.getTime() + template.durationMinutes * 60 * 1000));
  };

  // Hanterar ändring av starttid
  // Om mall är vald räknas sluttid om automatiskt
  const onStartTimeChange = (_: any, date?: Date) => {
    setShowStartPicker(false);
    if (!date) return;
    // Kombinerar vald dag med vald tid
    const combined = new Date(selectedDate);
    combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setStartTime(combined);
    // Räknar om sluttid om mall är vald
    if (selectedTemplate) {
      setEndTime(new Date(combined.getTime() + selectedTemplate.durationMinutes * 60 * 1000));
    }
  };

  // Hanterar ändring av sluttid när ingen mall är vald
  const onEndTimeChange = (_: any, date?: Date) => {
    setShowEndPicker(false);
    if (!date) return;
    const combined = new Date(selectedDate);
    combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setEndTime(combined);
  };

  // Validerar och sparar händelsen
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Titel krävs');
      return;
    }
    if (endTime <= startTime) {
      Alert.alert('Sluttid måste vara efter starttid');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
      userId: activeUserId,
      templateColor: selectedTemplate?.color ?? null,
    });
    // Återställer formuläret efter sparning
    setTitle('');
    setDescription('');
    setSelectedTemplate(null);
  };

  // Formaterar en Date till tidssträng, t.ex. "08:00"
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <ScrollView>
          <View style={styles.modal}>
            {/* Rubrik med vald dag och aktiv användare */}
            <Text style={styles.modalTitle}>
              Ny händelse som {USERS[activeUserId]}
            </Text>
            <Text style={styles.dateLabel}>
              {selectedDate.toLocaleDateString('sv-SE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>

            {/* Mallväljare — visas bara om det finns mallar */}
            {templates.length > 0 && (
              <>
                <Text style={styles.label}>Välj mall</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.templateRow}>
                    {templates.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          styles.templateChip,
                          { borderColor: t.color },
                          selectedTemplate?.id === t.id && {
                            backgroundColor: t.color,
                          },
                        ]}
                        onPress={() => applyTemplate(t)}
                      >
                        <Text
                          style={[
                            styles.templateChipText,
                            selectedTemplate?.id === t.id && { color: '#fff' },
                          ]}
                        >
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {/* Titelfält */}
            <TextInput
              style={styles.input}
              placeholder="Titel"
              value={title}
              onChangeText={setTitle}
            />

            {/* Beskrivningsfält */}
            <TextInput
              style={styles.input}
              placeholder="Beskrivning (valfritt)"
              value={description}
              onChangeText={setDescription}
            />

            {/* Starttidsväljare — alltid klocka, aldrig datum */}
            <Text style={styles.label}>Starttid</Text>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setShowStartPicker(true)}
            >
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

            {/* Sluttidsväljare — visas bara om ingen mall är vald */}
            {!selectedTemplate && (
              <>
                <Text style={styles.label}>Sluttid</Text>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => setShowEndPicker(true)}
                >
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

            {/* Automatisk sluttid när mall är vald */}
            {selectedTemplate && (
              <View style={styles.autoEndRow}>
                <Text style={styles.autoEndLabel}>Sluttid (automatisk)</Text>
                <Text style={[styles.autoEndTime, { color: selectedTemplate.color }]}>
                  {formatTime(endTime)}
                </Text>
              </View>
            )}

            {/* Spara-knapp — färgas med mallens färg eller användarens färg */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: selectedTemplate?.color ?? COLORS[activeUserId] },
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Spara</Text>
            </TouchableOpacity>

            {/* Avbryt-knapp */}
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Halvtransparent bakgrund bakom modalen
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  // Modalens vita yta med rundade hörn upp
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 14,
    color: '#888',
    textTransform: 'capitalize',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  templateRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  templateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  templateChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  timeBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  timeBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  autoEndRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  autoEndLabel: {
    fontSize: 14,
    color: '#666',
  },
  autoEndTime: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelText: {
    textAlign: 'center',
    color: '#888',
    padding: 8,
  },
});