
"use client";

import { useState, useEffect } from "react";
import type { Story, UserList } from "@/types";
import { getStoryById } from "@/lib/stories-service";
import { translateWord } from "@/lib/ai-client";
import { addWordToList, createList, getLists, getListDetails } from "@/lib/list-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";


interface StoryReaderClientProps {
    storyId: string;
}

const Word = ({ children, storyTitle, storyLanguage }: { children: string, storyTitle: string, storyLanguage: string }) => {
    const [translationResult, setTranslationResult] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const { targetLanguage, storyListId, setStoryListId } = useSettings();
    const { user } = useAuth();
    const { toast } = useToast();

    const handleWordClick = async () => {
        if (translationResult) return;
        if (children.trim().length < 2 || !/[a-zA-Z]/.test(children)) return;

        setIsLoading(true);
        try {
            const result = await translateWord({ word: children, sourceLanguage: storyLanguage, targetLanguage });
            setTranslationResult(result.translations && result.translations.length > 0 ? result.translations : ["Not found"]);
        } catch (error) {
            console.error("Translation failed:", error);
            setTranslationResult(["Translation failed."]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAddToList = async () => {
        if (!user || !translationResult || translationResult[0] === "Not found" || !storyListId) {
             toast({ title: "Cannot Add Word", description: "You must select a list in your settings page to save words from stories.", variant: "destructive" });
            return;
        }

        setIsAdding(true);
        
        try {
            await addWordToList(user.uid, storyLanguage, storyListId, {
                word: children,
                meaning: translationResult.join(', '),
                example: storyTitle,
                language: targetLanguage,
                category: "Uncategorized",
            });
            toast({ title: "Word Added!", description: `"${children}" has been added to your list.` });
        } catch (error) {
            console.error("Failed to add word to list:", error);
            toast({ title: "Error", description: "Could not add word to list.", variant: "destructive" });
        } finally {
            setIsAdding(false);
        }
    }

    if (children.trim().length < 2 || !/[a-zA-Z]/.test(children)) {
        return <span>{children}</span>
    }
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <span 
                    className="cursor-pointer hover:bg-primary/20 rounded-md px-1 py-0.5 transition-colors"
                    onClick={handleWordClick}
                >
                    {children}
                </span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                 <div className="flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <p className="text-sm font-semibold text-primary">
                            {translationResult?.join(', ')}
                        </p>
                    )}
                    {user && !isLoading && translationResult && translationResult[0] !== "Not found" && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            onClick={handleAddToList}
                            disabled={isAdding}
                        >
                            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

const StoryToolbar = ({ storyLanguage }: { storyLanguage: string }) => {
    const { user } = useAuth();
    const { storyListId, setStoryListId } = useSettings();
    const [lists, setLists] = useState<UserList[]>([]);
    const [loadingLists, setLoadingLists] = useState(true);

    useEffect(() => {
        if (user) {
            setLoadingLists(true);
            const unsubscribe = getLists(user.uid, storyLanguage, (fetchedLists) => {
                setLists(fetchedLists);
                if (fetchedLists.length > 0 && !storyListId) {
                    // Pre-select the first list if none is selected
                    setStoryListId(fetchedLists[0].id);
                }
                setLoadingLists(false);
            });
            return () => unsubscribe();
        }
    }, [user, storyLanguage, storyListId, setStoryListId]);

    const handleListChange = async (listId: string) => {
        if (!user) return;
        if (listId === 'create-new') {
            const newListName = `Story Words (${storyLanguage})`;
            const newListId = await createList(user.uid, storyLanguage, newListName);
            setStoryListId(newListId);
        } else {
            setStoryListId(listId);
        }
    };
    
    if (!user) return null;

    if (loadingLists) {
        return <Skeleton className="h-10 w-64" />;
    }

    if (lists.length === 0) {
        return (
            <Alert>
              <AlertTitle>No Word Lists Found for {storyLanguage}</AlertTitle>
              <AlertDescription>
                To save words from this story, please create a list first. You can do this from the "My Lists" page.
                <Button onClick={() => handleListChange('create-new')} className="mt-2" size="sm">Create a default list</Button>
              </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Save words to:</span>
            <Select value={storyListId} onValueChange={handleListChange}>
                <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select a list to save words" />
                </SelectTrigger>
                <SelectContent>
                    {lists.map(list => (
                        <SelectItem key={list.id} value={list.id}>
                            {list.name}
                        </SelectItem>
                    ))}
                     <SelectItem value="create-new" className="text-primary">
                        + Create a new list
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}


export default function StoryReaderClient({ storyId }: StoryReaderClientProps) {
    const [story, setStory] = useState<Story | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();

    useEffect(() => {
        const lang = searchParams.get('lang');
        if (storyId && lang) {
            setIsLoading(true);
            getStoryById(lang, storyId).then(fetchedStory => {
                setStory(fetchedStory);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [storyId, searchParams]);

    const renderStoryContent = () => {
        if (!story?.content) return null;
        const wordsAndPunctuation = story.content.split(/(\s+)/);

        return wordsAndPunctuation.map((part, index) => {
            if (/\s+/.test(part)) {
                 return <span key={index}>{part}</span>;
            }
            return <Word key={index} storyTitle={story.title} storyLanguage={story.language}>{part}</Word>;
        });
    };
    
    if (isLoading) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-3/4" />
                <div className="space-y-2 mt-8">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[85%]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                </div>
            </div>
        );
    }

    if (!story) {
        return (
            <div className="text-center py-20">
                <h3 className="text-xl font-semibold">Story not found</h3>
                <p className="text-muted-foreground mt-2">This story may have been deleted or does not exist.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard/stories">Go back to stories</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <Button asChild variant="ghost" className="pl-1 self-start">
                    <Link href="/dashboard/stories">
                        <ArrowLeft className="mr-2" />
                        Back to Stories
                    </Link>
                </Button>
                <StoryToolbar storyLanguage={story.language} />
            </div>

            <div className="bg-card p-6 sm:p-8 lg:p-10 rounded-lg shadow-lg border">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">{story.title}</h1>
                <div className="flex gap-2 text-lg mb-8">
                    <Badge variant="outline">{story.level}</Badge>
                    <Badge variant="secondary">{story.category}</Badge>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground text-xl leading-relaxed whitespace-pre-wrap">
                    {renderStoryContent()}
                </div>
            </div>
        </div>
    );
}
