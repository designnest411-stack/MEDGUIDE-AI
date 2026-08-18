import { useMemo } from "react";
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  deleteDoc,
  type CollectionReference,
  type DocumentReference,
  type Query,
} from "firebase/firestore";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { db as firestoreDb, auth } from "./firebase";
import type { ConsultationResult, ImagingResult } from "@/lib/agents/types";

export interface PatientRecord {
  id?: string;
  name: string;
  question?: string;
  age: string;
  sex: string;
  history: string;
  medications: string;
  allergies: string;
  vitals: string;
  labs: string;
  createdAt: number;
}

export interface ConsultationRecord {
  id?: string;
  patientId?: string;
  question: string;
  result: ConsultationResult;
  createdAt: number;
}

export interface TimelineEvent {
  id?: string;
  patientId?: string;
  date: string;
  kind: "symptom" | "test" | "medication" | "imaging" | "outcome" | "note";
  title: string;
  detail: string;
  createdAt: number;
}

export interface ImagingRecord {
  id?: string;
  patientId?: string;
  name: string;
  imageDataUrl: string;
  result: ImagingResult;
  createdAt: number;
}

export interface ReportRecord {
  id?: string;
  consultationId?: string;
  title: string;
  patientName: string;
  markdown: string;
  createdAt: number;
}

export interface SettingRecord {
  key: string;
  value: string;
}

export interface UserCollections {
  patients: CollectionReference<PatientRecord>;
  consultations: CollectionReference<ConsultationRecord>;
  timeline: CollectionReference<TimelineEvent>;
  imaging: CollectionReference<ImagingRecord>;
  reports: CollectionReference<ReportRecord>;
  settings: CollectionReference<SettingRecord>;
}

export const getCollections = (userId: string): UserCollections => {
  return {
    patients: collection(
      firestoreDb,
      `users/${userId}/patients`,
    ) as CollectionReference<PatientRecord>,
    consultations: collection(
      firestoreDb,
      `users/${userId}/consultations`,
    ) as CollectionReference<ConsultationRecord>,
    timeline: collection(
      firestoreDb,
      `users/${userId}/timeline`,
    ) as CollectionReference<TimelineEvent>,
    imaging: collection(
      firestoreDb,
      `users/${userId}/imaging`,
    ) as CollectionReference<ImagingRecord>,
    reports: collection(
      firestoreDb,
      `users/${userId}/reports`,
    ) as CollectionReference<ReportRecord>,
    settings: collection(
      firestoreDb,
      `users/${userId}/settings`,
    ) as CollectionReference<SettingRecord>,
  };
};

export function useTypedCollection<T>(
  queryRef: Query<T> | CollectionReference<T> | null | undefined,
) {
  const [snapshot, loading, error] = useCollection(queryRef);
  const data = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as (T & { id: string })[];
  }, [snapshot]);
  return [data, loading, error] as const;
}

export function useTypedDocument<T>(docRef: DocumentReference<T> | null | undefined) {
  const [snapshot, loading, error] = useDocument(docRef);
  const data = useMemo(() => {
    if (!snapshot || !snapshot.exists()) return null;
    return {
      ...snapshot.data(),
      id: snapshot.id,
    } as T & { id: string };
  }, [snapshot]);
  return [data, loading, error] as const;
}

export async function wipeAll() {
  const user = auth.currentUser;
  if (!user) return;
  const cols = getCollections(user.uid);
  const batch = writeBatch(firestoreDb);

  for (const colRef of Object.values(cols)) {
    const snap = await getDocs(colRef);
    snap.docs.forEach((d) => batch.delete(d.ref));
  }
  await batch.commit();
}
