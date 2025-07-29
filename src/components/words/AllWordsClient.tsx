
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { ListWord, WordCategory } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, Filter, XCircle, Loader2, List, LayoutGrid } from 'lucide-react';
import WordList from '@/components/words/WordList';
import WordTable from '@/components/words/WordTable';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { getAllWordsFromAllLists, updateWordInList, deleteWordFromList } from '@/lib/list-service';
import { useSettings } from '@/hooks/useSettings';
import { useSearchParams } from 'next/navigation';
import AddWordToListDialog from '../lists/AddWordToListDialog';
import EditListWordDialog from '../lists/EditListWordDialog';

const translations = {
  en: {
    loadingWords: 'Loading your words...',
    allYourWords: 'All Your Words',
    allYourWordsDesc: 'View, search, and manage all of your saved words from all your lists.',
    addNewWord: 'Add New Word',
    searchPlaceholder: 'Search words, meanings, or examples...',
    filterByCategory: 'Filter by category',
    allCategories: 'All Categories',
    cardsView: 'Cards',
    tableView: 'Table',
    noLists: "No lists found.",
    noListsDesc: "You need to create a list before you can add a word.",
  },
  tr: {
    loadingWords: 'Kelimeleriniz yükleniyor...',
    allYourWords: 'Tüm Kelimeleriniz',
    allYourWordsDesc: 'Tüm listelerinizdeki kayıtlı kelimelerinizi görüntüleyin, arayın ve yönetin.',
    addNewWord: 'Yeni Kelime Ekle',
    searchPlaceholder: 'Kelime, anlam veya örnek arayın...',
    filterByCategory: 'Kategoriye göre filtrele',
    allCategories: 'Tüm Kategoriler',
    cardsView: 'Kartlar',
    tableView: 'Tablo',
    noLists: "Hiç liste bulunamadı.",
    noListsDesc: "Kelime ekleyebilmek için önce bir liste oluşturmalısınız.",
  }
};

const allCategories: WordCategory[] = ['All', 'Very Good', 'Good', 'Bad', 'Repeat', 'Uncategorized'];

export default function AllWordsClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const [words, setWords] = useState<(ListWord & { listId: string; listName: string })[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<(ListWord & { listId: string }) | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<WordCategory | 'All'>('All');
  const searchParams = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams.get('category') as WordCategory | 'All';
    if (categoryParam && allCategories.includes(categoryParam)) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.uid) {
      setLoadingWords(true);
      getAllWordsFromAllLists(user.uid)
        .then(setWords)
        .catch(err => {
          console.error("Error fetching all words:", err);
          toast({ title: "Error", description: "Could not fetch your words.", variant: "destructive" });
        })
        .finally(() => setLoadingWords(false));
    } else {
      setLoadingWords(false);
      setWords([]);
    }
  }, [user, toast]);

  const handleUpdateWordCategory = async (listId: string, wordId: string, category: WordCategory) => {
    if (!user?.uid) return;
    try {
      await updateWordInList(user.uid, listId, wordId, { category });
      setWords(prev => prev.map(w => w.id === wordId && w.listId === listId ? { ...w, category } : w));
      toast({ title: "Category Updated", description: "The word's category has been changed." });
    } catch (error: any) {
      console.error("Error updating category: ", error);
      toast({ title: "Error", description: "Could not update the category.", variant: "destructive" });
    }
  };

  const handleDeleteWord = async (listId: string, wordId: string) => {
    if (!user?.uid) return;
    const wordToDelete = words.find(w => w.id === wordId && w.listId === listId);
    try {
      await deleteWordFromList(user.uid, listId, wordId);
      setWords(prev => prev.filter(w => !(w.id === wordId && w.listId === listId)));
      if (wordToDelete) {
        toast({ title: "Word Deleted", description: `"${wordToDelete.word}" has been removed.`, variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error deleting word: ", error);
      toast({ title: "Error deleting word", description: error.message, variant: "destructive" });
    }
  };

  const handleEditWord = (word: ListWord & { listId: string }) => {
    setEditingWord(word);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
      // In a real app, you'd likely want a way to select which list to add to.
      // For now, this is disabled as "Add" is ambiguous without a list target.
      // A better UX would be to open a dialog that first asks to select a list.
      toast({ title: t.noLists, description: t.noListsDesc, variant: 'destructive' });
  };

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearchTerm = word.word.toLowerCase().includes(searchTermLower) ||
        word.meaning.toLowerCase().includes(searchTermLower) ||
        word.example.toLowerCase().includes(searchTermLower);
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
          <p className="ml-4 text-muted-foreground">{t.loadingWords}</p>
        </div>
      );
    }
    if (view === 'list') {
      return <WordList words={filteredWords} onDeleteWord={handleDeleteWord} onEditWord={handleEditWord} onUpdateCategory={handleUpdateWordCategory} />;
    }
    return <WordTable words={filteredWords} />;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-2xl text-primary">{t.allYourWords}</CardTitle>
              <CardDescription>{t.allYourWordsDesc}</CardDescription>
            </div>
            <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" disabled={!user}>
              <PlusCircle className="mr-2 h-5 w-5" /> {t.addNewWord}
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
                      {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat === 'All' ? t.allCategories : cat}</SelectItem>
                      ))}
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
                <TabsTrigger value="card-view"><LayoutGrid className="mr-2 h-4 w-4" />{t.cardsView}</TabsTrigger>
                <TabsTrigger value="table-view"><List className="mr-2 h-4 w-4" />{t.tableView}</TabsTrigger>
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

      {editingWord && (
        <EditListWordDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          listId={editingWord.listId}
          wordToEdit={editingWord}
        />
      )}
    </div>
  );
}
