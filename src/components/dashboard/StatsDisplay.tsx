
import type { ListWord, WordCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, Smile, Meh, Frown, Repeat, Tag } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import Link from 'next/link';

const translations = {
  en: {
    totalWords: 'Total Words',
    uncategorized: 'Uncategorized',
    repeat: 'Repeat',
  },
  tr: {
    totalWords: 'Toplam Kelime',
    uncategorized: 'Etiketsiz',
    repeat: 'Tekrar Et',
  }
}

interface StatsDisplayProps {
  words: ListWord[];
}

export default function StatsDisplay({ words }: StatsDisplayProps) {
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
  const totalWords = words.length;
  const wordsByCategory = words.reduce((acc, word) => {
    const category = word.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<WordCategory, number>);

  const stats = [
    { title: t.totalWords, value: totalWords, icon: <BookMarked className="h-6 w-6 text-primary" />, color: "text-primary", category: 'All' },
    { title: 'Very Good', value: wordsByCategory['Very Good'] || 0, icon: <Smile className="h-6 w-6 text-green-500" />, color: "text-green-500", category: 'Very Good' },
    { title: 'Good', value: wordsByCategory['Good'] || 0, icon: <Meh className="h-6 w-6 text-sky-500" />, color: "text-sky-500", category: 'Good' },
    { title: 'Bad', value: wordsByCategory['Bad'] || 0, icon: <Frown className="h-6 w-6 text-red-500" />, color: "text-red-500", category: 'Bad' },
    { title: t.repeat, value: wordsByCategory['Repeat'] || 0, icon: <Repeat className="h-6 w-6 text-orange-500" />, color: "text-orange-500", category: 'Repeat' },
    { title: t.uncategorized, value: wordsByCategory['Uncategorized'] || 0, icon: <Tag className="h-6 w-6 text-gray-500" />, color: "text-gray-500", category: 'Uncategorized' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
         <Link key={stat.title} href={`/dashboard/words?category=${stat.category}`} className="block">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
