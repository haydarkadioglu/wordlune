
"use client";

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch, serverTimestamp, getDoc, runTransaction, increment, getDocs } from 'firebase/firestore';
import type { UserList, ListWord, WordCategory } from '@/types';

// --- List Management ---

export function getLists(
  userId: string,
  callback: (lists: UserList[]) => void
) {
  if (!userId || !db) return () => {};

  const listsCollectionRef = collection(db, 'data', userId, 'lists');
  const q = query(listsCollectionRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const lists: UserList[] = [];
    querySnapshot.forEach((doc) => {
      lists.push({ id: doc.id, ...doc.data() } as UserList);
    });
    callback(lists);
  }, (error) => {
    console.error("Error fetching lists: ", error);
    // You might want to show a toast message here
  });

  return unsubscribe;
}

export async function createList(userId: string, name: string): Promise<string> {
    if (!userId || !db) throw new Error("User not authenticated or database not available.");
    
    const listsCollectionRef = collection(db, 'data', userId, 'lists');
    const newList = {
        name,
        createdAt: Date.now(),
        wordCount: 0,
    };
    const docRef = await addDoc(listsCollectionRef, newList);
    return docRef.id;
}

export async function deleteList(userId: string, listId: string): Promise<void> {
    if (!userId || !listId || !db) throw new Error("Missing user or list ID, or database unavailable.");
    
    const listDocRef = doc(db, 'data', userId, 'lists', listId);
    // Note: This does not delete subcollections in the client SDK.
    // For full cleanup, you'd need a Cloud Function to delete all words in the list.
    // For now, we just delete the list document itself.
    await deleteDoc(listDocRef);
}


// --- Word Management within a List ---

export async function getListDetails(userId: string, listId: string): Promise<UserList | null> {
    if (!userId || !listId || !db) return null;
    const listDocRef = doc(db, 'data', userId, 'lists', listId);
    const docSnap = await getDoc(listDocRef);
    if(docSnap.exists()){
        return { id: docSnap.id, ...docSnap.data() } as UserList;
    }
    return null;
}


export function getWordsForList(
  userId: string,
  listId: string,
  callback: (words: ListWord[]) => void
) {
  if (!userId || !listId || !db) return () => {};

  const wordsCollectionRef = collection(db, 'data', userId, 'lists', listId, 'words');
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

export async function getAllWordsFromAllLists(userId: string): Promise<ListWord[]> {
    if (!userId || !db) return [];
    
    const allListWords: ListWord[] = [];
    const listsCollectionRef = collection(db, 'data', userId, 'lists');
    const listsSnapshot = await getDocs(listsCollectionRef);

    for (const listDoc of listsSnapshot.docs) {
        const wordsCollectionRef = collection(db, 'data', userId, 'lists', listDoc.id, 'words');
        const wordsSnapshot = await getDocs(wordsCollectionRef);
        wordsSnapshot.forEach(wordDoc => {
            allListWords.push({ 
                listId: listDoc.id, // Add listId for context
                listName: listDoc.data().name, // Add listName for context
                ...wordDoc.data(),
                id: wordDoc.id,
            } as ListWord & { listId: string; listName: string });
        });
    }
    
    allListWords.sort((a, b) => b.createdAt - a.createdAt);

    return allListWords;
}


export async function addWordToList(
    userId: string, 
    listId: string, 
    wordData: Omit<ListWord, 'id' | 'createdAt'>
): Promise<void> {
    if (!userId || !listId || !db) throw new Error("Authentication or database error.");

    const listDocRef = doc(db, 'data', userId, 'lists', listId);
    const wordsCollectionRef = collection(listDocRef, 'words');

    await runTransaction(db, async (transaction) => {
        // 1. Add the new word
        const newWord = { ...wordData, createdAt: Date.now() };
        transaction.set(doc(wordsCollectionRef), newWord);
        
        // 2. Increment the word count on the parent list
        transaction.update(listDocRef, { wordCount: increment(1) });
    });
}

export async function updateWordInList(
    userId: string, 
    listId: string, 
    wordId: string, 
    wordData: Partial<Omit<ListWord, 'id' | 'createdAt'>>
): Promise<void> {
    if (!userId || !listId || !wordId || !db) throw new Error("Authentication or database error.");

    const wordDocRef = doc(db, 'data', userId, 'lists', listId, 'words', wordId);
    await updateDoc(wordDocRef, wordData);
}

export async function deleteWordFromList(
    userId: string, 
    listId: string, 
    wordId: string
): Promise<void> {
    if (!userId || !listId || !wordId || !db) throw new Error("Missing required IDs or database unavailable.");

    const listDocRef = doc(db, 'data', userId, 'lists', listId);
    const wordDocRef = doc(listDocRef, 'words', wordId);
    
    await runTransaction(db, async (transaction) => {
        // 1. Delete the word document
        transaction.delete(wordDocRef);

        // 2. Decrement the word count on the parent list
        transaction.update(listDocRef, { wordCount: increment(-1) });
    });
}

export async function addMultipleWordsToList(
    userId: string, 
    listId: string, 
    processedWords: { text: string, exampleSentence: string, meaning: string }[],
    targetLanguage: string
): Promise<void> {
    if (!userId || !listId || !processedWords.length || !db) throw new Error("Missing required data or db unavailable.");

    const listDocRef = doc(db, 'data', userId, 'lists', listId);

    await runTransaction(db, async (transaction) => {
        // 1. Add new words
        const wordsCollectionRef = collection(listDocRef, 'words');
        processedWords.forEach(pWord => {
            const newWordRef = doc(wordsCollectionRef);
            const wordToAdd: Omit<ListWord, 'id'> = {
                word: pWord.text,
                example: pWord.exampleSentence,
                meaning: pWord.meaning,
                language: targetLanguage,
                category: 'Uncategorized', // Default category for bulk add
                createdAt: Date.now(),
            };
            transaction.set(newWordRef, wordToAdd);
        });

        // 2. Increment word count
        transaction.update(listDocRef, { wordCount: increment(processedWords.length) });
    });
}

export async function deleteMultipleWordsFromList(
    userId: string, 
    listId: string, 
    wordIds: string[]
): Promise<void> {
    if (!userId || !listId || !wordIds.length || !db) throw new Error("Missing required IDs or database unavailable.");

    const listDocRef = doc(db, 'data', userId, 'lists', listId);
    
    await runTransaction(db, async (transaction) => {
        // 1. Delete all the selected word documents
        wordIds.forEach(wordId => {
            const wordDocRef = doc(listDocRef, 'words', wordId);
            transaction.delete(wordDocRef);
        });

        // 2. Decrement the word count on the parent list
        transaction.update(listDocRef, { wordCount: increment(-wordIds.length) });
    });
}
