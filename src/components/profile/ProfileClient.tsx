
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getStoriesByAuthor, deleteUserStory } from '@/lib/stories-service';
import type { Story } from '@/types';
import { Loader2, BookUser, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';
import UpsertStoryDialog from './UpsertStoryDialog';
import { useRouter } from 'next/navigation';

export default function ProfileClient() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [stories, setStories] = useState<Story[]>([]);
    const [loadingStories, setLoadingStories] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStory, setEditingStory] = useState<Story | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }

        setLoadingStories(true);
        const unsubscribe = getStoriesByAuthor(user.uid, (userStories) => {
            setStories(userStories);
            setLoadingStories(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, router]);

    const handleNewStory = () => {
        setEditingStory(null);
        setIsDialogOpen(true);
    };

    const handleEditStory = (story: Story) => {
        setEditingStory(story);
        setIsDialogOpen(true);
    };

    const handleDeleteStory = async (story: Story) => {
        if (!user) return;
        try {
            await deleteUserStory(user.uid, story);
            toast({
                title: "Story Deleted",
                description: `"${story.title}" has been successfully deleted.`,
                variant: 'destructive'
            });
        } catch (error: any) {
            console.error("Error deleting story:", error);
            toast({
                title: "Error",
                description: error.message || "Could not delete the story. Please try again.",
                variant: 'destructive'
            });
        }
    };

    if (authLoading || loadingStories) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
             <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2"><BookUser /> My Stories</CardTitle>
                            <CardDescription>Create, manage, and share your own stories with the community.</CardDescription>
                        </div>
                        <Button onClick={handleNewStory}>
                            <PlusCircle className="mr-2" /> Create New Story
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Title</TableHead>
                                <TableHead className="w-[15%]">Status</TableHead>
                                <TableHead className="w-[15%]">Language</TableHead>
                                <TableHead className="w-[15%]">Level</TableHead>
                                <TableHead className="w-[20%]">Last Updated</TableHead>
                                <TableHead className="text-right w-[15%]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">You haven't created any stories yet.</TableCell>
                                </TableRow>
                            ) : (
                                stories.map(story => (
                                    <TableRow key={`${story.language}-${story.id}`}>
                                        <TableCell className="font-medium">{story.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={story.isPublished ? 'default' : 'secondary'}>
                                                {story.isPublished ? 'Published' : 'Draft'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{story.language}</Badge></TableCell>
                                        <TableCell><Badge variant="outline">{story.level}</Badge></TableCell>
                                        <TableCell>{story.updatedAt ? format(story.updatedAt.toDate(), 'PPpp') : 'N/A'}</TableCell>
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
             <UpsertStoryDialog 
                isOpen={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
                story={editingStory} 
             />
        </div>
    );
}
