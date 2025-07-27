
"use client";

import { useState, useEffect } from "react";
import type { Story } from "@/types";
import { getStoryById } from "@/lib/stories-service";
import { translateWord } from "@/ai/flows/translate-word-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettings } from "@/hooks/useSettings";
import { Badge } from "../ui/badge";

interface StoryReaderClientProps {
    storyId: string;
}

const Word = ({ children }: { children: string }) => {
    const [translationResult, setTranslationResult] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { sourceLanguage, targetLanguage } = useSettings();

    const handleWordClick = async () => {
        if (translationResult) return; // Don't fetch again if already translated
        
        // Basic check to avoid translating very short or non-alphabetic words
        if (children.trim().length < 2 || !/[a-zA-Z]/.test(children)) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await translateWord({
                word: children,
                sourceLanguage,
                targetLanguage
            });
            if (result.translations && result.translations.length > 0) {
                 setTranslationResult(result.translations);
            } else {
                 setTranslationResult(["Not found"]);
            }
        } catch (error) {
            console.error("Translation failed:", error);
            setTranslationResult(["Translation failed."]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Only make words that are likely actual words pop-up-able
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
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                    <p className="text-sm font-semibold text-primary">
                        {translationResult?.join(', ') || '...'}
                    </p>
                 )}
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
        // Split by spaces and newlines to handle paragraphs
        const wordsAndPunctuation = story.content.split(/(\s+)/);

        return wordsAndPunctuation.map((part, index) => {
            if (/\s+/.test(part)) {
                // If the part is whitespace (including newlines), render it as such
                 return <span key={index}>{part}</span>;
            }
            // Otherwise, it's a word possibly with punctuation
            return <Word key={index}>{part}</Word>;
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
