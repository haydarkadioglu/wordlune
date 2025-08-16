
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Story } from "@/types";
import { getPublishedStories } from "@/lib/stories-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, ArrowRight, Filter, XCircle, Heart, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { useSettings } from "@/hooks/useSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";

const translations = {
  en: {
    title: 'Stories',
    description: 'Improve your vocabulary by reading stories. Click on words to get instant translations.',
    readStory: 'Read Story',
    noStories: 'No stories available for the selected language or filters. Please check back later or change your filters.',
    allLevels: 'All Levels',
    allCategories: 'All Categories',
    filterByLevel: 'Filter by level',
    filterByCategory: 'Filter by category',
    clearFilters: 'Clear Filters',
    loadingStories: 'Loading stories for',
    by: 'By',
  },
  tr: {
    title: 'Hikayeler',
    description: 'Hikayeler okuyarak kelime dağarcığınızı geliştirin. Anında çeviriler için kelimelere tıklayın.',
    readStory: 'Hikayeyi Oku',
    noStories: 'Seçilen dil veya filtrelere uygun hikaye bulunamadı. Lütfen daha sonra tekrar kontrol edin veya filtrelerinizi değiştirin.',
    allLevels: 'Tüm Seviyeler',
    allCategories: 'Tüm Kategoriler',
    filterByLevel: 'Seviyeye göre filtrele',
    filterByCategory: 'Kategoriye göre filtrele',
    clearFilters: 'Filtreleri Temizle',
    loadingStories: 'Hikayeler yükleniyor:',
    by: 'Yazar',
  }
};

export default function StoriesClient() {
    const [allStories, setAllStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const settings = useSettings();
    
    const [levelFilter, setLevelFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Wait for settings to be loaded
    if (!settings) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
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
    
    const { uiLanguage, sourceLanguage } = settings;
    const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

    useEffect(() => {
        if (!sourceLanguage) return; // Guard against undefined sourceLanguage
        
        setIsLoading(true);
        // Use the dedicated function for fetching only published stories
        const unsubscribe = getPublishedStories(sourceLanguage, (fetchedStories) => {
            setAllStories(fetchedStories);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [sourceLanguage]);
    
    const uniqueLevels = useMemo(() => {
        if (!Array.isArray(allStories)) return [];
        return [...new Set(allStories.map(s => s?.level).filter(Boolean))];
    }, [allStories]);
    
    const uniqueCategories = useMemo(() => {
        if (!Array.isArray(allStories)) return [];
        return [...new Set(allStories.map(s => s?.category).filter(Boolean))];
    }, [allStories]);

    const filteredStories = useMemo(() => {
        if (!Array.isArray(allStories)) return [];
        
        // No need to filter by isPublished here anymore, as the service function already does it.
        return allStories.filter(story => {
            if (!story) return false;
            const levelMatch = levelFilter === 'all' || story.level === levelFilter;
            const categoryMatch = categoryFilter === 'all' || story.category === categoryFilter;
            return levelMatch && categoryMatch;
        });
    }, [allStories, levelFilter, categoryFilter]);
    
    const clearFilters = () => {
        setLevelFilter('all');
        setCategoryFilter('all');
    }

    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="space-y-6">
                    <Alert>
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <AlertTitle>{t.loadingStories} {sourceLanguage}...</AlertTitle>
                        <AlertDescription>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
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
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        if (filteredStories.length === 0) {
            return (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">{t.noStories}</h3>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story) => (
                    <Card key={story?.id || Math.random()} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>{story?.title || 'Untitled'}</CardTitle>
                            <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {story?.authorName || 'Unknown'}</span>
                                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {story?.likeCount || 0}</span>
                            </div>
                            <CardDescription className="flex gap-2 pt-2">
                                <Badge variant="outline">{story?.level || 'Unknown'}</Badge>
                                <Badge variant="secondary">{story?.category || 'Unknown'}</Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                           <p className="text-muted-foreground line-clamp-3">{story?.content || ''}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href={`/dashboard/stories/${story?.id}?lang=${story?.language}`}>
                                    {t.readStory} <ArrowRight className="ml-2" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
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

            <Card>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="w-full sm:w-48">
                        <Select value={levelFilter} onValueChange={setLevelFilter} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder={t.filterByLevel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t.allLevels}</SelectItem>
                                {uniqueLevels.map(level => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder={t.filterByCategory} />
                            </SelectTrigger>
                            <SelectContent>
                                 <SelectItem value="all">{t.allCategories}</SelectItem>
                                {uniqueCategories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {(levelFilter !== 'all' || categoryFilter !== 'all') && (
                        <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-primary">
                            <XCircle className="mr-2 h-4 w-4" />
                            {t.clearFilters}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {renderContent()}
        </div>
    );
}
