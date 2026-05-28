// Modal för att skapa en ny händelse
// Stöder två malltyper:
// - fixed_time: start och sluttid fylls i automatiskt från mallen
// - duration: endast starttid väljs, sluttid räknas ut från längden

import { useState, useEffect } from 'react';
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

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    userId: number;
    templateColor: string | null;
  }) => void;
  templates: Template[];
  selectedDate: Date;
  activeUserId: number;
};

// Formaterar minuter till läsbar text
const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60} tim`;
  return `${Math.floor(minutes / 60)} tim ${minutes % 60} min`;
};

export default function AddEventModal({
  visible,
  onClose,
  onSave,
  templates,
  selectedDate,
  activeUserId,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);

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

  // Återställer formuläret när vald dag ändras
  useEffect(() => {
    const start = new Date(selectedDate);
    start.setHours(8, 0, 0, 0);
    setStartTime(start);
    const end = new Date(selectedDate);
    end.setHours(9, 0, 0, 0);
    setEndTime(end);
    setSelectedTemplate(null);
    setTitle('');
    setDescription('');
  }, [selectedDate]);

  // Applicerar en mall beroende på typ
  const applyTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setTitle(template.name);

    if (template.type === 'fixed_time') {
      // Fast tid — sätter både start och sluttid från mallen
      const start = new Date(selectedDate);
      start.setHours(template.startHour ?? 8, template.startMinute ?? 0, 0, 0);
      setStartTime(start);

      const end = new Date(selectedDate);
      end.setHours(template.endHour ?? 9, template.endMinute ?? 0, 0, 0);
      setEndTime(end);
    } else {
      // Fast längd — sätter bara starttid, sluttid räknas ut senare
      const start = new Date(selectedDate);
      start.setHours(8, 0, 0, 0);
      setStartTime(start);
      const end = new Date(start.getTime() + (template.durationMinutes ?? 60) * 60 * 1000);
      setEndTime(end);
    }
  };

  // Hanterar ändring av starttid
  const onStartTimeChange = (_: any, date?: Date) => {
    setShowStartPicker(false);
    if (!date) return;
    const combined = new Date(selectedDate);
    combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setStartTime(combined);

    // Om fast längd-mall — räkna om sluttid
    if (selectedTemplate?.type === 'duration') {
      const end = new Date(combined.getTime() + (selectedTemplate.durationMinutes ?? 60) * 60 * 1000);
      setEndTime(end);
    } else if (!selectedTemplate) {
      // Ingen mall — sluttid en timme senare
      setEndTime(new Date(combined.getTime() + 3600000));
    }
  };

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Titel krävs'); return; }
    if (endTime <= startTime) { Alert.alert('Sluttid måste vara efter starttid'); return; }
    onSave({
      title: title.trim(),
      description: description.trim(),
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
      userId: activeUserId,
      templateColor: selectedTemplate?.color ?? null,
    });
    setTitle('');
    setDescription('');
    setSelectedTemplate(null);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  // Visar tidsinformation på mallchipsen
  const renderTemplateTime = (t: Template) => {
    if (t.type === 'duration') {
      return formatDuration(t.durationMinutes ?? 0);
    }
    return `${String(t.startHour ?? 0).padStart(2, '0')}:${String(t.startMinute ?? 0).padStart(2, '0')} - ${String(t.endHour ?? 0).padStart(2, '0')}:${String(t.endMinute ?? 0).padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <ScrollView>
          <View style={styles.modal}>
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

            {/* Mallväljare */}
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
                        <Text style={[
                          styles.templateChipText,
                          selectedTemplate?.id === t.id && { color: '#fff' },
                        ]}>
                          {t.name}
                        </Text>
                        <Text style={[
                          styles.templateChipTime,
                          selectedTemplate?.id === t.id && { color: '#fff' },
                        ]}>
                          {renderTemplateTime(t)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Titel"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Beskrivning (valfritt)"
              value={description}
              onChangeText={setDescription}
            />

            {/* Tidsvisning beroende på malltyp */}
            {selectedTemplate?.type === 'fixed_time' ? (
              // Fast tid — visar start och sluttid, ingen justering möjlig
              <View style={styles.timeDisplayRow}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeBlockLabel}>Starttid</Text>
                  <Text style={[styles.timeBlockValue, { color: selectedTemplate.color }]}>
                    {formatTime(startTime)}
                  </Text>
                </View>
                <Text style={styles.timeDash}>→</Text>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeBlockLabel}>Sluttid</Text>
                  <Text style={[styles.timeBlockValue, { color: selectedTemplate.color }]}>
                    {formatTime(endTime)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedTemplate(null)}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>Ändra</Text>
                </TouchableOpacity>
              </View>
            ) : selectedTemplate?.type === 'duration' ? (
              // Fast längd — väljer starttid, sluttid räknas ut automatiskt
              <>
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
                <View style={styles.autoEndRow}>
                  <Text style={styles.autoEndLabel}>
                    Sluttid (automatisk — {formatDuration(selectedTemplate.durationMinutes ?? 0)})
                  </Text>
                  <Text style={[styles.autoEndValue, { color: selectedTemplate.color }]}>
                    {formatTime(endTime)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedTemplate(null)}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>Ändra mall</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Ingen mall — väljer starttid manuellt
              <>
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
              </>
            )}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: selectedTemplate?.color ?? COLORS[activeUserId] },
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Spara</Text>
            </TouchableOpacity>
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
  overlay: {
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
  modalTitle: { fontSize: 18, fontWeight: '700' },
  dateLabel: {
    fontSize: 14,
    color: '#888',
    textTransform: 'capitalize',
  },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  templateRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  templateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 80,
  },
  templateChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  templateChipTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  // Tidsvisning för fast tid
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  timeBlock: { alignItems: 'center' },
  timeBlockLabel: { fontSize: 11, color: '#888' },
  timeBlockValue: { fontSize: 20, fontWeight: '700' },
  timeDash: { fontSize: 18, color: '#888', flex: 1, textAlign: 'center' },
  // Automatisk sluttid för fast längd
  autoEndRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  autoEndLabel: { fontSize: 13, color: '#666', flex: 1 },
  autoEndValue: { fontSize: 18, fontWeight: '700' },
  clearBtn: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: { fontSize: 13, color: '#333', fontWeight: '600' },
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
  saveBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelText: { textAlign: 'center', color: '#888', padding: 8 },
});