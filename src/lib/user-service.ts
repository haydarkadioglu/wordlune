
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, getDocs, writeBatch, serverTimestamp, doc, getDoc, runTransaction } from 'firebase/firestore';

const MAX_LOGIN_HISTORY = 25;

/**
 * Checks if a username already exists in the 'usernames' collection.
 * @param username The username to check.
 * @returns True if the username exists, false otherwise.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
    if (!db) return false;
    const usernameRef = doc(db, 'usernames', username.toLowerCase());
    const docSnap = await getDoc(usernameRef);
    return docSnap.exists();
}

/**
 * Creates the initial user documents in Firestore after registration.
 * Creates a public username mapping and a private user profile document.
 * @param userId The user's unique ID from Firebase Auth.
 * @param username The user's chosen unique username.
 * @param displayName The user's display name.
 * @param email The user's email.
 */
export async function createInitialUserDocuments(userId: string, username: string, displayName: string, email: string): Promise<void> {
    if (!db) throw new Error("Database not initialized.");
    
    const userDocRef = doc(db, 'users', userId);
    const usernameDocRef = doc(db, 'usernames', username.toLowerCase());
    
    const batch = writeBatch(db);

    batch.set(userDocRef, {
        uid: userId,
        username: username,
        displayName: displayName,
        email: email,
        createdAt: serverTimestamp()
    });

    batch.set(usernameDocRef, {
        userId: userId
    });
    
    await batch.commit();
}

/**
 * Updates a user's username across the necessary documents.
 * @param userId The user's ID.
 * @param oldUsername The user's current username.
 * @param newUsername The desired new username.
 */
export async function updateUsername(userId: string, oldUsername: string, newUsername: string): Promise<void> {
    if (!db) throw new Error("Database not initialized.");

    const userDocRef = doc(db, 'users', userId);
    const oldUsernameDocRef = doc(db, 'usernames', oldUsername.toLowerCase());
    const newUsernameDocRef = doc(db, 'usernames', newUsername.toLowerCase());

    await runTransaction(db, async (transaction) => {
        // First, check if the new username is already taken inside the transaction
        const newUsernameSnap = await transaction.get(newUsernameDocRef);
        if (newUsernameSnap.exists()) {
            throw new Error("Username is already taken.");
        }
        
        // Update the user's profile document
        transaction.update(userDocRef, { username: newUsername });
        
        // Create the new username mapping
        transaction.set(newUsernameDocRef, { userId });
        
        // Delete the old username mapping
        transaction.delete(oldUsernameDocRef);
    });
}


export async function logLoginHistory(userId: string) {
  if (!userId || !db) return; // Do not run if db is not initialized

  try {
    const historyCollectionRef = collection(db, 'users', userId, 'loginHistory');

    // Add new login record
    await addDoc(historyCollectionRef, {
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    });

    // Trim old login records to keep only the last 25
    const q = query(historyCollectionRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.size > MAX_LOGIN_HISTORY) {
      const batch = writeBatch(db);
      const docsToDelete = snapshot.docs.slice(MAX_LOGIN_HISTORY);
      docsToDelete.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  } catch (error) {
    console.error("Error logging login history:", error);
    // This is a background task, so we don't show a toast to the user.
  }
}
