// components/EventCard.tsx
// Komponent för att visa en enskild händelse som ett kort
// Används i dagvyn för att lista händelser för vald dag
// Tryck på kortet öppnar redigeringsmodalen
// Långtryck på kortet öppnar bekräftelsedialog för radering

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Event } from '../types';
import { USERS, COLORS } from '../constants';

// Props som komponenten tar emot från föräldrakomponenten
type Props = {
  event: Event;              // Händelsen som ska visas
  onPress: () => void;       // Callback när användaren trycker på kortet (för att redigera)
  onLongPress: () => void;   // Callback när användaren håller inne på kortet (för att radera)
};

export default function EventCard({ event, onPress, onLongPress }: Props) {
  // Bestämmer kortets vänsterkantsfärg — mallens färg har prioritet, annars användarens färg
  const borderColor = event.templateColor ?? COLORS[event.userId] ?? '#ccc';

  // Formaterar millisekunder till läsbar tid, t.ex. "08:00 - 09:00"
  const formatTime = (start: number, end: number) => {
    const startStr = new Date(start).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endStr = new Date(end).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    // onPress öppnar redigeringsmodalen — onLongPress öppnar raderingsdialogen
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>

      {/* Kortets vänsterkant färgas med användarens/mallens färg */}
      <View style={[styles.card, { borderLeftColor: borderColor }]}>

        {/* Rubrikrad med titel och användarnamn */}
        <View style={styles.cardHeader}>
          {/* Händelsens titel */}
          <Text style={styles.title}>{event.title}</Text>
          {/* Användarens namn färgas med användarens färg */}
          <Text style={[styles.user, { color: COLORS[event.userId] ?? '#ccc' }]}>
            {USERS[event.userId] ?? 'Okänd'}
          </Text>
        </View>

        {/* Beskrivning visas bara om den finns */}
        {event.description ? (
          <Text style={styles.description}>{event.description}</Text>
        ) : null}

        {/* Tidsintervall för händelsen */}
        <Text style={styles.time}>
          {formatTime(event.startTime, event.endTime)}
        </Text>

        {/* Liten ledtråd om att kortet går att trycka på */}
        <Text style={styles.editHint}>Tryck för att redigera • Håll inne för att radera</Text>

      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Kortets grundstil — vit bakgrund, skugga och färgad vänsterkant
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    borderLeftWidth: 4,
  },

  // Rubrikrad med titel och användarnamn på samma rad
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  // Händelsens titel
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // Användarnamn i användarens färg
  user: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Beskrivningstext — visas bara om beskrivning finns
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },

  // Tidsintervall i grå text
  time: {
    fontSize: 12,
    color: '#888',
  },

  // Liten ledtrådstext längst ner på kortet
  editHint: {
    fontSize: 10,
    color: '#bbb',
    marginTop: 6,
  },
});