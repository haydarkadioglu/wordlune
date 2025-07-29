
import { db, isFirebaseReady } from '@/lib/firebase';
import type { Story } from '@/types';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, where, writeBatch, setDoc } from 'firebase/firestore';

/**
 * Fetches all PUBLISHED stories for a specific language and listens for real-time updates.
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
  const q = query(storiesCollectionRef, where("isPublished", "==", true), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const stories: Story[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stories.push({ 
        id: doc.id,
        ...data,
        language,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
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
 * Fetches all stories by a specific author.
 * @param authorId The ID of the author.
 * @param callback Function to call with the array of stories.
 * @returns Unsubscribe function.
 */
export function getStoriesByAuthor(authorId: string, callback: (stories: Story[]) => void) {
    if (!db || !authorId) {
        callback([]);
        return () => {};
    }

    const storiesQuery = query(
        collection(db, 'stories_by_author', authorId, 'stories'),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(storiesQuery, (querySnapshot) => {
        const stories: Story[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            stories.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toMillis() || Date.now(),
                updatedAt: data.updatedAt?.toMillis() || Date.now(),
            } as Story);
        });
        callback(stories);
    }, (error) => {
        console.error(`Error fetching stories for author ${authorId}: `, error);
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
    // This function can be used by anyone, so we fetch from the public collection
    const storyDocRef = doc(db, 'stories', language, 'stories', storyId);
    const docSnap = await getDoc(storyDocRef);
    if(docSnap.exists()){
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            language,
            createdAt: data.createdAt?.toMillis() || Date.now(),
            updatedAt: data.updatedAt?.toMillis() || Date.now()
        } as Story
    }
    return null;
}

/**
 * ADMIN ONLY: Creates a new story or updates an existing one.
 * Bypasses user-specific collections, intended for admin panel use.
 * @param storyData The data for the story, including language.
 * @param storyId The ID of the story to update (optional).
 */
export async function upsertStory(storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>, storyId?: string): Promise<void> {
    if (!db) throw new Error("Database not available.");
    
    const { language, ...dataToSave } = storyData;
    if (!language) throw new Error("Story language must be provided.");

    const publicStoryCollectionRef = collection(db, 'stories', language, 'stories');
    
    if (storyId) {
        // Update existing story
        const storyDocRef = doc(publicStoryCollectionRef, storyId);
        await updateDoc(storyDocRef, { ...dataToSave, updatedAt: serverTimestamp() });
    } else {
        // Create new story
        await addDoc(publicStoryCollectionRef, { 
            ...dataToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
}


/**
 * Creates a new story or updates an existing one for a specific user.
 * Writes to both public and user-specific collections.
 * @param userId The ID of the user creating/updating the story.
 * @param storyData The data for the story.
 * @param storyId The ID of the story to update (optional).
 */
export async function upsertUserStory(
    userId: string,
    storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'likeCount' | 'commentCount'>,
    storyId?: string
): Promise<void> {
    if (!isFirebaseReady() || !userId) {
        throw new Error("Firebase not ready or user not authenticated.");
    }
    
    const { language, ...dataToSave } = storyData;
    if (!language) throw new Error("Story language must be provided.");

    const publicStoryCollectionRef = collection(db, 'stories', language, 'stories');
    const authorStoryCollectionRef = collection(db, 'stories_by_author', userId, 'stories');
    
    const batch = writeBatch(db);

    if (storyId) {
        // Update existing story
        const publicStoryDocRef = doc(publicStoryCollectionRef, storyId);
        const authorStoryDocRef = doc(authorStoryCollectionRef, storyId);
        const updatePayload = { ...dataToSave, updatedAt: serverTimestamp() };
        
        batch.update(publicStoryDocRef, updatePayload);
        batch.update(authorStoryDocRef, updatePayload);

    } else {
        // Create new story
        const newStoryPayload = {
            ...dataToSave,
            authorId: userId,
            likeCount: 0,
            commentCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        const newPublicDocRef = doc(publicStoryCollectionRef); // Create a reference with a new ID
        const authorStoryDocRef = doc(authorStoryCollectionRef, newPublicDocRef.id);
        
        batch.set(newPublicDocRef, newStoryPayload);
        batch.set(authorStoryDocRef, newStoryPayload);
    }

    await batch.commit();
}

/**
 * ADMIN ONLY: Deletes a story from all locations.
 * @param story The full story object to delete.
 */
export async function deleteStory(story: Story): Promise<void> {
    if (!db) throw new Error("Database not available.");
    if (!story || !story.id || !story.language || !story.authorId) {
        throw new Error("Complete story object with id, language, and authorId is required.");
    }

    const batch = writeBatch(db);
    
    // Reference to the public story document
    const publicStoryDocRef = doc(db, 'stories', story.language, 'stories', story.id);
    batch.delete(publicStoryDocRef);
    
    // Reference to the author's story document (if it exists)
    const authorStoryDocRef = doc(db, 'stories_by_author', story.authorId, 'stories', story.id);
    batch.delete(authorStoryDocRef);
    
    await batch.commit();
}


/**
 * Deletes a user's story from all relevant locations.
 * @param userId The ID of the user who owns the story.
 * @param story The story object to delete.
 */
export async function deleteUserStory(userId: string, story: Story): Promise<void> {
    if (!db) throw new Error("Database not available.");
    if (!userId || !story || !story.language || !story.id) throw new Error("User or story information is missing.");

    if (userId !== story.authorId) {
        throw new Error("You can only delete your own stories.");
    }
    
    // Uses the generic deleteStory function which handles deletion from all locations.
    await deleteStory(story);
}
