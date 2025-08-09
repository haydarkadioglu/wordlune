
import { db, isFirebaseReady } from '@/lib/firebase';
import type { Story } from '@/types';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, where, writeBatch, collectionGroup } from 'firebase/firestore';

/**
 * ADMIN ONLY: Fetches all stories for a specific language (published and drafts) and listens for real-time updates.
 * This is used for the main admin story management page.
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
  // Query for all stories, ordered by creation date. Admin needs to see everything.
  const q = query(storiesCollectionRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const stories: Story[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stories.push({ 
        id: doc.id,
        ...data,
        language,
        createdAt: data.createdAt, // Keep as Timestamp
        updatedAt: data.updatedAt, // Keep as Timestamp
      } as Story);
    });
    callback(stories);
  }, (error) => {
    console.error(`Error fetching all stories for admin in ${language}: `, error);
    callback([]);
  });

  return unsubscribe;
}


/**
 * PUBLIC: Fetches all PUBLISHED stories for a specific language and listens for real-time updates.
 * This is used for the main stories page where only published content should be visible.
 * @param language The language of the stories to fetch.
 * @param callback Function to call with the array of stories.
 * @returns Unsubscribe function.
 */
export function getPublishedStories(language: string, callback: (stories: Story[]) => void) {
  if (!db || !language) {
      console.warn(`Cannot fetch stories: db=${!!db}, language=${language}`);
      callback([]);
      return () => {};
  }

  try {
    const storiesCollectionRef = collection(db, 'stories', language, 'stories');
    // Query ONLY for published stories, ordered by creation date.
    const q = query(storiesCollectionRef, where("isPublished", "==", true), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const stories: Story[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stories.push({ 
          id: doc.id,
          ...data,
          language,
          createdAt: data.createdAt, // Keep as Timestamp
          updatedAt: data.updatedAt, // Keep as Timestamp
        } as Story);
      });
      callback(stories);
    }, (error) => {
      console.error(`Error fetching published stories for ${language}: `, error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error(`Error setting up published stories listener for ${language}: `, error);
    callback([]);
    return () => {};
  }
}


/**
 * Fetches all published stories from non-admin users across all languages for moderation.
 * @param callback Function to call with the array of stories.
 * @returns Unsubscribe function for real-time updates.
 */
export function getAllPublishedUserStories(callback: (stories: Story[]) => void) {
    if (!db) {
        callback([]);
        return () => {};
    }

    const storiesCollectionGroup = collectionGroup(db, 'stories');
    const q = query(
        storiesCollectionGroup,
        where("isPublished", "==", true),
        where("authorId", "!=", "admin"),
        orderBy("authorId"), 
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const stories: Story[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // The parent of a subcollection doc is the document containing it.
            // The parent of that document is the collection containing it.
            // So doc.ref.parent.parent.id should be the language.
            const language = doc.ref.parent.parent?.id; 
            if (language) {
                stories.push({
                    id: doc.id,
                    ...data,
                    language, 
                    createdAt: data.createdAt, // Keep as Timestamp
                    updatedAt: data.updatedAt, // Keep as Timestamp
                } as Story);
            }
        });
        callback(stories);
    }, (error) => {
        console.error("Error fetching all user stories: ", error);
        callback([]);
    });

    return unsubscribe;
}


/**
 * Fetches all stories (published and drafts) by a specific author. Used for the profile page.
 * This uses a collectionGroup query to reliably get all stories across all language collections.
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
        collectionGroup(db, 'stories'),
        where('authorId', '==', authorId),
        orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(storiesQuery, (querySnapshot) => {
        const stories: Story[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const language = doc.ref.parent.parent?.id;
            if (language) {
                 stories.push({
                    id: doc.id,
                    ...data,
                    language: language,
                    createdAt: data.createdAt, // Keep as Firestore Timestamp
                    updatedAt: data.updatedAt, // Keep as Firestore Timestamp
                } as Story);
            }
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
    const storyDocRef = doc(db, 'stories', language, 'stories', storyId);
    const docSnap = await getDoc(storyDocRef);
    if(docSnap.exists()){
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            language,
            createdAt: data.createdAt, // Keep as Timestamp
            updatedAt: data.updatedAt, // Keep as Timestamp
        } as Story
    }
    return null;
}

/**
 * ADMIN ONLY: Creates a new story or updates an existing one.
 * @param storyData The data for the story, including language.
 * @param storyId The ID of the story to update (optional).
 */
export async function upsertStory(
    storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>,
    storyId?: string
): Promise<void> {
    if (!db) throw new Error("Database not available.");
    
    const { language, ...dataToSave } = storyData;
    if (!language) throw new Error("Story language must be provided.");

    const publicStoryCollectionRef = collection(db, 'stories', language, 'stories');
    
    if (storyId) {
        const storyDocRef = doc(publicStoryCollectionRef, storyId);
        await updateDoc(storyDocRef, { ...dataToSave, updatedAt: serverTimestamp() });
    } else {
        const newStoryPayload = {
            ...dataToSave,
            authorId: 'admin',
            authorName: 'WordLune Team',
            authorPhotoURL: '',
            isPublished: true, 
            likeCount: 0,
            commentCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await addDoc(publicStoryCollectionRef, newStoryPayload);
    }
}


/**
 * Creates a new story or updates an existing one for a specific user.
 * @param userId The ID of the user creating/updating the story.
 * @param storyData The data for the story.
 * @param storyId The ID of the story to update (optional).
 */
export async function upsertUserStory(
    userId: string,
    storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'likeCount' | 'commentCount'>,
    storyId?: string
): Promise<void> {
    if (!isFirebaseReady() || !userId || !db) {
        throw new Error("Firebase not ready or user not authenticated.");
    }
    
    const { language, ...dataToSave } = storyData;
    if (!language) throw new Error("Story language must be provided.");

    const publicStoryCollectionRef = collection(db, 'stories', language, 'stories');
    
    const batch = writeBatch(db);

    if (storyId) {
        const publicStoryDocRef = doc(publicStoryCollectionRef, storyId);
        const updatePayload = { ...dataToSave, updatedAt: serverTimestamp() };
        
        batch.update(publicStoryDocRef, updatePayload);

    } else {
        const newStoryPayload = {
            ...dataToSave,
            authorId: userId,
            likeCount: 0,
            commentCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        const newPublicDocRef = doc(publicStoryCollectionRef);
        
        batch.set(newPublicDocRef, newStoryPayload);
    }

    await batch.commit();
}

/**
 * ADMIN or AUTHOR: Deletes a story from all locations.
 * @param story The full story object to delete.
 */
export async function deleteStory(story: Story): Promise<void> {
    if (!db) throw new Error("Database not available.");
    if (!story || !story.id || !story.language || !story.authorId) {
        throw new Error("Complete story object with id, language, and authorId is required.");
    }

    const batch = writeBatch(db);
    
    const publicStoryDocRef = doc(db, 'stories', story.language, 'stories', story.id);
    batch.delete(publicStoryDocRef);
    
    await batch.commit();
}


/**
 * Deletes a user's story from all relevant locations.
 * @param userId The ID of the user who owns the story.
 * @param story The story object to delete.
 */
export async function deleteUserStory(userId: string, story: Story): Promise<void> {
    if (!userId || !story || !story.language || !story.id) throw new Error("User or story information is missing.");

    if (userId !== story.authorId) {
        throw new Error("You can only delete your own stories.");
    }
    
    await deleteStory(story);
}
