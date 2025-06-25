
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserList } from "@/types";
import { getLists, deleteList } from "@/lib/list-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ListPlus, Loader2, List, Trash2, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import CreateListDialog from "./CreateListDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ListsClient() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [lists, setLists] = useState<UserList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            const unsubscribe = getLists(user.uid, (fetchedLists) => {
                setLists(fetchedLists);
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const handleDelete = async (listId: string, listName: string) => {
        if (!user) return;
        try {
            await deleteList(user.uid, listId);
            toast({
                title: "List Deleted",
                description: `"${listName}" has been deleted.`,
                variant: "destructive",
            });
        } catch (error) {
            console.error("Failed to delete list:", error);
            toast({
                title: "Error",
                description: "Could not delete the list. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                 <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <List />
                        My Vocabulary Lists
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage your custom word collections.
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <ListPlus className="mr-2" />
                    Create New List
                </Button>
            </div>

            {lists.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">No lists created yet</h3>
                    <p className="text-muted-foreground mt-2">Click "Create New List" to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lists.map((list) => (
                        <Card key={list.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>{list.name}</CardTitle>
                                <CardDescription>{list.wordCount || 0} words</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between gap-2">
                                <Link href={`/dashboard/lists/${list.id}`} className={cn(buttonVariants(), "flex-grow")}>
                                    View List <ArrowRight className="ml-2" />
                                </Link>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            <Trash2 />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the list "{list.name}" and all the words within it.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(list.id, list.name)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            
            <CreateListDialog 
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
        </div>
    );
}
