import { useMemo } from "react";
import {
  collection,
  writeBatch,
  getDocs,
  type CollectionReference,
  type DocumentReference,
  type Query,
} from "firebase/firestore";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { db as firestoreDb, auth } from "./firebase";
import type { ConsultationResult, ImagingResult } from "@/lib/agents/types";

export interface PatientDocument {
  id: string;
  name: string;
  url: string;
  publicId?: string;
  type: string;
  size?: number;
  uploadedAt: number;
}

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
  photoUrl?: string;
  documents?: PatientDocument[];
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
  publicId?: string;
  thumbnailUrl?: string;
  storageProvider?: "cloudinary" | "local";
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

export interface AssistantThreadRecord {
  id?: string;
  title: string;
  updatedAt: number;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: number;
    model?: string | undefined;
    failovers?: number | undefined;
  }>;
}

export interface UserCollections {
  patients: CollectionReference<PatientRecord>;
  consultations: CollectionReference<ConsultationRecord>;
  timeline: CollectionReference<TimelineEvent>;
  imaging: CollectionReference<ImagingRecord>;
  reports: CollectionReference<ReportRecord>;
  settings: CollectionReference<SettingRecord>;
  assistantThreads: CollectionReference<AssistantThreadRecord>;
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
    assistantThreads: collection(
      firestoreDb,
      `users/${userId}/assistantThreads`,
    ) as CollectionReference<AssistantThreadRecord>,
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

export function usePaginatedCollection<T>(
  queryRef: Query<T> | CollectionReference<T> | null | undefined,
  pageSize = 10,
) {
  const [snapshot, loading, error] = useCollection(queryRef);
  const allData = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as (T & { id: string })[];
  }, [snapshot]);

  return {
    allData,
    loading,
    error,
    totalCount: allData.length,
    totalPages: Math.ceil(allData.length / pageSize) || 1,
    getPage: (pageIndex: number) => {
      const start = pageIndex * pageSize;
      return allData.slice(start, start + pageSize);
    },
  };
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
