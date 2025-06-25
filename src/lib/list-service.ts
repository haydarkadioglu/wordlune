
"use client";

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch, serverTimestamp, getDoc, runTransaction, increment } from 'firebase/firestore';
import type { UserList, ListWord } from '@/types';

// --- List Management ---

export function getLists(
  userId: string,
  callback: (lists: UserList[]) => void
) {
  if (!userId || !db) return () => {};

  const listsCollectionRef = collection(db, 'users', userId, 'lists');
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
    
    const listsCollectionRef = collection(db, 'users', userId, 'lists');
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
    
    const listDocRef = doc(db, 'users', userId, 'lists', listId);
    // Note: This does not delete subcollections in the client SDK.
    // For full cleanup, you'd need a Cloud Function to delete all words in the list.
    // For now, we just delete the list document itself.
    await deleteDoc(listDocRef);
}


// --- Word Management within a List ---

export async function getListDetails(userId: string, listId: string): Promise<UserList | null> {
    if (!userId || !listId || !db) return null;
    const listDocRef = doc(db, 'users', userId, 'lists', listId);
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

  const wordsCollectionRef = collection(db, 'users', userId, 'lists', listId, 'words');
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

export async function addWordToList(
    userId: string, 
    listId: string, 
    wordData: Omit<ListWord, 'id' | 'createdAt'>
): Promise<void> {
    if (!userId || !listId || !db) throw new Error("Authentication or database error.");

    const listDocRef = doc(db, 'users', userId, 'lists', listId);
    const wordsCollectionRef = collection(listDocRef, 'words');

    await runTransaction(db, async (transaction) => {
        // 1. Add the new word
        const newWord = { ...wordData, createdAt: Date.now() };
        transaction.set(doc(wordsCollectionRef), newWord);
        
        // 2. Increment the word count on the parent list
        transaction.update(listDocRef, { wordCount: increment(1) });
    });
}

export async function deleteWordFromList(
    userId: string, 
    listId: string, 
    wordId: string
): Promise<void> {
    if (!userId || !listId || !wordId || !db) throw new Error("Missing required IDs or database unavailable.");

    const listDocRef = doc(db, 'users', userId, 'lists', listId);
    const wordDocRef = doc(listDocRef, 'words', wordId);
    
    await runTransaction(db, async (transaction) => {
        // 1. Delete the word document
        transaction.delete(wordDocRef);

        // 2. Decrement the word count on the parent list
        transaction.update(listDocRef, { wordCount: increment(-1) });
    });
}
