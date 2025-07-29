
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, getDocs, writeBatch, serverTimestamp, doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';

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
 * Retrieves the email address associated with a given username.
 * @param username The username to look up.
 * @returns The user's email address, or null if not found.
 */
export async function getEmailForUsername(username: string): Promise<string | null> {
    if (!db) return null;
    const usernameRef = doc(db, 'usernames', username.toLowerCase());
    const usernameSnap = await getDoc(usernameRef);

    if (!usernameSnap.exists()) {
        return null; // Username does not exist
    }

    const { userId } = usernameSnap.data();
    if (!userId) {
        return null; // Username document is malformed
    }
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        return null; // User profile does not exist for this username
    }
    
    return userSnap.data().email || null;
}


/**
 * Creates the initial user documents in Firestore after registration.
 * Creates a public username mapping, a private user profile document, and a data container.
 * @param userId The user's unique ID from Firebase Auth.
 * @param username The user's chosen unique username.
 * @param displayName The user's display name.
 * @param email The user's email.
 */
export async function createInitialUserDocuments(userId: string, username: string, displayName: string, email: string): Promise<void> {
    if (!db) throw new Error("Database not initialized.");
    
    const userDocRef = doc(db, 'users', userId);
    const usernameDocRef = doc(db, 'usernames', username.toLowerCase());
    const dataDocRef = doc(db, 'data', userId);
    
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
    
    // Create the data container document for the user
    batch.set(dataDocRef, {
      createdAt: serverTimestamp()
    });
    
    await batch.commit();
}

/**
 * Updates a user's username across the necessary documents.
 * This is a transactional operation to ensure data consistency.
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
            throw new Error("This username is already taken.");
        }
        
        // Update the user's profile document with the new username
        transaction.update(userDocRef, { username: newUsername });
        
        // Create the new username mapping document
        transaction.set(newUsernameDocRef, { userId });
        
        // Delete the old username mapping document
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

// --- User Moderation ---

/**
 * Bans a user from creating/editing stories.
 * @param userId The ID of the user to ban.
 * @param duration Can be 'week' or 'permanent'.
 */
export async function banUser(userId: string, duration: 'week' | 'permanent'): Promise<void> {
    if (!db) throw new Error("Database not available.");
    
    const banDocRef = doc(db, 'user_bans', userId);
    let bannedUntil = null;
    let isPermanent = false;
    
    if (duration === 'permanent') {
        isPermanent = true;
    } else { // 'week'
        const banEndDate = new Date();
        banEndDate.setDate(banEndDate.getDate() + 7);
        bannedUntil = banEndDate;
    }

    await setDoc(banDocRef, { isPermanent, bannedUntil, bannedAt: serverTimestamp() });
}

/**
 * Lifts a ban for a user.
 * @param userId The ID of the user to unban.
 */
export async function unbanUser(userId: string): Promise<void> {
    if (!db) throw new Error("Database not available.");
    const banDocRef = doc(db, 'user_bans', userId);
    await runTransaction(db, async (transaction) => {
        const banDoc = await transaction.get(banDocRef);
        if (banDoc.exists()) {
            transaction.delete(banDocRef);
        }
    });
}


/**
 * Gets the ban status for a user.
 * @param userId The ID of the user to check.
 * @returns An object with `isBanned` and a `message`, or null if not banned.
 */
export async function getUserBanStatus(userId: string): Promise<{ isBanned: boolean; message: string; } | null> {
    if (!db) return null;
    const banDocRef = doc(db, 'user_bans', userId);
    const banDoc = await getDoc(banDocRef);

    if (!banDoc.exists()) {
        return null;
    }
    
    const data = banDoc.data();
    if (data.isPermanent) {
        return { isBanned: true, message: 'You are permanently banned from posting stories.' };
    }
    
    if (data.bannedUntil) {
        const bannedUntilDate = data.bannedUntil.toDate();
        if (bannedUntilDate > new Date()) {
            return { isBanned: true, message: `You are banned from posting stories until ${bannedUntilDate.toLocaleDateString()}.` };
        } else {
            // Ban has expired, we can remove it.
            await unbanUser(userId);
            return null;
        }
    }
    
    return null;
}
