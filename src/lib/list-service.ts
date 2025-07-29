
"use client";

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch, serverTimestamp, getDoc, runTransaction, increment, getDocs } from 'firebase/firestore';
import type { UserList, ListWord, WordCategory } from '@/types';

// --- List Management ---

export function getLists(
  userId: string,
  language: string,
  callback: (lists: UserList[]) => void
) {
  if (!userId || !language || !db) return () => {};

  const listsCollectionRef = collection(db, 'data', userId, language);
  const q = query(listsCollectionRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const lists: UserList[] = [];
    querySnapshot.forEach((doc) => {
      lists.push({ id: doc.id, ...doc.data() } as UserList);
    });
    callback(lists);
  }, (error) => {
    console.error("Error fetching lists: ", error);
  });

  return unsubscribe;
}

export async function createList(userId: string, language: string, name: string): Promise<string> {
    if (!userId || !language || !db) throw new Error("User not authenticated, language not provided, or database not available.");
    
    const listsCollectionRef = collection(db, 'data', userId, language);
    const newList = {
        name,
        createdAt: Date.now(),
        wordCount: 0,
    };
    const docRef = await addDoc(listsCollectionRef, newList);
    return docRef.id;
}

export async function deleteList(userId: string, language: string, listId: string): Promise<void> {
    if (!userId || !language || !listId || !db) throw new Error("Missing user, language, or list ID, or database unavailable.");
    
    const listDocRef = doc(db, 'data', userId, language, listId);
    await deleteDoc(listDocRef);
}


// --- Word Management within a List ---

export async function getListDetails(userId: string, language: string, listId: string): Promise<UserList | null> {
    if (!userId || !language || !listId || !db) return null;
    const listDocRef = doc(db, 'data', userId, language, listId);
    const docSnap = await getDoc(listDocRef);
    if(docSnap.exists()){
        return { id: docSnap.id, ...docSnap.data() } as UserList;
    }
    return null;
}


export function getWordsForList(
  userId: string,
  language: string,
  listId: string,
  callback: (words: ListWord[]) => void
) {
  if (!userId || !language || !listId || !db) return () => {};

  const wordsCollectionRef = collection(db, 'data', userId, language, listId, 'words');
  const q = query(wordsCollectionRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const words: ListWord[] = [];
    querySnapshot.forEach((doc) => {
      words.push({ id: doc.id, ...doc.data() } as ListWord);
    });
    callback(words);
  }, (error) => {
    console.error("Error fetching words for list: ", error);
  });

  return unsubscribe;
}

export async function getAllWordsFromAllLists(userId: string, language: string): Promise<(ListWord & { listId: string; listName: string; })[]> {
    if (!userId || !language || !db) return [];
    
    const allListWords: (ListWord & { listId: string; listName: string; })[] = [];
    const listsCollectionRef = collection(db, 'data', userId, language);
    const listsSnapshot = await getDocs(listsCollectionRef);

    for (const listDoc of listsSnapshot.docs) {
        const wordsCollectionRef = collection(db, 'data', userId, language, listDoc.id, 'words');
        const wordsSnapshot = await getDocs(wordsCollectionRef);
        wordsSnapshot.forEach(wordDoc => {
            allListWords.push({ 
                listId: listDoc.id,
                listName: listDoc.data().name,
                id: wordDoc.id,
                ...wordDoc.data(),
            } as ListWord & { listId: string; listName: string });
        });
    }
    
    allListWords.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return allListWords;
}


export async function addWordToList(
    userId: string,
    language: string,
    listId: string, 
    wordData: Omit<ListWord, 'id' | 'createdAt'>
): Promise<void> {
    if (!userId || !language || !listId || !db) throw new Error("Authentication, language, or database error.");

    const listDocRef = doc(db, 'data', userId, language, listId);
    const wordsCollectionRef = collection(listDocRef, 'words');

    await runTransaction(db, async (transaction) => {
        const newWord = { ...wordData, createdAt: Date.now() };
        transaction.set(doc(wordsCollectionRef), newWord);
        transaction.update(listDocRef, { wordCount: increment(1) });
    });
}

export async function updateWordInList(
    userId: string,
    language: string,
    listId: string, 
    wordId: string, 
    wordData: Partial<Omit<ListWord, 'id' | 'createdAt'>>
): Promise<void> {
    if (!userId || !language || !listId || !wordId || !db) throw new Error("Authentication, language or database error.");

    const wordDocRef = doc(db, 'data', userId, language, listId, 'words', wordId);
    await updateDoc(wordDocRef, wordData);
}

export async function deleteWordFromList(
    userId: string,
    language: string,
    listId: string, 
    wordId: string
): Promise<void> {
    if (!userId || !language || !listId || !wordId || !db) throw new Error("Missing required IDs or database unavailable.");

    const listDocRef = doc(db, 'data', userId, language, listId);
    const wordDocRef = doc(listDocRef, 'words', wordId);
    
    await runTransaction(db, async (transaction) => {
        transaction.delete(wordDocRef);
        transaction.update(listDocRef, { wordCount: increment(-1) });
    });
}

export async function addMultipleWordsToList(
    userId: string,
    language: string,
    listId: string, 
    processedWords: { text: string, exampleSentence: string, meaning: string }[],
    targetLanguage: string
): Promise<void> {
    if (!userId || !language || !listId || !processedWords.length || !db) throw new Error("Missing required data or db unavailable.");

    const listDocRef = doc(db, 'data', userId, language, listId);

    await runTransaction(db, async (transaction) => {
        const wordsCollectionRef = collection(listDocRef, 'words');
        processedWords.forEach(pWord => {
            const newWordRef = doc(wordsCollectionRef);
            const wordToAdd: Omit<ListWord, 'id'> = {
                word: pWord.text,
                example: pWord.exampleSentence,
                meaning: pWord.meaning,
                language: targetLanguage,
                category: 'Uncategorized',
                createdAt: Date.now(),
            };
            transaction.set(newWordRef, wordToAdd);
        });
        transaction.update(listDocRef, { wordCount: increment(processedWords.length) });
    });
}

export async function deleteMultipleWordsFromList(
    userId: string,
    language: string,
    listId: string, 
    wordIds: string[]
): Promise<void> {
    if (!userId || !language || !listId || !wordIds.length || !db) throw new Error("Missing required IDs or database unavailable.");

    const listDocRef = doc(db, 'data', userId, language, listId);
    
    await runTransaction(db, async (transaction) => {
        wordIds.forEach(wordId => {
            const wordDocRef = doc(listDocRef, 'words', wordId);
            transaction.delete(wordDocRef);
        });
        transaction.update(listDocRef, { wordCount: increment(-wordIds.length) });
    });
}
