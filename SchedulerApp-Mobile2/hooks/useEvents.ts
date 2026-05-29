// hooks/useEvents.ts
// Hook för att hantera all Firebase-kommunikation kopplad till händelser
// Följer samma mönster som ett Repository i MVVM-arkitektur
// Returnerar händelser och funktioner för att skapa/uppdatera/radera
// Inkluderar: felhantering, offline-cache via AsyncStorage, laddning per månad

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  where,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import { Event } from '../types';

// Sökvägen till händelsesamlingen i Firestore
const EVENTS_PATH = ['families', 'reichstein', 'events'] as const;

// Nyckel för AsyncStorage-cachen — inkluderar månad och år så varje månad har sin egen cache
const cacheKey = (year: number, month: number) =>
  `events_cache_${year}_${month}`;

// Sparar händelser till AsyncStorage för given månad
// Anropas varje gång Firestore skickar ny data
const saveToCache = async (year: number, month: number, events: Event[]) => {
  try {
    await AsyncStorage.setItem(cacheKey(year, month), JSON.stringify(events));
  } catch (e) {
    console.warn('Kunde inte spara till cache:', e);
  }
};

// Läser händelser från AsyncStorage för given månad
// Returnerar null om ingen cache finns eller om den inte går att läsa
const loadFromCache = async (year: number, month: number): Promise<Event[] | null> => {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(year, month));
    return raw ? (JSON.parse(raw) as Event[]) : null;
  } catch (e) {
    console.warn('Kunde inte läsa från cache:', e);
    return null;
  }
};

// Hook som exponerar händelsedata och CRUD-operationer till UI-komponenter
// currentMonth styr vilken månad som hämtas från Firestore
export function useEvents(currentMonth: Date) {
  // Lista med händelser för aktuell månad
  const [events, setEvents] = useState<Event[]>([]);

  // Indikerar om första laddningen pågår
  const [loading, setLoading] = useState(true);

  // Felmeddelande om Firebase är nere eller något annat går fel
  // null betyder att allt fungerar normalt
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Beräknar första och sista millisekunden för aktuell månad
    const startOfMonth = new Date(year, month, 1).getTime();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

    // Laddar cache direkt så att UI visar något medan Firestore svarar
    loadFromCache(year, month).then((cached) => {
      if (cached) {
        setEvents(cached);
        setLoading(false);
      }
    });

    // Firestore-query begränsad till aktuell månad via startTime-intervall
    const q = query(
      collection(db, ...EVENTS_PATH),
      where('startTime', '>=', startOfMonth),
      where('startTime', '<=', endOfMonth),
      orderBy('startTime', 'asc')
    );

    // Prenumererar på realtidsuppdateringar från Firestore
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setError(null);
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Event[];
        setEvents(data);
        setLoading(false);
        saveToCache(year, month, data);
      },
      (err) => {
        console.error('Firebase-fel:', err);
        setError('Kunde inte ansluta till servern. Visar sparad data.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentMonth]);

  // Skapar en ny händelse i Firestore och returnerar det nya dokumentets ID
  const addEvent = async (event: Omit<Event, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, ...EVENTS_PATH), event);
      return docRef.id;
    } catch (e) {
      throw new Error('Kunde inte spara händelsen. Kontrollera din anslutning.');
    }
  };

  // Uppdaterar en befintlig händelse i Firestore baserat på id
  // Tar emot ett partiellt Event-objekt så att bara ändrade fält skickas
  const updateEvent = async (id: string, event: Omit<Event, 'id'>): Promise<void> => {
    try {
      await updateDoc(doc(db, ...EVENTS_PATH, id), { ...event });
    } catch (e) {
      throw new Error('Kunde inte uppdatera händelsen. Kontrollera din anslutning.');
    }
  };

  // Raderar en händelse från Firestore baserat på id
  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, ...EVENTS_PATH, id));
    } catch (e) {
      throw new Error('Kunde inte radera händelsen. Kontrollera din anslutning.');
    }
  };

  return { events, loading, error, addEvent, updateEvent, deleteEvent };
}