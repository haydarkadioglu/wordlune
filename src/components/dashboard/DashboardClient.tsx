
"use client";
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Word, WordCategory, ProcessedWord, UserList, ListWord } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Search, Filter, XCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import AddWordDialog from '@/components/words/AddWordDialog';
import WordList from '@/components/words/WordList';
import StatsDisplay from './StatsDisplay';
import WeeklyWordsChart from './WeeklyWordsChart';
import QuickTranslator from './QuickTranslator';
import BulkAddWords from './BulkAddWords';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useSettings } from '@/hooks/useSettings';
import { getLists, getAllWordsFromLists } from '@/lib/list-service';
import ListsShortcut from './ListsShortcut';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const translations = {
  en: {
    loadingWords: 'Loading your words...',
    firebaseNotConfigured: 'Firebase Not Configured',
    firebaseNotConfiguredDesc: 'The connection to the database failed. This is likely due to missing or invalid Firebase credentials. Please check the console for more details and configure your .env file.',
    yourWords: 'Your Words',
    yourWordsDesc: 'View, search, and manage your saved words.',
    addNewWord: 'Add New Word',
    searchPlaceholder: 'Search words...',
    filterByCategory: 'Filter by category',
    allCategories: 'All Categories',
    viewAll: 'View All',
  },
  tr: {
    loadingWords: 'Kelimeleriniz yükleniyor...',
    firebaseNotConfigured: 'Firebase Yapılandırılmamış',
    firebaseNotConfiguredDesc: 'Veritabanı bağlantısı başarısız oldu. Bu durum, büyük olasılıkla eksik veya geçersiz Firebase kimlik bilgilerinden kaynaklanmaktadır. Lütfen daha fazla ayrıntı için konsolu kontrol edin ve .env dosyanızı yapılandırın.',
    yourWords: 'Kelimeleriniz',
    yourWordsDesc: 'Kaydedilen kelimelerinizi görüntüleyin, arayın ve yönetin.',
    addNewWord: 'Yeni Kelime Ekle',
    searchPlaceholder: 'Kelime ara...',
    filterByCategory: 'Kategoriye göre filtrele',
    allCategories: 'Tüm Kategoriler',
    viewAll: 'Hepsini Gör',
  }
};

const WORDS_TO_SHOW_ON_DASHBOARD = 9;

export default function DashboardClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const [words, setWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [preFilledWord, setPreFilledWord] = useState<Partial<Word> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<WordCategory | 'All'>('All');
  
  const [lists, setLists] = useState<UserList[]>([]);
  const [listWords, setListWords] = useState<ListWord[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    if (!db) {
        setLoadingWords(false);
        setLoadingLists(false);
        return;
    }
    if (user && user.uid) {
      setLoadingWords(true);
      const wordsCollectionRef = collection(db, 'users', user.uid, 'words');
      const qWords = query(wordsCollectionRef, orderBy('createdAt', 'desc'));
      const unsubscribeWords = onSnapshot(qWords, (querySnapshot) => {
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

      setLoadingLists(true);
      const unsubscribeLists = getLists(user.uid, (fetchedLists) => {
          setLists(fetchedLists);
          setLoadingLists(false);
      });

      getAllWordsFromLists(user.uid).then(fetchedListWords => {
        setListWords(fetchedListWords);
      }).catch(error => {
         console.error("Error fetching list words for chart: ", error);
      });

      return () => {
        unsubscribeWords();
        unsubscribeLists();
      }
    } else {
      setWords([]); 
      setLists([]);
      setListWords([]);
      setLoadingWords(false);
      setLoadingLists(false);
    }
  }, [user, toast]);
  
  const allWordsForChart = useMemo(() => {
    const mainWordDates = words.map(w => ({ createdAt: w.createdAt }));
    const listWordDates = listWords.map(w => ({ createdAt: w.createdAt }));
    return [...mainWordDates, ...listWordDates];
  }, [words, listWords]);

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
  
  const handleUpdateWordCategory = async (id: string, category: WordCategory) => {
    if (!user || !user.uid || !db) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
        const wordDocRef = doc(db, 'users', user.uid, 'words', id);
        await updateDoc(wordDocRef, { category });
        toast({ title: "Category Updated", description: "The word's category has been changed." });
    } catch (error: any) {
        console.error("Error updating category: ", error);
        toast({ title: "Error", description: "Could not update the category.", variant: "destructive" });
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
        const newWordRef = doc(wordsCollectionRef);
        const wordToSave: Omit<Word, 'id'> = {
            ...word,
            category: 'Good', 
            createdAt: Date.now(),
            pronunciationText: '', 
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
      const matchesSearchTerm = word.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || word.category === categoryFilter;
      return matchesSearchTerm && matchesCategory;
    });
  }, [words, searchTerm, categoryFilter]);
  
  const displayedWords = useMemo(() => {
      return filteredWords.slice(0, WORDS_TO_SHOW_ON_DASHBOARD);
  }, [filteredWords]);
  
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
  };
  
  const renderWordContent = () => {
     if (loadingWords) { 
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">{t.loadingWords}</p>
            </div>
        );
    }
    return <WordList words={displayedWords} onDeleteWord={handleDeleteWord} onEditWord={handleEditWord} onUpdateCategory={handleUpdateWordCategory} />;
  }

  if (!db) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t.firebaseNotConfigured}</AlertTitle>
            <AlertDescription>
                {t.firebaseNotConfiguredDesc}
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <StatsDisplay words={words} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <ListsShortcut lists={lists} isLoading={loadingLists} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-8">
          <QuickTranslator onAddWord={handleAddFromTranslator} />
          <BulkAddWords onBulkSave={handleBulkSaveWords} />
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="font-headline text-2xl text-primary">{t.yourWords}</CardTitle>
                    <CardDescription>{t.yourWordsDesc}</CardDescription>
                </div>
                <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" disabled={!user}>
                    <PlusCircle className="mr-2 h-5 w-5" /> {t.addNewWord}
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card-foreground/5 items-center">
                <div className="flex-grow relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder={t.searchPlaceholder}
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
                                <SelectValue placeholder={t.filterByCategory} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">{t.allCategories}</SelectItem>
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
            </div>

            {renderWordContent()}

            {filteredWords.length > WORDS_TO_SHOW_ON_DASHBOARD && (
              <div className="mt-8 text-center">
                <Link href="/dashboard/words" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
                  {t.viewAll} ({filteredWords.length}) <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}
        </CardContent>
      </Card>
      
      <WeeklyWordsChart allWords={allWordsForChart} />

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
