
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, getDocs, writeBatch, serverTimestamp, doc, getDoc, runTransaction, setDoc, Timestamp, where, limit } from 'firebase/firestore';

const MAX_LOGIN_HISTORY = 25;

/**
 * Creates the initial user documents in Firestore after registration.
 * @param userId The user's unique ID from Firebase Auth.
 * @param displayName The user's display name.
 * @param email The user's email.
 */
export async function createInitialUserDocuments(userId: string, displayName: string, email: string): Promise<void> {
    if (!db) throw new Error("Database not initialized.");
    
    const userDocRef = doc(db, 'users', userId);
    const dataDocRef = doc(db, 'data', userId);
    
    try {
        await runTransaction(db, async (transaction) => {
            // Create user profile
            transaction.set(userDocRef, {
                uid: userId,
                displayName: displayName,
                email: email,
                createdAt: serverTimestamp()
            });
            
            // Create data container
            transaction.set(dataDocRef, {
                createdAt: serverTimestamp()
            });
        });
    } catch (error) {
        console.error("Failed to create user documents:", error);
        throw error;
    }
}

/**
 * Logs a user's login attempt to their login history.
 * @param userId The user's ID.
 */
export async function logLoginHistory(userId: string): Promise<void> {
    if (!db) return;
    
    try {
        const loginHistoryCollection = collection(db, 'data', userId, 'loginHistory');
        
        // Add new login record
        await addDoc(loginHistoryCollection, {
            timestamp: serverTimestamp(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
        });
        
        // Clean up old records (keep only MAX_LOGIN_HISTORY)
        const loginHistoryQuery = query(loginHistoryCollection, orderBy('timestamp', 'desc'));
        const loginHistorySnapshot = await getDocs(loginHistoryQuery);
        
        if (loginHistorySnapshot.size > MAX_LOGIN_HISTORY) {
            const batch = writeBatch(db);
            const docsToDelete = loginHistorySnapshot.docs.slice(MAX_LOGIN_HISTORY);
            
            docsToDelete.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
        }
    } catch (error) {
        console.error("Failed to log login history:", error);
        // Don't throw error for login history, it's not critical
    }
}


/**
 * Bans a user for a specified duration.
 * @param userId The ID of the user to ban.
 * @param duration The duration of the ban ('week' or 'permanent').
 */
export async function banUser(userId: string, duration: 'week' | 'permanent'): Promise<void> {
    if (!db) {
        throw new Error("Database not initialized.");
    }
    
    const banDocRef = doc(db, 'users', userId, 'moderation', 'ban');

    let bannedUntil: Timestamp | null = null;
    const isPermanent = duration === 'permanent';

    if (duration === 'week') {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        bannedUntil = Timestamp.fromDate(oneWeekFromNow);
    }
    
    const banData = {
        isPermanent,
        bannedUntil,
        bannedAt: serverTimestamp(),
    };

    try {
        await setDoc(banDocRef, banData);
    } catch (error) {
        console.error(`Failed to ban user ${userId}:`, error);
        throw new Error("Could not apply ban to the user.");
    }
}

/**
 * Gets user's email by their username/displayName.
 * This function searches through the users collection to find a user by their displayName.
 * @param username The username/displayName to search for.
 * @returns The user's email if found, null otherwise.
 */
export async function getEmailForUsername(username: string): Promise<string | null> {
    if (!db) return null;
    
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('displayName', '==', username), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            return userData.email || null;
        }
        
        return null;
    } catch (error) {
        console.error('Error finding email for username:', error);
        return null;
    }
}
