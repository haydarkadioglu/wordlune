
"use client";

import { useState, useEffect } from "react";
import type { Story } from "@/types";
import { getStoryById } from "@/lib/stories-service";
import { getStoryWordTranslation } from "@/ai/flows/translate-word-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettings } from "@/hooks/useSettings";

interface StoryReaderClientProps {
    storyId: string;
}

const Word = ({ children }: { children: string }) => {
    const [translation, setTranslation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { sourceLanguage, targetLanguage } = useSettings();

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
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <p className="text-sm font-semibold text-primary">{translation}</p>}
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
                <p className="text-muted-foreground text-lg mb-8">{story.level}</p>
                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground text-xl leading-relaxed">
                    {renderStoryContent()}
                </div>
            </div>
        </div>
    );
}
