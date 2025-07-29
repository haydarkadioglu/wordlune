
"use client";

import { useState, useEffect } from 'react';
import type { Story } from '@/types';
import { getAllPublishedUserStories, deleteStory } from '@/lib/stories-service';
import { banUser } from '@/lib/user-service';
import { Loader2, ShieldX, List, Trash2, Ban } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ModerationClient() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = getAllPublishedUserStories((allStories) => {
            setStories(allStories);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDeleteStory = async (story: Story) => {
        try {
            await deleteStory(story);
            toast({
                title: "Story Deleted",
                description: `"${story.title}" has been successfully deleted by moderator.`,
                variant: 'destructive'
            });
        } catch (error) {
            console.error("Error deleting story:", error);
            toast({ title: "Error", description: "Could not delete the story.", variant: 'destructive' });
        }
    };

    const handleBanUser = async (authorId: string, authorName: string, duration: 'week' | 'permanent') => {
        const durationText = duration === 'week' ? '1 week' : 'permanently';
        try {
            await banUser(authorId, duration);
            toast({
                title: "User Banned",
                description: `${authorName} has been banned for ${durationText}.`
            });
        } catch (error) {
             console.error("Error banning user:", error);
            toast({ title: "Error", description: "Could not ban the user.", variant: 'destructive' });
        }
    }


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2"><ShieldX /> User Story Moderation</CardTitle>
                <CardDescription>Review and moderate stories published by users. You can remove stories or ban users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Published At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">No user-published stories to moderate.</TableCell>
                            </TableRow>
                        ) : (
                            stories.map(story => (
                                <TableRow key={story.id}>
                                    <TableCell className="font-medium">{story.title}</TableCell>
                                    <TableCell>{story.authorName}</TableCell>
                                    <TableCell><Badge variant="outline">{story.language}</Badge></TableCell>
                                    <TableCell><Badge variant="outline">{story.level}</Badge></TableCell>
                                    <TableCell>{format(new Date(story.createdAt), 'PPpp')}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="destructive">
                                                    <Ban className="mr-2 h-4 w-4" /> Moderate
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Story
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                        <Ban className="mr-2 h-4 w-4" /> Ban User (1 Week)
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                        <Ban className="mr-2 h-4 w-4" /> Ban User (Permanent)
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        
                                        {/* Hidden AlertDialogs for each action */}
                                        <AlertDialog>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Story?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the story &quot;{story.title}&quot; by {story.authorName}. This action cannot be undone.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteStory(story)}>Delete Story</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Ban User for 1 Week?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will prevent {story.authorName} from posting or editing stories for 7 days. Are you sure?
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleBanUser(story.authorId, story.authorName, 'week')}>Ban for 1 Week</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Permanently Ban User?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   This will permanently prevent {story.authorName} from posting or editing stories. This is a serious action.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleBanUser(story.authorId, story.authorName, 'permanent')}>Ban Permanently</AlertDialogAction>
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
    );
}
