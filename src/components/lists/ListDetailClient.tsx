
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserList, ListWord } from "@/types";
import { getListDetails, getWordsForList, deleteWordFromList } from "@/lib/list-service";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Trash2, ArrowLeft, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddWordToListDialog from "./AddWordToListDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [user, listId]);
    
    const handleDeleteWord = async (wordId: string, wordText: string) => {
        if (!user) return;
        try {
            await deleteWordFromList(user.uid, listId, wordId);
            toast({
                title: "Word Deleted",
                description: `"${wordText}" has been removed from the list.`,
                variant: "destructive"
            });
        } catch (error) {
            console.error("Failed to delete word:", error);
            toast({
                title: "Error",
                description: "Could not delete the word. Please try again.",
                variant: "destructive"
            });
        }
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
                                <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
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
            
            <div className="flex justify-end">
                 <Button onClick={() => setIsAddWordDialogOpen(true)}>
                    <PlusCircle className="mr-2" />
                    Add New Word
                </Button>
            </div>

            <div className="border rounded-lg bg-card">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[20%]">Word</TableHead>
                            <TableHead className="w-[25%]">Meaning</TableHead>
                            <TableHead className="w-[45%]">Example Sentence</TableHead>
                            <TableHead className="w-[10%] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {words.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No words in this list yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            words.map((word) => (
                                <TableRow key={word.id}>
                                    <TableCell className="font-medium">{word.word}</TableCell>
                                    <TableCell className="text-muted-foreground">{word.meaning} <span className="text-xs text-muted-foreground/50">({word.language})</span></TableCell>
                                    <TableCell className="text-muted-foreground">{word.example}</TableCell>
                                    <TableCell className="text-right">
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the word "{word.word}" from this list.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteWord(word.id, word.word)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
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
