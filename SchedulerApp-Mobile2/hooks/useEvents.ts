// Hook för att hantera all Firebase-kommunikation kopplad till händelser
// Följer samma mönster som ett Repository i MVVM-arkitektur
// Returnerar händelser och funktioner för att skapa/radera

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';

// Sökvägen till händelsesamlingen i Firestore
const EVENTS_PATH = ['families', 'reichstein', 'events'] as const;

// Hook som exponerar händelsedata och CRUD-operationer till UI-komponenter
export function useEvents() {
  // Lista med alla händelser hämtade från Firestore
  const [events, setEvents] = useState<Event[]>([]);

  // Indikerar om första laddningen från Firestore pågår
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skapar en Firestore-query som sorterar händelser på starttid stigande
    const q = query(
      collection(db, ...EVENTS_PATH),
      orderBy('startTime', 'asc')
    );

    // Prenumererar på realtidsuppdateringar från Firestore
    // onSnapshot anropas automatiskt varje gång data ändras
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(data);
      setLoading(false);
    });

    // Avslutar prenumerationen när komponenten unmountas
    // Förhindrar minnesläckor
    return () => unsubscribe();
  }, []);

 // Skapar en ny händelse i Firestore och returnerar det nya dokumentets ID
// ID:t används för att schemalägga notiser
const addEvent = async (event: Omit<Event, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, ...EVENTS_PATH), event);
  return docRef.id;
};

  // Raderar en händelse från Firestore baserat på id
  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(db, ...EVENTS_PATH, id));
  };

  // Returnerar data och funktioner som komponenter behöver
  return { events, loading, addEvent, deleteEvent };
}