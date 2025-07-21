
import { db } from '@/lib/firebase';
import type { AppUser } from '@/types';
import { doc, getDoc } from 'firebase/firestore';


export async function isAdmin(user: AppUser | null): Promise<boolean> {
    if (!user || !db) return false;

    try {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists()) {
            // Optional: also check if the email matches for extra security
            // const data = adminDocSnap.data();
            // return data.email === user.email;
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}
