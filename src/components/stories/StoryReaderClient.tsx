
"use client";

import { useState, useEffect } from "react";
import type { Story } from "@/types";
import { getStoryById } from "@/lib/stories-service";
<<<<<<< HEAD
import { translateWord } from "@/ai/flows/translate-word-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
=======
import { getStoryWordTranslation } from "@/ai/flows/translate-word-flow";
import { addWordToStoriesList } from "@/lib/list-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettings } from "@/hooks/useSettings";
<<<<<<< HEAD
import { Badge } from "../ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { addWordToList, createList, getListDetails } from "@/lib/list-service";
import { useSearchParams } from "next/navigation";
=======
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2

interface StoryReaderClientProps {
    storyId: string;
}

const Word = ({ children, storyTitle }: { children: string, storyTitle: string }) => {
    const [translationResult, setTranslationResult] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
<<<<<<< HEAD
    const { sourceLanguage, targetLanguage, storyListId, setStoryListId } = useSettings();
=======
    const { sourceLanguage, targetLanguage } = useSettings();
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
    const { user } = useAuth();
    const { toast } = useToast();

    const handleWordClick = async () => {
        if (translationResult) return;
        if (children.trim().length < 2 || !/[a-zA-Z]/.test(children)) return;

        setIsLoading(true);
        try {
            const result = await translateWord({ word: children, sourceLanguage, targetLanguage });
            setTranslationResult(result.translations && result.translations.length > 0 ? result.translations : ["Not found"]);
        } catch (error) {
            console.error("Translation failed:", error);
            setTranslationResult(["Translation failed."]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToList = async () => {
        if (!user || !translation) return;
        
        setIsAdding(true);
        try {
            await addWordToStoriesList(user.uid, children, translation);
            toast({
                title: "Kelime Eklendi!",
                description: `"${children}" kelimesi Stories listesine eklendi.`,
            });
        } catch (error) {
            console.error("Failed to add word to list:", error);
            toast({
                title: "Hata",
                description: "Kelime eklenirken bir hata oluştu.",
                variant: "destructive",
            });
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleAddToList = async () => {
        if (!user || !translationResult || translationResult[0] === "Not found") return;
        setIsAdding(true);
        
        try {
            let listId = storyListId;
            const defaultListName = "Story Words";

            if (!listId) {
                const newListId = await createList(user.uid, defaultListName);
                setStoryListId(newListId); // Update setting for future use
                listId = newListId;
                toast({ title: "List Created", description: `"${defaultListName}" list has been created for you.` });
            } else {
                const listExists = await getListDetails(user.uid, listId);
                if (!listExists) {
                    const newListId = await createList(user.uid, defaultListName);
                    setStoryListId(newListId);
                    listId = newListId;
                    toast({ title: "List Re-created", description: `Your selected story list was not found, so "${defaultListName}" was created.` });
                }
            }

            await addWordToList(user.uid, listId, {
                word: children,
                meaning: translationResult.join(', '),
                example: storyTitle, // Using story title as context
                language: targetLanguage,
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
<<<<<<< HEAD
            <PopoverContent className="w-auto p-2">
                 <div className="flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <p className="text-sm font-semibold text-primary">
                            {translationResult?.join(', ')}
                        </p>
                    )}
                    {user && !isLoading && translationResult && (
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
=======
            <PopoverContent className="w-64 p-4 shadow-lg">
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Çevriliyor...</span>
                    </div>
                ) : translation ? (
                    <div className="space-y-3">
                        <div className="text-center">
                            <p className="text-lg font-semibold text-primary leading-relaxed">{translation}</p>
                        </div>
                        {user && (
                            <div className="flex justify-center pt-2 border-t">
                                <Button 
                                    onClick={handleAddToList}
                                    disabled={isAdding}
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white"
                                >
                                    {isAdding ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                        <Plus className="h-4 w-4 mr-1" />
                                    )}
                                    Stories'e Ekle
                                </Button>
                            </div>
                        )}
                    </div>
                ) : null}
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
            </PopoverContent>
        </Popover>
    )
}

export default function StoryReaderClient({ storyId }: StoryReaderClientProps) {
    const [story, setStory] = useState<Story | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const lang = searchParams.get('lang');

    useEffect(() => {
        if (storyId && lang) {
            setIsLoading(true);
            getStoryById(lang, storyId).then(fetchedStory => {
                setStory(fetchedStory);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [storyId, lang]);

    const renderStoryContent = () => {
        if (!story?.content) return null;
        const wordsAndPunctuation = story.content.split(/(\s+)/);

        return wordsAndPunctuation.map((part, index) => {
            if (/\s+/.test(part)) {
                 return <span key={index}>{part}</span>;
            }
            return <Word key={index} storyTitle={story.title}>{part}</Word>;
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
            <Button asChild variant="ghost" className="mb-4 pl-1">
                <Link href="/dashboard/stories">
                    <ArrowLeft className="mr-2" />
                    Back to Stories
                </Link>
            </Button>
            <div className="bg-card p-6 sm:p-8 lg:p-10 rounded-lg shadow-lg border">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">{story.title}</h1>
<<<<<<< HEAD
                <div className="flex gap-2 text-lg mb-8">
                    <Badge variant="outline">{story.level}</Badge>
                    <Badge variant="secondary">{story.category}</Badge>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground text-xl leading-relaxed whitespace-pre-wrap">
=======
                <div className="flex gap-2 mb-8">
                    <Badge variant="secondary">{story.level}</Badge>
                    <Badge variant="outline">{story.category}</Badge>
                </div>
                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground text-xl leading-relaxed">
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
                    {renderStoryContent()}
                </div>
            </div>
        </div>
    );
}
