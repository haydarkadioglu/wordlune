
import { db, isFirebaseReady } from '@/lib/firebase';
import type { AppUser } from '@/types';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';


export async function isAdmin(user: AppUser | null): Promise<boolean> {
    if (!user || !isFirebaseReady()) {
        console.warn("User not authenticated or Firebase not ready");
        return false;
    }

    console.log("Checking admin status for user:", user.email, "UID:", user.uid);

    try {
        // Method 1: Try to find by UID as document ID
        const adminDocRef = doc(db!, 'admins', user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        
        if (adminDocSnap.exists()) {
            console.log("✅ User is admin (found by UID):", user.email);
            return true;
        }

        // Method 2: Search by email in admins collection
        const adminCollection = collection(db!, 'admins');
        const emailQuery = query(adminCollection, where('email', '==', user.email));
        const querySnapshot = await getDocs(emailQuery);

        console.log("Email search result:", {
            empty: querySnapshot.empty,
            size: querySnapshot.size,
            searchEmail: user.email
        });

        if (!querySnapshot.empty) {
            console.log("✅ User is admin (found by email):", user.email);
            return true;
        }

        // Debug: Let's see what's actually in the admin collection
        const allAdminsQuery = query(adminCollection);
        const allAdminsSnapshot = await getDocs(allAdminsQuery);
        console.log("All admins in collection:");
        allAdminsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log("Admin doc:", {
                id: doc.id,
                email: data.email,
                matches: data.email === user.email
            });
        });

        console.log("❌ User is not admin:", user.email);
        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}
