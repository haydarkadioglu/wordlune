
import { db, isFirebaseReady } from '@/lib/firebase';
import type { Story } from '@/types';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';

/**
 * Fetches all stories and listens for real-time updates.
 * @param callback Function to call with the array of stories.
 * @returns Unsubscribe function.
 */
export function getStories(callback: (stories: Story[]) => void) {
  if (!isFirebaseReady()) {
    console.warn("Firebase not ready for getStories");
    return () => {};
  }

  const storiesCollectionRef = collection(db!, 'stories');
  const q = query(storiesCollectionRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const stories: Story[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stories.push({ 
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now() 
      } as Story);
    });
    callback(stories);
  }, (error) => {
    console.error("Error fetching stories: ", error);
  });

  return unsubscribe;
}


/**
 * Fetches a single story by its ID.
 * @param storyId The ID of the story to fetch.
 * @returns The story object or null if not found.
 */
export async function getStoryById(storyId: string): Promise<Story | null> {
    if (!isFirebaseReady()) {
        console.warn("Firebase not ready for getStoryById");
        return null;
    }
    
    try {
        const storyDocRef = doc(db!, 'stories', storyId);
        const docSnap = await getDoc(storyDocRef);
        if(docSnap.exists()){
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toMillis() || Date.now()
            } as Story
        }
        return null;
    } catch (error) {
        console.error("Error fetching story by ID:", error);
        return null;
    }
}


/**
 * Creates a new story or updates an existing one.
 * @param storyData The data for the story.
 * @param storyId The ID of the story to update (optional).
 */
export async function upsertStory(
    storyData: Omit<Story, 'id' | 'createdAt'>, 
    storyId?: string
): Promise<void> {
    if (!isFirebaseReady()) {
        throw new Error("Firebase not ready.");
    }
    
    try {
        if (storyId) {
            // Update existing story
            const storyDocRef = doc(db!, 'stories', storyId);
            await updateDoc(storyDocRef, storyData);
        } else {
            // Create new story
            const storiesCollectionRef = collection(db!, 'stories');
            await addDoc(storiesCollectionRef, {
                ...storyData,
                createdAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error upserting story:", error);
        throw error;
    }
}


/**
 * Deletes a story from the database.
 * @param storyId The ID of the story to delete.
 */
export async function deleteStory(storyId: string): Promise<void> {
    if (!isFirebaseReady()) {
        throw new Error("Firebase not ready.");
    }
    
    try {
        const storyDocRef = doc(db!, 'stories', storyId);
        await deleteDoc(storyDocRef);
    } catch (error) {
        console.error("Error deleting story:", error);
        throw error;
    }
}
