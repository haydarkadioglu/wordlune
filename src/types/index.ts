
import type { User as FirebaseUser } from "firebase/auth";

export type AppUser = FirebaseUser;

export type WordCategory = 'Very Good' | 'Good' | 'Bad' | 'Repeat' | 'Uncategorized';

// This interface is now deprecated and will be removed in the future.
// ListWord is the primary type for words.
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
  id:string;
  word: string;
  meaning: string;
  example: string;
  language: string;
  category: WordCategory;
  createdAt: number; // timestamp
}

// --- Story Types ---
export interface Story {
  id: string;
  title: string;
  language: string; // e.g. English, Spanish
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: 'Adventure' | 'Romance' | 'Mystery' | 'Science Fiction' | 'Fantasy' | 'Comedy' | 'Drama' | 'Horror' | 'Bilimsel Yazı';
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  isPublished: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// --- Moderation Types ---
export interface UserBan {
    isPermanent: boolean;
    bannedUntil: any; // Firestore Timestamp or null
    bannedAt: any; // Firestore Timestamp
}
