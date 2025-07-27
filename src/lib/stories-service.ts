
import { db } from '@/lib/firebase';
import type { Story } from '@/types';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';

/**
 * Fetches all stories for a specific language and listens for real-time updates.
 * @param language The language of the stories to fetch.
 * @param callback Function to call with the array of stories.
 * @returns Unsubscribe function.
 */
export function getStories(language: string, callback: (stories: Story[]) => void) {
  if (!db || !language) {
      callback([]);
      return () => {};
  }

  const storiesCollectionRef = collection(db, 'stories', language, 'stories');
  const q = query(storiesCollectionRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const stories: Story[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stories.push({ 
        id: doc.id,
        ...data,
        language,
        createdAt: data.createdAt?.toMillis() || Date.now() 
      } as Story);
    });
    callback(stories);
  }, (error) => {
    console.error(`Error fetching stories for ${language}: `, error);
    callback([]);
  });

  return unsubscribe;
}


/**
 * Fetches a single story by its ID and language.
 * @param language The language of the story.
 * @param storyId The ID of the story to fetch.
 * @returns The story object or null if not found.
 */
export async function getStoryById(language: string, storyId: string): Promise<Story | null> {
    if (!db || !language) return null;
    const storyDocRef = doc(db, 'stories', language, 'stories', storyId);
    const docSnap = await getDoc(storyDocRef);
    if(docSnap.exists()){
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            language,
            createdAt: data.createdAt?.toMillis() || Date.now()
        } as Story
    }
    return null;
}


/**
 * Creates a new story or updates an existing one.
 * The language is a key part of the path now.
 * @param storyData The data for the story, including the language.
 * @param storyId The ID of the story to update (optional).
 */
export async function upsertStory(
    storyData: Omit<Story, 'id' | 'createdAt'>, 
    storyId?: string
): Promise<void> {
    if (!db) throw new Error("Database not available.");
    
    const { language, ...dataToSave } = storyData;
    if (!language) throw new Error("Story language must be provided.");

    const storiesCollectionRef = collection(db, 'stories', language, 'stories');
    
    if (storyId) {
        // Update existing story
        const storyDocRef = doc(storiesCollectionRef, storyId);
        await updateDoc(storyDocRef, dataToSave);
    } else {
        // Create new story
        await addDoc(storiesCollectionRef, {
            ...dataToSave,
            createdAt: serverTimestamp()
        });
    }
}


/**
 * Deletes a story from the database.
 * @param language The language of the story.
 * @param storyId The ID of the story to delete.
 */
export async function deleteStory(language: string, storyId: string): Promise<void> {
    if (!db) throw new Error("Database not available.");
    if (!language) throw new Error("Story language must be provided for deletion.");
    const storyDocRef = doc(db, 'stories', language, 'stories', storyId);
    await deleteDoc(storyDocRef);
}
