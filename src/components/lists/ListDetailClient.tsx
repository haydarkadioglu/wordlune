
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserList, ListWord } from "@/types";
import { getListDetails, getWordsForList, deleteMultipleWordsFromList } from "@/lib/list-service";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Trash2, ArrowLeft, Edit, UploadCloud } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddWordToListDialog from "./AddWordToListDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import BulkAddToListDialog from "./BulkAddToList";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ListDetailClientProps {
    listId: string;
}

const translations = {
  en: {
    back: 'Back to Lists',
    listNotFound: 'List not found',
    listNotFoundDesc: 'This list may have been deleted or does not exist.',
    goBack: 'Go back to lists',
    wordsInCollection: (count: number) => `${count} words in this collection.`,
    addWord: 'Add Word',
    bulkAdd: 'Bulk Add',
    editList: 'Edit List',
    cancel: 'Cancel',
    deleteSelected: (count: number) => `Delete (${count})`,
    deleteConfirmTitle: 'Are you sure?',
    deleteConfirmDesc: (count: number) => `This will permanently delete ${count} selected word(s) from this list.`,
    confirmDelete: 'Confirm Delete',
    noWords: 'No words in this list yet. Click "Add Word" or "Bulk Add" to get started.',
    wordHeader: 'Word',
    meaningHeader: 'Meaning',
    exampleHeader: 'Example Sentence',
    sortBy: 'Sort by',
    dateNewest: 'Date (Newest)',
    dateOldest: 'Date (Oldest)',
    alphabeticalAZ: 'Alphabetical (A-Z)',
    alphabeticalZA: 'Alphabetical (Z-A)',
  },
  tr: {
    back: 'Listelere Geri Dön',
    listNotFound: 'Liste bulunamadı',
    listNotFoundDesc: 'Bu liste silinmiş veya mevcut olmayabilir.',
    goBack: 'Listelere geri dön',
    wordsInCollection: (count: number) => `Bu koleksiyonda ${count} kelime var.`,
    addWord: 'Kelime Ekle',
    bulkAdd: 'Toplu Ekle',
    editList: 'Listeyi Düzenle',
    cancel: 'İptal',
    deleteSelected: (count: number) => `Seçilenleri Sil (${count})`,
    deleteConfirmTitle: 'Emin misiniz?',
    deleteConfirmDesc: (count: number) => `Bu işlem, seçilen ${count} kelimeyi bu listeden kalıcı olarak silecek.`,
    confirmDelete: 'Silmeyi Onayla',
    noWords: 'Bu listede henüz kelime yok. Başlamak için "Kelime Ekle" veya "Toplu Ekle"ye tıklayın.',
    wordHeader: 'Kelime',
    meaningHeader: 'Anlam',
    exampleHeader: 'Örnek Cümle',
    sortBy: 'Sırala',
    dateNewest: 'Tarih (Yeniden Eskiye)',
    dateOldest: 'Tarih (Eskiden Yeniye)',
    alphabeticalAZ: 'Alfabetik (A-Z)',
    alphabeticalZA: 'Alfabetik (Z-A)',
  }
};

type SortOption = 'date_desc' | 'date_asc' | 'alpha_asc' | 'alpha_desc';

export default function ListDetailClient({ listId }: ListDetailClientProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { uiLanguage } = useSettings();
    const [list, setList] = useState<UserList | null>(null);
    const [words, setWords] = useState<ListWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddWordDialogOpen, setIsAddWordDialogOpen] = useState(false);
    const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [sortOption, setSortOption] = useState<SortOption>('date_desc');

    const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            const fetchListDetails = async () => {
                const details = await getListDetails(user.uid, listId);
                setList(details);
            };
            fetchListDetails();

            const unsubscribe = getWordsForList(user.uid, listId, (fetchedWords) => {
                setWords(fetchedWords);
                setIsLoading(false);
            });

            return () => {
                unsubscribe();
                setIsSelectionMode(false);
                setSelectedWords([]);
            };
        } else {
            setIsLoading(false);
        }
    }, [user, listId]);
    
    const handleBulkDelete = async () => {
        if (!user || selectedWords.length === 0) return;
        try {
            await deleteMultipleWordsFromList(user.uid, listId, selectedWords);
            toast({
                title: "Words Deleted",
                description: `${selectedWords.length} words have been removed from the list.`,
                variant: "destructive"
            });
            setIsSelectionMode(false);
            setSelectedWords([]);
        } catch (error) {
             console.error("Failed to bulk delete words:", error);
            toast({
                title: "Error",
                description: "Could not delete the selected words. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleToggleSelection = (wordId: string) => {
        setSelectedWords(prev => 
            prev.includes(wordId) 
            ? prev.filter(id => id !== wordId) 
            : [...prev, wordId]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedWords(words.map(w => w.id));
        } else {
            setSelectedWords([]);
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedWords([]);
    };

    const sortedWords = useMemo(() => {
        const newWords = [...words];
        switch (sortOption) {
            case 'date_asc':
                return newWords.sort((a, b) => a.createdAt - b.createdAt);
            case 'alpha_asc':
                return newWords.sort((a, b) => a.word.localeCompare(b.word));
            case 'alpha_desc':
                return newWords.sort((a, b) => b.word.localeCompare(a.word));
            case 'date_desc':
            default:
                return newWords.sort((a, b) => b.createdAt - a.createdAt);
        }
    }, [words, sortOption]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-48" />
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-36" />
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    if (!list) {
        return (
             <div className="text-center py-20">
                <h3 className="text-xl font-semibold">{t.listNotFound}</h3>
                <p className="text-muted-foreground mt-2">{t.listNotFoundDesc}</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard/lists">{t.goBack}</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <Button asChild variant="ghost" className="mb-4 pl-1">
                    <Link href="/dashboard/lists">
                        <ArrowLeft className="mr-2" />
                        {t.back}
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight text-primary">{list.name}</h1>
                <p className="text-muted-foreground mt-1">
                    {t.wordsInCollection(list.wordCount || 0)}
                </p>
            </div>
            
            <Card>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-2 justify-between items-center flex-wrap">
                    <div className="flex gap-2 flex-wrap">
                         <Button onClick={() => setIsAddWordDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t.addWord}
                        </Button>
                         <Button variant="secondary" onClick={() => setIsBulkAddDialogOpen(true)}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {t.bulkAdd}
                        </Button>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end w-full sm:w-auto">
                        <div className="w-full sm:w-[180px]">
                            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.sortBy} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date_desc">{t.dateNewest}</SelectItem>
                                    <SelectItem value="date_asc">{t.dateOldest}</SelectItem>
                                    <SelectItem value="alpha_asc">{t.alphabeticalAZ}</SelectItem>
                                    <SelectItem value="alpha_desc">{t.alphabeticalZA}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {isSelectionMode ? (
                            <>
                                <Button variant="outline" onClick={toggleSelectionMode}>{t.cancel}</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={selectedWords.length === 0}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t.deleteSelected(selectedWords.length)}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                           {t.deleteConfirmDesc(selectedWords.length)}
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete}>{t.confirmDelete}</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        ) : (
                            <Button variant="outline" onClick={toggleSelectionMode} disabled={words.length === 0}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t.editList}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="border rounded-lg bg-card">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            {isSelectionMode && (
                                <TableHead className="w-[50px]">
                                    <Checkbox 
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        checked={selectedWords.length > 0 && selectedWords.length === words.length}
                                        aria-label="Select all rows"
                                    />
                                </TableHead>
                            )}
                            <TableHead className="w-[20%]">{t.wordHeader}</TableHead>
                            <TableHead className="w-[25%]">{t.meaningHeader}</TableHead>
                            <TableHead className="w-[55%]">{t.exampleHeader}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedWords.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isSelectionMode ? 4 : 3} className="h-24 text-center">
                                    {t.noWords}
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedWords.map((word) => (
                                <TableRow key={word.id} data-state={selectedWords.includes(word.id) && "selected"}>
                                    {isSelectionMode && (
                                        <TableCell>
                                            <Checkbox
                                                onCheckedChange={() => handleToggleSelection(word.id)}
                                                checked={selectedWords.includes(word.id)}
                                                aria-label={`Select word ${word.word}`}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell className="font-medium">{word.word}</TableCell>
                                    <TableCell className="text-muted-foreground">{word.meaning} <span className="text-xs text-muted-foreground/50">({word.language})</span></TableCell>
                                    <TableCell className="text-muted-foreground">{word.example}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddWordToListDialog 
                isOpen={isAddWordDialogOpen}
                onOpenChange={setIsAddWordDialogOpen}
                listId={listId}
            />
             <BulkAddToListDialog
                isOpen={isBulkAddDialogOpen}
                onOpenChange={setIsBulkAddDialogOpen}
                listId={listId}
            />
        </div>
    );
}
