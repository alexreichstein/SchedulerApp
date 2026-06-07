// components/AddEventModal.tsx
// Modal för att skapa eller redigera en händelse
// Stöder två malltypar:
// - fixed_time: start och sluttid fylls i automatiskt från mallen
// - duration: endast starttid väljs, sluttid räknas ut från längden
// När existingEvent skickas med är modalen i redigeringsläge
// Fas 3: valbar påminnelsetid per händelse

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
import { Template, Event } from '../types';
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
    reminderMinutes: number;  // Valbar påminnelsetid skickas nu med till CalendarScreen
  }) => void;
  templates: Template[];
  selectedDate: Date;
  activeUserId: number;
  existingEvent?: Event | null;
};

// Formaterar minuter till läsbar text, t.ex. "90 min" eller "1 tim 30 min"
const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60} tim`;
  return `${Math.floor(minutes / 60)} tim ${minutes % 60} min`;
};

// Tillgängliga påminnelsealternativ — visas som valbara chips
const REMINDER_OPTIONS = [
  { label: 'Ingen', value: 0 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 tim', value: 60 },
  { label: '2 tim', value: 120 },
];

export default function AddEventModal({
  visible,
  onClose,
  onSave,
  templates,
  selectedDate,
  activeUserId,
  existingEvent = null,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);

  // Påminnelsetid i minuter — 15 min som standard
  const [reminderMinutes, setReminderMinutes] = useState(15);

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

  // Fyller i formuläret när modalen öppnas
  // Om existingEvent finns — fyll i med befintlig data (redigeringsläge)
  // Annars — återställ till standardvärden (skapandeläge)
  useEffect(() => {
    if (existingEvent) {
      // Redigeringsläge — fyll i formuläret med händelsens befintliga data
      setTitle(existingEvent.title);
      setDescription(existingEvent.description ?? '');
      setStartTime(new Date(existingEvent.startTime));
      setEndTime(new Date(existingEvent.endTime));
      setReminderMinutes(existingEvent.reminderMinutes ?? 15);

      // Försöker hitta den mall som matchar händelsens färg
      const matchingTemplate = templates.find(
        (t) => t.color === existingEvent.templateColor
      ) ?? null;
      setSelectedTemplate(matchingTemplate);
    } else {
      // Skapandeläge — återställ formuläret till standardvärden
      const start = new Date(selectedDate);
      start.setHours(8, 0, 0, 0);
      setStartTime(start);
      const end = new Date(selectedDate);
      end.setHours(9, 0, 0, 0);
      setEndTime(end);
      setSelectedTemplate(null);
      setTitle('');
      setDescription('');
      setReminderMinutes(15); // Återställ till 15 min som standard
    }
  }, [existingEvent, selectedDate, visible]);

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
      // Fast längd — beräknar sluttid från starttid + längd
      const start = new Date(selectedDate);
      start.setHours(8, 0, 0, 0);
      setStartTime(start);
      const end = new Date(start.getTime() + (template.durationMinutes ?? 60) * 60 * 1000);
      setEndTime(end);
    }
  };

  // Hanterar ändring av starttid från DateTimePicker
  const onStartTimeChange = (_: any, date?: Date) => {
    setShowStartPicker(false);
    if (!date) return;

    // Kombinerar vald dag med vald tid för att undvika tidzonsproblem
    const combined = new Date(selectedDate);
    combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setStartTime(combined);

    // Räknar om sluttid beroende på malltyp
    if (selectedTemplate?.type === 'duration') {
      const end = new Date(combined.getTime() + (selectedTemplate.durationMinutes ?? 60) * 60 * 1000);
      setEndTime(end);
    } else if (!selectedTemplate) {
      setEndTime(new Date(combined.getTime() + 3600000));
    }
  };

  // Validerar och sparar händelsen med vald påminnelsetid
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
      reminderMinutes, // Skickar vald påminnelsetid till CalendarScreen
    });

    // Återställer formuläret efter sparande
    setTitle('');
    setDescription('');
    setSelectedTemplate(null);
    setReminderMinutes(15);
  };

  // Formaterar ett Date-objekt till "HH:MM"
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

            {/* Rubrik — visar "Redigera händelse" eller "Ny händelse som [namn]" */}
            <Text style={styles.modalTitle}>
              {existingEvent
                ? 'Redigera händelse'
                : `Ny händelse som ${USERS[activeUserId]}`}
            </Text>

            {/* Visar vald dag under rubriken */}
            <Text style={styles.dateLabel}>
              {selectedDate.toLocaleDateString('sv-SE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>

            {/* Mallväljare — visas bara om det finns mallar att välja */}
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

            {/* ─── Påminnelseväljare ─────────────────────────────────────────── */}
            {/* Visar valbara chips för påminnelsetid */}
            {/* Aktivt chip får användarens/mallens färg som bakgrund */}
            <Text style={styles.label}>Påminnelse</Text>
            <View style={styles.reminderRow}>
              {REMINDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.reminderChip,
                    reminderMinutes === option.value && {
                      backgroundColor: selectedTemplate?.color ?? COLORS[activeUserId],
                      borderColor: selectedTemplate?.color ?? COLORS[activeUserId],
                    },
                  ]}
                  onPress={() => setReminderMinutes(option.value)}
                >
                  <Text style={[
                    styles.reminderChipText,
                    // Vit text på aktivt chip för att synas mot färgad bakgrund
                    reminderMinutes === option.value && { color: '#fff' },
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* ─── Slut påminnelseväljare ───────────────────────────────────── */}

            {/* Spara-knapp — färgen följer mallens färg eller aktiv användares färg */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: selectedTemplate?.color ?? COLORS[activeUserId] },
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>
                {existingEvent ? 'Spara ändringar' : 'Spara'}
              </Text>
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
  // Halvtransparent overlay bakom modalen
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  // Själva modalboxen — rundade övre hörn
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },

  // Rubrik
  modalTitle: { fontSize: 18, fontWeight: '700' },

  // Datum under rubriken
  dateLabel: {
    fontSize: 14,
    color: '#888',
    textTransform: 'capitalize',
  },

  // Etikett ovanför fält
  label: { fontSize: 14, fontWeight: '600', color: '#333' },

  // Rad med mallchips
  templateRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },

  // Enskilt mallchip
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

  // Textfält för titel och beskrivning
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

  // Knapp för att rensa mallval
  clearBtn: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: { fontSize: 13, color: '#333', fontWeight: '600' },

  // Knapp för att välja starttid
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

  // Rad med påminnelsechips — wrappas automatiskt om det inte får plats
  reminderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Enskilt påminnelsechip — inaktivt chip har grå kant
  reminderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },

  // Text på påminnelsechip — mörkgrå som standard, vit när aktivt
  reminderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },

  // Spara-knapp
  saveBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Avbryt-länk
  cancelText: { textAlign: 'center', color: '#888', padding: 8 },
});