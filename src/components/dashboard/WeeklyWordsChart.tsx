"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Word } from '@/types';
import { subDays, format, startOfWeek, isWithinInterval } from 'date-fns';

interface WeeklyWordsChartProps {
  words: Word[];
}

const getWeeklyData = (words: Word[]) => {
  const data = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = subDays(today, i);
    const dayStr = format(day, 'EEE'); // Mon, Tue, etc.
    
    const wordsAddedOnDay = words.filter(word => {
      const wordDate = new Date(word.createdAt);
      return format(wordDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    }).length;

    data.push({ name: dayStr, wordsAdded: wordsAddedOnDay });
  }
  return data;
};


export default function WeeklyWordsChart({ words }: WeeklyWordsChartProps) {
  const chartData = getWeeklyData(words);

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-4">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">Weekly Word Additions</CardTitle>
        <CardDescription>Words added in the last 7 days.</CardDescription>
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
            <Bar dataKey="wordsAdded" fill="hsl(var(--primary))" name="Words Added" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
