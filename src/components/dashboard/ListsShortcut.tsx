
"use client";

import Link from "next/link";
import type { UserList } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { List, ArrowRight } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const translations = {
  en: {
    title: 'My Lists',
    description: 'Quick access to your custom vocabulary lists.',
    viewAll: 'View All Lists',
    noLists: 'You haven\'t created any lists yet.',
    words: 'words',
  },
  tr: {
    title: 'Listelerim',
    description: 'Özel kelime listelerinize hızlı erişim.',
    viewAll: 'Tüm Listeleri Görüntüle',
    noLists: 'Henüz hiç liste oluşturmadınız.',
    words: 'kelime',
  }
};

interface ListsShortcutProps {
  lists: UserList[];
  isLoading: boolean;
}

export default function ListsShortcut({ lists, isLoading }: ListsShortcutProps) {
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
  const displayedLists = lists.slice(0, 3);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <List className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl text-primary">{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        ) : displayedLists.length > 0 ? (
          <div className="space-y-3">
            {displayedLists.map(list => (
              <Link key={list.id} href={`/dashboard/lists/${list.id}`} passHref>
                <Button variant="outline" className="w-full justify-between h-auto py-3">
                    <div>
                        <p className="font-semibold">{list.name}</p>
                        <p className="text-xs text-muted-foreground text-left">{list.wordCount || 0} {t.words}</p>
                    </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t.noLists}</p>
        )}
      </CardContent>
      <div className="p-6 pt-0">
         <Link href="/dashboard/lists" passHref>
            <Button className="w-full" variant="secondary">
                {t.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
         </Link>
      </div>
    </Card>
  );
}
