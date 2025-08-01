
"use client";
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Word, WordCategory, ProcessedWord, UserList, ListWord } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import QuickTranslator from './QuickTranslator';
import BulkAddWords from './BulkAddWords';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { addMultipleWordsToList, getLists, getAllWordsFromAllLists, createList } from '@/lib/list-service';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useSettings } from '@/hooks/useSettings';
import ListsShortcut from './ListsShortcut';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import StatsDisplay from './StatsDisplay';
import WeeklyWordsChart from './WeeklyWordsChart';
import AddWordToListDialog from '../lists/AddWordToListDialog';


const translations = {
  en: {
    firebaseNotConfigured: 'Firebase Not Configured',
    firebaseNotConfiguredDesc: 'The connection to the database failed. This is likely due to missing or invalid Firebase credentials. Please check the console for more details and configure your .env file.',
    addWordToList: "Add Word to List",
    quickAddDesc: "Quickly add a word to a list. First, select a list or create a new one.",
    selectList: "Select a list",
    createList: "Create New List",
    addWord: "Add Word",
  },
  tr: {
    firebaseNotConfigured: 'Firebase Yapılandırılmamış',
    firebaseNotConfiguredDesc: 'Veritabanı bağlantısı başarısız oldu. Bu durum, büyük olasılıkla eksik veya geçersiz Firebase kimlik bilgilerinden kaynaklanmaktadır. Lütfen daha fazla ayrıntı için konsolu kontrol edin ve .env dosyanızı yapılandırın.',
    addWordToList: "Listeye Kelime Ekle",
    quickAddDesc: "Bir listeye hızlıca kelime ekleyin. Önce bir liste seçin veya yeni bir tane oluşturun.",
    selectList: "Liste seçin",
    createList: "Yeni Liste Oluştur",
    addWord: "Kelime Ekle",
  }
};


export default function DashboardClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uiLanguage, sourceLanguage, targetLanguage, lastSelectedListId, setLastSelectedListId } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const [allWords, setAllWords] = useState<(ListWord & { listId: string; listName: string; })[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  
  const [lists, setLists] = useState<UserList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [isAddWordDialogOpen, setIsAddWordDialogOpen] = useState(false);
  const [wordToAdd, setWordToAdd] = useState<{word: string; meaning: string} | null>(null);

  useEffect(() => {
    if (!db || !user?.uid || !sourceLanguage) {
        setLoadingWords(false);
        setLoadingLists(false);
        return;
    }
    
    setLoadingWords(true);
    getAllWordsFromAllLists(user.uid, sourceLanguage).then(fetchedWords => {
        setAllWords(fetchedWords);
        setLoadingWords(false);
    }).catch(error => {
        console.error("Error fetching all words: ", error);
        toast({ title: "Error", description: "Could not fetch all words.", variant: "destructive" });
        setLoadingWords(false);
    });

    setLoadingLists(true);
    const unsubscribeLists = getLists(user.uid, sourceLanguage, (fetchedLists) => {
        setLists(fetchedLists);
        if (fetchedLists.length > 0 && !lastSelectedListId) {
            setLastSelectedListId(fetchedLists[0].id);
        } else if (fetchedLists.length === 0) {
            setLastSelectedListId('');
        }
        setLoadingLists(false);
    });

    return () => {
      unsubscribeLists();
    }
  }, [user, toast, sourceLanguage, lastSelectedListId, setLastSelectedListId]);

  const handleBulkSaveWords = async (processedWords: Omit<ProcessedWord, 'id' | 'createdAt' | 'category'>[]) => {
    if (!user || !user.uid || !db || !lastSelectedListId) {
      toast({ title: "Error", description: "You must select a list to save words.", variant: "destructive" });
      return;
    }

    try {
        await addMultipleWordsToList(user.uid, sourceLanguage, lastSelectedListId, processedWords, targetLanguage);
        toast({ title: "Words Added", description: `${processedWords.length} words added to your list.` });
    } catch (error: any) {
        console.error("Error bulk saving words: ", error);
        toast({ title: "Error saving words", description: error.message, variant: "destructive" });
    }
  };

  const handleAddFromTranslator = useCallback((word: string, meaning: string) => {
    if (!lastSelectedListId) {
        toast({ title: "No List Selected", description: "Please select a list before adding a word.", variant: "destructive"});
        return;
    }
    setWordToAdd({ word, meaning });
    setIsAddWordDialogOpen(true);
  }, [lastSelectedListId, toast]);

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
      <StatsDisplay words={allWords} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <ListsShortcut lists={lists} isLoading={loadingLists} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-8">
          <QuickTranslator onAddWord={handleAddFromTranslator} lists={lists} />
          <BulkAddWords onBulkSave={handleBulkSaveWords} lists={lists} />
        </div>
      </div>
      
      <WeeklyWordsChart allWords={allWords} />

      {lastSelectedListId && (
          <AddWordToListDialog
            isOpen={isAddWordDialogOpen}
            onOpenChange={setIsAddWordDialogOpen}
            listId={lastSelectedListId}
            lists={lists}
            preFilledData={wordToAdd ? { word: wordToAdd.word, meaning: wordToAdd.meaning } : {}}
            onListChange={setLastSelectedListId}
          />
      )}
    </div>
  );
}
