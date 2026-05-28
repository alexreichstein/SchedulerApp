// Hook för att hantera all Firebase-kommunikation kopplad till mallar
// Följer samma mönster som useEvents — Repository-lager i MVVM

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Template } from '../types';

// Sökvägen till mallsamlingen i Firestore
const TEMPLATES_PATH = ['families', 'reichstein', 'templates'] as const;

// Hook som exponerar malldata och CRUD-operationer till UI-komponenter
export function useTemplates() {
  // Lista med alla mallar hämtade från Firestore
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    // Prenumererar på realtidsuppdateringar från Firestore
    const unsubscribe = onSnapshot(
      collection(db, ...TEMPLATES_PATH),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Template[];
        setTemplates(data);
      }
    );

    // Avslutar prenumerationen när komponenten unmountas
    return () => unsubscribe();
  }, []);

  // Skapar en ny mall i Firestore
  const addTemplate = async (template: Omit<Template, 'id'>) => {
    await addDoc(collection(db, ...TEMPLATES_PATH), template);
  };

  // Uppdaterar en befintlig mall i Firestore
  const updateTemplate = async (id: string, template: Omit<Template, 'id'>) => {
    await updateDoc(doc(db, ...TEMPLATES_PATH, id), template);
  };

  // Raderar en mall från Firestore baserat på id
  const deleteTemplate = async (id: string) => {
    await deleteDoc(doc(db, ...TEMPLATES_PATH, id));
  };

  // Returnerar data och funktioner som komponenter behöver
  return { templates, addTemplate, updateTemplate, deleteTemplate };
}