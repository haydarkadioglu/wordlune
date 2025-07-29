
"use client";

import { useState, useEffect } from 'react';
import { getStories, deleteStory } from '@/lib/stories-service';
import type { Story } from '@/types';
import { List, PlusCircle, Edit, Trash2 } from 'lucide-react';
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
    const [stories, setStories] = useState<Story[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStory, setEditingStory] = useState<Story | null>(null);
    const { toast } = useToast();
    const { sourceLanguage } = useSettings(); // To fetch stories for a default language

    useEffect(() => {
        if (sourceLanguage) {
            const unsubscribe = getStories(sourceLanguage, setStories, false); // Fetch all stories, not just published
            return () => unsubscribe();
        }
    }, [sourceLanguage]);

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
            await deleteStory(story);
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
                                <TableHead>Status</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No stories found for {sourceLanguage}.</TableCell>
                                </TableRow>
                            ) : (
                                stories.map(story => (
                                    <TableRow key={story.id}>
                                        <TableCell className="font-medium">{story.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={story.isPublished ? 'default' : 'secondary'}>
                                                {story.isPublished ? 'Published' : 'Draft'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{story.level}</Badge></TableCell>
                                        <TableCell>{story.authorName}</TableCell>
                                        <TableCell>{format(new Date(story.createdAt), 'PPpp')}</TableCell>
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
