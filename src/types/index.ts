import type { User as FirebaseUser } from "firebase/auth";

export interface User extends FirebaseUser {}

export type WordCategory = 'Bad' | 'Good' | 'Very Good';

export interface Word {
  id: string;
  text: string;
  category: WordCategory;
  pronunciationText?: string;
  exampleSentence: string;
  meaning?: string;
  createdAt: number; // timestamp
}

// Type for words processed by the bulk AI flow before they get a category and ID
export interface ProcessedWord {
  text: string;
  exampleSentence: string;
  meaning: string;
}
