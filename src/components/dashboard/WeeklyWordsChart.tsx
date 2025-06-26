
"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { subDays, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSettings } from '@/hooks/useSettings';

const translations = {
  en: {
    title: 'Word Additions (Last 15 Days)',
    description: 'Total words added to your main collection and custom lists.',
    legend: 'Words Added',
  },
  tr: {
    title: 'Kelime Ekleme (Son 15 Gün)',
    description: 'Ana koleksiyonunuza ve özel listelerinize eklenen toplam kelime.',
    legend: 'Eklenen Kelime',
  }
};

interface WeeklyWordsChartProps {
  allWords: { createdAt: number }[];
}

const getChartDataFor15Days = (words: { createdAt: number }[], locale?: Locale) => {
  const data = [];
  const today = new Date();
  for (let i = 14; i >= 0; i--) {
    const day = subDays(today, i);
    const dayStr = format(day, 'MMM d', { locale }); 
    
    const wordsAddedOnDay = words.filter(word => {
      if (!word || !word.createdAt) return false;
      const wordDate = new Date(word.createdAt);
      return format(wordDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    }).length;

    data.push({ name: dayStr, wordsAdded: wordsAddedOnDay });
  }
  return data;
};


export default function WeeklyWordsChart({ allWords }: WeeklyWordsChartProps) {
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
  const locale = uiLanguage === 'tr' ? tr : undefined;
  const chartData = getChartDataFor15Days(allWords, locale);

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-4">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--foreground))" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)' 
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
            />
            <Legend wrapperStyle={{fontSize: "12px"}}/>
            <Bar dataKey="wordsAdded" fill="hsl(var(--primary))" name={t.legend} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
