
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { isAdmin as checkIsAdmin } from '@/lib/admin-service';
import { getStories, deleteStory } from '@/lib/stories-service';
import type { Story } from '@/types';
import { Loader2, ShieldX, List, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import EditStoryDialog from './EditStoryDialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';
import { useSettings } from '@/hooks/useSettings';

export default function AdminClient() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stories, setStories] = useState<Story[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStory, setEditingStory] = useState<Story | null>(null);
    const { toast } = useToast();
    const { sourceLanguage } = useSettings(); // To fetch stories for a default language

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        
        console.log("AdminClient useEffect:", { authLoading, user: user?.email });
        
        if (!authLoading) {
            if (!user) {
                console.log("No user found, redirecting to login");
                router.replace('/login');
            } else {
                console.log("User found, checking admin status for:", user.email);
                checkIsAdmin(user).then(adminStatus => {
                    console.log("Admin check result:", adminStatus);
                    setIsAdmin(adminStatus);
<<<<<<< HEAD
                    setLoading(false);
                });
=======
                    if (adminStatus) {
                        unsubscribe = getStories(setStories);
                    }
                }).finally(() => setLoading(false));
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
            }
        }
        
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, authLoading, router]);

    useEffect(() => {
        if (isAdmin && sourceLanguage) {
            const unsubscribe = getStories(sourceLanguage, setStories);
            return () => unsubscribe();
        }
    }, [isAdmin, sourceLanguage]);

    const handleNewStory = () => {
        setEditingStory(null);
        setIsDialogOpen(true);
    };

    const handleEditStory = (story: Story) => {
        setEditingStory(story);
        setIsDialogOpen(true);
    };

    const handleDeleteStory = async (story: Story) => {
        try {
            await deleteStory(story.language, story.id);
            toast({
                title: "Story Deleted",
                description: `"${story.title}" has been successfully deleted.`,
                variant: 'destructive'
            });
        } catch (error) {
            console.error("Error deleting story:", error);
            toast({
                title: "Error",
                description: "Could not delete the story. Please try again.",
                variant: 'destructive'
            });
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-center">
                <ShieldX className="h-24 w-24 text-destructive mb-4" />
                <h1 className="text-4xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-6">Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
             <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2"><List /> Story Management</CardTitle>
                            <CardDescription>Add, edit, or delete stories from the platform for the <span className="font-bold text-primary">{sourceLanguage}</span> language.</CardDescription>
                        </div>
                        <Button onClick={handleNewStory}>
                            <PlusCircle className="mr-2" /> Add New Story
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Title</TableHead>
                                <TableHead className="w-[15%]">Level</TableHead>
<<<<<<< HEAD
                                <TableHead className="w-[15%]">Category</TableHead>
=======
                                <TableHead className="w-[20%]">Category</TableHead>
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
                                <TableHead className="w-[20%]">Created At</TableHead>
                                <TableHead className="text-right w-[15%]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stories.length === 0 ? (
                                <TableRow>
<<<<<<< HEAD
                                    <TableCell colSpan={5} className="h-24 text-center">No stories found for {sourceLanguage}.</TableCell>
=======
                                    <TableCell colSpan={5} className="h-24 text-center">No stories found.</TableCell>
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
                                </TableRow>
                            ) : (
                                stories.map(story => (
                                    <TableRow key={story.id}>
                                        <TableCell className="font-medium">{story.title}</TableCell>
<<<<<<< HEAD
                                        <TableCell><Badge variant="outline">{story.level}</Badge></TableCell>
                                        <TableCell><Badge variant="secondary">{story.category}</Badge></TableCell>
                                        <TableCell>{format(story.createdAt, 'PPpp')}</TableCell>
=======
                                        <TableCell>{story.level}</TableCell>
                                        <TableCell>{story.category}</TableCell>
                                        <TableCell>
                                            {story.createdAt ? format(new Date(story.createdAt), 'PPpp') : 'Unknown'}
                                        </TableCell>
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="icon" onClick={() => handleEditStory(story)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the story &quot;{story.title}&quot;.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteStory(story)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
             <EditStoryDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} story={editingStory} />
        </div>
    );
}
