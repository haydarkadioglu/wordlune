
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserList, ListWord } from "@/types";
import { getListDetails, getWordsForList, deleteMultipleWordsFromList } from "@/lib/list-service";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Trash2, ArrowLeft, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddWordToListDialog from "./AddWordToListDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import BulkAddToList from "./BulkAddToList";
import { Card } from "../ui/card";

interface ListDetailClientProps {
    listId: string;
}

export default function ListDetailClient({ listId }: ListDetailClientProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [list, setList] = useState<UserList | null>(null);
    const [words, setWords] = useState<ListWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddWordDialogOpen, setIsAddWordDialogOpen] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);

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

            // Reset selection mode when leaving the page or list changes
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
        setSelectedWords([]); // Clear selection when toggling mode
    };

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
                <h3 className="text-xl font-semibold">List not found</h3>
                <p className="text-muted-foreground mt-2">This list may have been deleted or does not exist.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard/lists">Go back to lists</Link>
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
                        Back to Lists
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight text-primary">{list.name}</h1>
                <p className="text-muted-foreground mt-1">
                    {list.wordCount || 0} words in this collection.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                 <Card className="shadow-lg">
                    <Card.Header>
                        <Card.Title>Add & Manage Words</Card.Title>
                        <Card.Description>Add single words or manage the list.</Card.Description>
                    </Card.Header>
                    <Card.Content className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={() => setIsAddWordDialogOpen(true)} className="flex-1">
                            <PlusCircle className="mr-2" />
                            Add New Word
                        </Button>
                        {isSelectionMode ? (
                            <>
                                <Button variant="outline" onClick={toggleSelectionMode}>Cancel</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={selectedWords.length === 0}>
                                            <Trash2 className="mr-2" />
                                            Delete ({selectedWords.length})
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete {selectedWords.length} selected word(s) from this list.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete}>Confirm Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        ) : (
                            <Button variant="outline" onClick={toggleSelectionMode}>
                                <Edit className="mr-2" />
                                Edit List
                            </Button>
                        )}
                    </Card.Content>
                </Card>
                <BulkAddToList listId={listId} />
            </div>

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
                            <TableHead className="w-[20%]">Word</TableHead>
                            <TableHead className="w-[25%]">Meaning</TableHead>
                            <TableHead className="w-[55%]">Example Sentence</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {words.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isSelectionMode ? 4 : 3} className="h-24 text-center">
                                    No words in this list yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            words.map((word) => (
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
        </div>
    );
}
