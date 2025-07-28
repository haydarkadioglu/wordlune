
import { db, isFirebaseReady } from '@/lib/firebase';
import type { AppUser } from '@/types';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';


export async function isAdmin(user: AppUser | null): Promise<boolean> {
    if (!user || !isFirebaseReady()) {
        return false;
    }

    try {
        const adminDocRef = doc(db!, 'admins', user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        
        if (adminDocSnap.exists()) {
            // Optional: You could also check if adminDocSnap.data().email === user.email
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        // If rules deny access, it will throw an error. We should treat it as "not an admin".
        return false;
    }
}
