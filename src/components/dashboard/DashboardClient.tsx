
"use client";
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Word, WordCategory, ProcessedWord } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, Filter, XCircle, Loader2, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import AddWordDialog from '@/components/words/AddWordDialog';
import WordList from '@/components/words/WordList';
import WordTable from '@/components/words/WordTable';
import StatsDisplay from './StatsDisplay';
import WeeklyWordsChart from './WeeklyWordsChart';
import QuickTranslator from './QuickTranslator';
import BulkAddWords from './BulkAddWords';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function DashboardClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [words, setWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [preFilledWord, setPreFilledWord] = useState<Partial<Word> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<WordCategory | 'All'>('All');

  useEffect(() => {
    if (!db) {
        setLoadingWords(false);
        return;
    }
    if (user && user.uid) {
      setLoadingWords(true);
      const wordsCollectionRef = collection(db, 'users', user.uid, 'words');
      const q = query(wordsCollectionRef, orderBy('createdAt', 'desc'));

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

  const handleSaveWord = async (newWordData: Omit<Word, 'id' | 'createdAt'>, id?: string) => {
    if (!user || !user.uid || !db) {
      toast({ title: "Error", description: "You must be logged in to save words.", variant: "destructive" });
      return;
    }

    try {
      const wordsCollectionRef = collection(db, 'users', user.uid, 'words');
      if (id) { 
        const wordDocRef = doc(db, 'users', user.uid, 'words', id);
        await updateDoc(wordDocRef, { ...newWordData });
        toast({ title: "Word Updated", description: `"${newWordData.text}" has been updated.`});
      } else { 
        const wordWithMeta = { ...newWordData, createdAt: Date.now() };
        await addDoc(wordsCollectionRef, wordWithMeta);
        toast({ title: "Word Added", description: `"${newWordData.text}" has been added to your list.`});
      }
      setEditingWord(null);
      setPreFilledWord(null);
    } catch (error: any) {
        console.error("Error saving word: ", error);
        toast({ title: "Error saving word", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkSaveWords = async (processedWords: Omit<ProcessedWord, 'id' | 'createdAt' | 'category'>[]) => {
    if (!user || !user.uid || !db) {
      toast({ title: "Error", description: "You must be logged in to save words.", variant: "destructive" });
      return;
    }

    const batch = writeBatch(db);
    const wordsCollectionRef = collection(db, 'users', user.uid, 'words');

    processedWords.forEach(word => {
        const newWordRef = doc(wordsCollectionRef); // Create a new doc with a unique ID
        const wordToSave: Omit<Word, 'id'> = {
            ...word,
            category: 'Good', // Default category for bulk added words
            createdAt: Date.now(),
            pronunciationText: '', // This can be added later if needed
        };
        batch.set(newWordRef, wordToSave);
    });

    try {
        await batch.commit();
    } catch (error: any) {
        console.error("Error bulk saving words: ", error);
        toast({ title: "Error saving words", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!user || !user.uid || !db) {
        toast({ title: "Error", description: "You must be logged in to delete words.", variant: "destructive" });
        return;
    }
    const wordToDelete = words.find(w => w.id === id);
    try {
        const wordDocRef = doc(db, 'users', user.uid, 'words', id);
        await deleteDoc(wordDocRef);
        if (wordToDelete) {
          toast({ title: "Word Deleted", description: `"${wordToDelete.text}" has been removed.`, variant: "destructive" });
        }
    } catch (error: any) {
        console.error("Error deleting word: ", error);
        toast({ title: "Error deleting word", description: error.message, variant: "destructive" });
    }
  };
  
  const handleEditWord = (word: Word) => {
    setEditingWord(word);
    setPreFilledWord(null);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingWord(null);
    setPreFilledWord(null);
    setIsDialogOpen(true);
  };

  const handleAddFromTranslator = useCallback((word: string, meaning: string) => {
    setPreFilledWord({ text: word, meaning: meaning });
    setEditingWord(null);
    setIsDialogOpen(true);
  }, []);

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const matchesSearchTerm = word.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (word.meaning && word.meaning.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (word.exampleSentence && word.exampleSentence.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'All' || word.category === categoryFilter;
      return matchesSearchTerm && matchesCategory;
    });
  }, [words, searchTerm, categoryFilter]);
  
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
  };
  
  const renderWordContent = (view: 'list' | 'table') => {
     if (loadingWords) { 
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading your words...</p>
            </div>
        );
    }
    if (view === 'list') {
      return <WordList words={filteredWords} onDeleteWord={handleDeleteWord} onEditWord={handleEditWord} />;
    }
    return <WordTable words={filteredWords} />;
  }

  if (!db) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured</AlertTitle>
            <AlertDescription>
                The connection to the database failed. This is likely due to missing or invalid Firebase credentials. Please check the console for more details and configure your .env file.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <StatsDisplay words={words} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <QuickTranslator onAddWord={handleAddFromTranslator} />
        <BulkAddWords onBulkSave={handleBulkSaveWords} />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="font-headline text-2xl text-primary">Your Words</CardTitle>
                    <CardDescription>View, search, and manage your saved words.</CardDescription>
                </div>
                <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" disabled={!user}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Word
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="card-view" className="w-full">
                <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card-foreground/5 items-center">
                    <div className="flex-grow relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search words, meanings, or examples..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            disabled={!user || loadingWords}
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
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
                            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-primary p-2" disabled={!user || loadingWords}>
                                <XCircle className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                    <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                        <TabsTrigger value="card-view"><LayoutGrid className="mr-2 h-4 w-4" />Cards</TabsTrigger>
                        <TabsTrigger value="table-view"><List className="mr-2 h-4 w-4" />Table</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="card-view">
                  {renderWordContent('list')}
                </TabsContent>
                <TabsContent value="table-view">
                  {renderWordContent('table')}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
      
      <WeeklyWordsChart words={words} />

      <AddWordDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSaveWord={handleSaveWord}
        editingWord={editingWord}
        preFilledWord={preFilledWord}
      />
    </div>
  );
}
