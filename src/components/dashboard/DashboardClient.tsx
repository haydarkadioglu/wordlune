
"use client";
import { useState, useMemo, useEffect } from 'react';
import type { Word, WordCategory } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, Filter, XCircle, Loader2 } from 'lucide-react';
import AddWordDialog from '@/components/words/AddWordDialog';
import WordList from '@/components/words/WordList';
import StatsDisplay from './StatsDisplay';
import WeeklyWordsChart from './WeeklyWordsChart';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [words, setWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<WordCategory | 'All'>('All');

  useEffect(() => {
    if (user && user.uid) {
      setLoadingWords(true);
      const wordsCollectionRef = collection(db, 'words');
      const q = query(wordsCollectionRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedWords: Word[] = [];
        querySnapshot.forEach((doc) => {
          fetchedWords.push({ id: doc.id, ...doc.data() } as Word);
        });
        setWords(fetchedWords);
        setLoadingWords(false);
      }, (error) => {
        console.error("Error fetching words: ", error);
        toast({ title: "Error fetching words", description: error.message, variant: "destructive" });
        setLoadingWords(false);
      });

      return () => unsubscribe(); 
    } else {
      setWords([]); 
      setLoadingWords(false);
    }
  }, [user, toast]);

  const handleSaveWord = async (newWordData: Omit<Word, 'id' | 'userId' | 'createdAt'>, id?: string) => {
    if (!user || !user.uid) {
      toast({ title: "Error", description: "You must be logged in to save words.", variant: "destructive" });
      return;
    }

    // setLoadingWords(true); // Let onSnapshot handle visual updates
    try {
      if (id) { 
        const wordDocRef = doc(db, 'words', id);
        await updateDoc(wordDocRef, {
          ...newWordData,
          // userId remains the same, createdAt is not updated here unless explicitly part of newWordData
        });
        toast({ title: "Word Updated", description: `"${newWordData.text}" has been updated.`});
      } else { 
        const wordWithMeta = {
          ...newWordData,
          userId: user.uid,
          createdAt: Date.now(),
        };
        await addDoc(collection(db, 'words'), wordWithMeta);
        toast({ title: "Word Added", description: `"${newWordData.text}" has been added to your list.`});
      }
      setEditingWord(null);
    } catch (error: any) {
        console.error("Error saving word: ", error);
        toast({ title: "Error saving word", description: error.message, variant: "destructive" });
    } finally {
        // setLoadingWords(false); // Let onSnapshot handle visual updates
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!user || !user.uid) {
        toast({ title: "Error", description: "You must be logged in to delete words.", variant: "destructive" });
        return;
    }
    const wordToDelete = words.find(w => w.id === id);
    // setLoadingWords(true); // Let onSnapshot handle visual updates
    try {
        const wordDocRef = doc(db, 'words', id);
        await deleteDoc(wordDocRef);
        if (wordToDelete) {
          toast({ title: "Word Deleted", description: `"${wordToDelete.text}" has been removed.`, variant: "destructive" });
        }
    } catch (error: any) {
        console.error("Error deleting word: ", error);
        toast({ title: "Error deleting word", description: error.message, variant: "destructive" });
    } finally {
        // setLoadingWords(false); // Let onSnapshot handle visual updates
    }
  };
  
  const handleEditWord = (word: Word) => {
    setEditingWord(word);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingWord(null);
    setIsDialogOpen(true);
  };

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const matchesSearchTerm = word.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (word.exampleSentence && word.exampleSentence.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'All' || word.category === categoryFilter;
      return matchesSearchTerm && matchesCategory;
    });
  }, [words, searchTerm, categoryFilter]);
  
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
  };
  
  const renderWordList = () => {
    if (loadingWords && !user) { 
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="shadow-lg">
                        <CardHeader className="pb-3">
                            <Skeleton className="h-6 w-3/4 bg-primary/20" />
                            <Skeleton className="h-4 w-1/4 mt-1 bg-primary/10" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-5 w-1/2 mb-3 bg-primary/10" />
                            <Skeleton className="h-8 w-full bg-primary/10" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }
     if (loadingWords && user) { 
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading your words...</p>
            </div>
        );
    }
    return <WordList words={filteredWords} onDeleteWord={handleDeleteWord} onEditWord={handleEditWord} />;
  }


  return (
    <div className="space-y-8">
      <StatsDisplay words={words} />
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="font-headline text-2xl text-primary">Your Words</CardTitle>
            <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" disabled={!user}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Word
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card-foreground/5">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search words or examples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={!user || loadingWords}
              />
            </div>
            <div className="flex-grow sm:flex-grow-0 sm:w-48 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Select
                    value={categoryFilter}
                    onValueChange={(value) => setCategoryFilter(value as WordCategory | 'All')}
                    disabled={!user || loadingWords}
                >
                    <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="Very Good">Very Good</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Bad">Bad</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {(searchTerm || categoryFilter !== 'All') && (
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-primary" disabled={!user || loadingWords}>
                    <XCircle className="mr-2 h-4 w-4" /> Clear
                </Button>
            )}
          </div>
          {renderWordList()}
        </CardContent>
      </Card>

      <WeeklyWordsChart words={words} />

      <AddWordDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSaveWord={handleSaveWord}
        editingWord={editingWord}
      />
    </div>
  );
}
