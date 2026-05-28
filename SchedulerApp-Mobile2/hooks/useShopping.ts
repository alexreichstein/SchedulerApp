// Hook för att hantera inköpslistan och favoritvaror
// Alla ändringar synkas i realtid via Firestore

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../firebase';

// Typ för en vara i inköpslistan
export type ShoppingItem = {
  id: string;
  text: string;      // Varans namn
  addedBy: number;   // Vem som lade till varan
};

// Typ för en favoritvara
export type FavoriteItem = {
  id: string;
  text: string;      // Varans namn
  addedBy: number;   // Vem som skapade favoriten
};

// Sökvägar i Firestore
const ITEMS_PATH = ['families', 'reichstein', 'shopping', 'data', 'items'] as const;
const FAVORITES_PATH = ['families', 'reichstein', 'shopping', 'data', 'favorites'] as const;

export function useShopping() {
  // Aktiva varor i listan
  const [items, setItems] = useState<ShoppingItem[]>([]);

  // Sparade favoritvaror
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Prenumererar på aktiva varor
  useEffect(() => {
    const q = query(collection(db, ...ITEMS_PATH), orderBy('text', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ShoppingItem[];
      setItems(data);
    });
    return () => unsubscribe();
  }, []);

  // Prenumererar på favoritvaror
  useEffect(() => {
    const q = query(collection(db, ...FAVORITES_PATH), orderBy('text', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FavoriteItem[];
      setFavorites(data);
    });
    return () => unsubscribe();
  }, []);

  // Lägger till en vara i listan
  const addItem = async (text: string, addedBy: number) => {
    if (!text.trim()) return;
    await addDoc(collection(db, ...ITEMS_PATH), {
      text: text.trim(),
      addedBy,
    });
  };

  // Tar bort en vara från listan (när den checkas i)
  const removeItem = async (id: string) => {
    await deleteDoc(doc(db, ...ITEMS_PATH, id));
  };

  // Lägger till en favoritvara
  const addFavorite = async (text: string, addedBy: number) => {
    if (!text.trim()) return;
    // Kontrollerar att favoriten inte redan finns
    if (favorites.some((f) => f.text.toLowerCase() === text.toLowerCase())) return;
    await addDoc(collection(db, ...FAVORITES_PATH), {
      text: text.trim(),
      addedBy,
    });
  };

  // Tar bort en favoritvara
  const removeFavorite = async (id: string) => {
    await deleteDoc(doc(db, ...FAVORITES_PATH, id));
  };

  // Lägger till en favoritvara i aktiva listan
  const addFavoriteToList = async (favorite: FavoriteItem, addedBy: number) => {
    // Kontrollerar att varan inte redan finns i listan
    if (items.some((i) => i.text.toLowerCase() === favorite.text.toLowerCase())) return;
    await addDoc(collection(db, ...ITEMS_PATH), {
      text: favorite.text,
      addedBy,
    });
  };

  return {
    items,
    favorites,
    addItem,
    removeItem,
    addFavorite,
    removeFavorite,
    addFavoriteToList,
  };
}