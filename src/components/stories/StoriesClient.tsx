
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Story } from "@/types";
import { getStories } from "@/lib/stories-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, ArrowRight, Filter, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { useSettings } from "@/hooks/useSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const translations = {
  en: {
    title: 'Stories',
    description: 'Improve your vocabulary by reading stories. Click on words to get instant translations.',
    readStory: 'Read Story',
    noStories: 'No stories available for the selected filters. Please check back later or change your filters.',
    allLevels: 'All Levels',
    allCategories: 'All Categories',
    filterByLevel: 'Filter by level',
    filterByCategory: 'Filter by category',
    clearFilters: 'Clear Filters',
  },
  tr: {
    title: 'Hikayeler',
    description: 'Hikayeler okuyarak kelime dağarcığınızı geliştirin. Anında çeviriler için kelimelere tıklayın.',
    readStory: 'Hikayeyi Oku',
    noStories: 'Seçilen filtrelere uygun hikaye bulunamadı. Lütfen daha sonra tekrar kontrol edin veya filtrelerinizi değiştirin.',
    allLevels: 'Tüm Seviyeler',
    allCategories: 'Tüm Kategoriler',
    filterByLevel: 'Seviyeye göre filtrele',
    filterByCategory: 'Kategoriye göre filtrele',
    clearFilters: 'Filtreleri Temizle',
  }
};

export default function StoriesClient() {
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { uiLanguage } = useSettings();
    const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
    
    const [levelFilter, setLevelFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    useEffect(() => {
        const unsubscribe = getStories((fetchedStories) => {
            setStories(fetchedStories);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const uniqueLevels = useMemo(() => ['all', ...Array.from(new Set(stories.map(s => s.level)))], [stories]);
    const uniqueCategories = useMemo(() => ['all', ...Array.from(new Set(stories.map(s => s.category)))], [stories]);

    const filteredStories = useMemo(() => {
        return stories.filter(story => {
            const levelMatch = levelFilter === 'all' || story.level === levelFilter;
            const categoryMatch = categoryFilter === 'all' || story.category === categoryFilter;
            return levelMatch && categoryMatch;
        });
    }, [stories, levelFilter, categoryFilter]);
    
    const clearFilters = () => {
        setLevelFilter('all');
        setCategoryFilter('all');
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48" />
                </div>
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-40" />
                        <Skeleton className="h-10 w-40" />
                    </div>
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

            <Card>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="w-full sm:w-48">
                        <Select value={levelFilter} onValueChange={setLevelFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder={t.filterByLevel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t.allLevels}</SelectItem>
                                {uniqueLevels.filter(l => l !== 'all').map(level => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder={t.filterByCategory} />
                            </SelectTrigger>
                            <SelectContent>
                                 <SelectItem value="all">{t.allCategories}</SelectItem>
                                {uniqueCategories.filter(c => c !== 'all').map(category => (
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

            {filteredStories.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">{t.noStories}</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStories.map((story) => (
                        <Card key={story.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>{story.title}</CardTitle>
                                <CardDescription className="flex gap-2 pt-2">
                                    <Badge variant="outline">{story.level}</Badge>
                                    <Badge variant="secondary">{story.category}</Badge>
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
