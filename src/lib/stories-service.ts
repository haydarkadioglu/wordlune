
import { db } from '@/lib/firebase';
import type { Story } from '@/types';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';

/**
 * Fetches all stories and listens for real-time updates.
 * @param callback Function to call with the array of stories.
 * @returns Unsubscribe function.
 */
export function getStories(callback: (stories: Story[]) => void) {
  if (!db) return () => {};

  const storiesCollectionRef = collection(db, 'stories');
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
    if (!db) return null;
    const storyDocRef = doc(db, 'stories', storyId);
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
    if (!db) throw new Error("Database not available.");
    
    if (storyId) {
        // Update existing story
        const storyDocRef = doc(db, 'stories', storyId);
        await updateDoc(storyDocRef, storyData);
    } else {
        // Create new story
        const storiesCollectionRef = collection(db, 'stories');
        await addDoc(storiesCollectionRef, {
            ...storyData,
            createdAt: serverTimestamp()
        });
    }
}


/**
 * Deletes a story from the database.
 * @param storyId The ID of the story to delete.
 */
export async function deleteStory(storyId: string): Promise<void> {
    if (!db) throw new Error("Database not available.");
    const storyDocRef = doc(db, 'stories', storyId);
    await deleteDoc(storyDocRef);
}
