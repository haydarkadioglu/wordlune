
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

// --- Story Types ---
export interface Story {
<<<<<<< HEAD
  id: string;
  title: string;
  language: string; // e.g. English, Spanish
  level: string; // e.g. A1, B2
  category: string; // e.g. Fantasy, Science-Fiction
  content: string;
  createdAt: any; // Firestore Timestamp
=======
    id: string;
    title: string;
    content: string;
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    category: 'Adventure' | 'Romance' | 'Mystery' | 'Science Fiction' | 'Fantasy' | 'Comedy' | 'Drama' | 'Horror';
    createdAt: number; // timestamp
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
}
