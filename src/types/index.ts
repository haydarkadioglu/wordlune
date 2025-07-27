
import type { User as FirebaseUser } from "firebase/auth";

export type AppUser = FirebaseUser & {
  username: string;
};

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

// --- New Types for Custom Lists Feature ---

export interface UserList {
  id: string;
  name: string;
  createdAt: number; // timestamp
  wordCount: number;
}

export interface ListWord {
  id: string;
  word: string;
  meaning: string;
  example: string;
  language: string;
  createdAt: number; // timestamp
}
