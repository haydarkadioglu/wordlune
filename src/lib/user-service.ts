import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';

const MAX_LOGIN_HISTORY = 25;

export async function logLoginHistory(userId: string) {
  if (!userId) return;

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
      console.log(`Trimmed ${docsToDelete.length} old login history entries.`);
    }
  } catch (error) {
    console.error("Error logging login history:", error);
    // This is a background task, so we don't show a toast to the user.
  }
}
