import type { User as FirebaseUser } from "firebase/auth";

export interface User extends FirebaseUser {}

export type WordCategory = 'Bad' | 'Good' | 'Very Good';

export interface Word {
  id: string;
  text: string;
  category: WordCategory;
  pronunciationText?: string;
  exampleSentence: string;
  turkishMeaning?: string; // Added Turkish meaning
  userId: string;
  createdAt: number; // timestamp
}
