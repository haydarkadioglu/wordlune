import type { Word, WordCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, Smile, Meh, Frown } from 'lucide-react';

interface StatsDisplayProps {
  words: Word[];
}

export default function StatsDisplay({ words }: StatsDisplayProps) {
  const totalWords = words.length;
  const wordsByCategory = words.reduce((acc, word) => {
    acc[word.category] = (acc[word.category] || 0) + 1;
    return acc;
  }, {} as Record<WordCategory, number>);

  const stats = [
    { title: 'Total Words', value: totalWords, icon: <BookMarked className="h-6 w-6 text-primary" />, color: "text-primary" },
    { title: 'Very Good', value: wordsByCategory['Very Good'] || 0, icon: <Smile className="h-6 w-6 text-green-500" />, color: "text-green-500" },
    { title: 'Good', value: wordsByCategory['Good'] || 0, icon: <Meh className="h-6 w-6 text-sky-500" />, color: "text-sky-500" },
    { title: 'Bad', value: wordsByCategory['Bad'] || 0, icon: <Frown className="h-6 w-6 text-red-500" />, color: "text-red-500" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
