
"use client";

import { useState, useEffect } from "react";
import type { Story } from "@/types";
import { getStories } from "@/lib/stories-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { useSettings } from "@/hooks/useSettings";

const translations = {
  en: {
    title: 'Stories',
    description: 'Improve your vocabulary by reading stories. Click on words to get instant translations.',
    readStory: 'Read Story',
    noStories: 'No stories available yet. Please check back later.',
  },
  tr: {
    title: 'Hikayeler',
    description: 'Hikayeler okuyarak kelime dağarcığınızı geliştirin. Anında çeviriler için kelimelere tıklayın.',
    readStory: 'Hikayeyi Oku',
    noStories: 'Henüz hiç hikaye mevcut değil. Lütfen daha sonra tekrar kontrol edin.',
  }
};

export default function StoriesClient() {
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { uiLanguage } = useSettings();
    const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

    useEffect(() => {
        const unsubscribe = getStories((fetchedStories) => {
            setStories(fetchedStories);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const levelColors: Record<Story['level'], string> = {
        'Beginner': 'bg-green-500 hover:bg-green-600',
        'Intermediate': 'bg-sky-500 hover:bg-sky-600',
        'Advanced': 'bg-red-500 hover:bg-red-600',
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48" />
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
                        <BookOpen />
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t.description}
                    </p>
                </div>
            </div>

            {stories.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">{t.noStories}</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map((story) => (
                        <Card key={story.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>{story.title}</CardTitle>
                                <CardDescription>
                                    <Badge className={levelColors[story.level]}>{story.level}</Badge>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                               <p className="text-muted-foreground line-clamp-3">{story.content}</p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href={`/dashboard/stories/${story.id}`}>
                                        {t.readStory} <ArrowRight className="ml-2" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
