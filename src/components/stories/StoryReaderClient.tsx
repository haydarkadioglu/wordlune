
"use client";

import { useState, useEffect } from "react";
import type { Story } from "@/types";
import { getStoryById } from "@/lib/stories-service";
import { getStoryWordTranslation } from "@/ai/flows/translate-word-flow";
import { addWordToStoriesList } from "@/lib/list-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StoryReaderClientProps {
    storyId: string;
}

const Word = ({ children }: { children: string }) => {
    const [translation, setTranslation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const { sourceLanguage, targetLanguage } = useSettings();
    const { user } = useAuth();
    const { toast } = useToast();

    const handleWordClick = async () => {
        if (translation) return; // Don't fetch again if already translated
        setIsLoading(true);
        try {
            const result = await getStoryWordTranslation({
                word: children,
                sourceLanguage,
                targetLanguage
            });
            setTranslation(result.translation);
        } catch (error) {
            console.error("Translation failed:", error);
            setTranslation("Translation failed.");
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
            </PopoverContent>
        </Popover>
    )
}

export default function StoryReaderClient({ storyId }: StoryReaderClientProps) {
    const [story, setStory] = useState<Story | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (storyId) {
            setIsLoading(true);
            getStoryById(storyId).then(fetchedStory => {
                setStory(fetchedStory);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [storyId]);

    const renderStoryContent = () => {
        if (!story?.content) return null;
        // Basic regex to split by space and punctuation, keeping the punctuation
        const wordsAndPunctuation = story.content.split(/(\s+|[,."“”;:?])/);

        return wordsAndPunctuation.map((part, index) => {
            // Check if the part is a word (contains letters)
            if (/[a-zA-Z]/.test(part)) {
                return <Word key={index}>{part}</Word>;
            }
            // Otherwise, it's a space or punctuation
            return <span key={index}>{part}</span>;
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
                <div className="flex gap-2 mb-8">
                    <Badge variant="secondary">{story.level}</Badge>
                    <Badge variant="outline">{story.category}</Badge>
                </div>
                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground text-xl leading-relaxed">
                    {renderStoryContent()}
                </div>
            </div>
        </div>
    );
}
