// Definierar datastrukturen för en kalenderhändelse
// Används överallt i appen där händelser hanteras
export type Event = {
  id: string;           // Firestore dokument-ID
  title: string;        // Händelsens titel, t.ex. "Häst"
  description: string;  // Valfri beskrivning
  startTime: number;    // Starttid i millisekunder (Unix timestamp)
  endTime: number;      // Sluttid i millisekunder (Unix timestamp)
  userId: number;       // Vem som skapat händelsen (1=Alex, 2=Melinda, 3=Ryan)
  categoryId: number | null;     // Koppling till kategori, null om ingen vald
  reminderMinutes: number;       // Hur många minuter innan påminnelse ska skickas
  templateColor: string | null;  // Färg från mall om mall användes, annars null
};

// Definierar datastrukturen för en aktivitetsmall
// Mallar är förinställda aktiviteter som Häst, Padel etc.
export type Template = {
  id: string;               // Firestore dokument-ID
  name: string;             // Mallens namn, t.ex. "Häst"
  color: string;            // Färg i hex-format, t.ex. "#6d4c41"
  durationMinutes: number;  // Hur lång aktiviteten är i minuter
  createdBy: number;        // Vem som skapade mallen (1=Alex, 2=Melinda, 3=Ryan)
};