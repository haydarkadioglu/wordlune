
import type { ListWord, WordCategory } from '@/types';
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '../ui/badge';
import { useSettings } from '@/hooks/useSettings';

const translations = {
  en: {
    wordsBadge: (count: number) => `${count} words`,
    wordHeader: 'Word',
    exampleHeader: 'Example Sentence',
    meaningHeader: (lang: string) => `Meaning (${lang})`,
    listHeader: 'List',
    noWords: 'No words to display in the table. Add some words first!',
  },
  tr: {
    wordsBadge: (count: number) => `${count} kelime`,
    wordHeader: 'Kelime',
    exampleHeader: 'Örnek Cümle',
    meaningHeader: (lang: string) => `Anlamı (${lang})`,
    listHeader: 'Liste',
    noWords: 'Tabloda gösterilecek kelime yok. Önce birkaç kelime ekleyin!',
  }
}

interface WordTableProps {
  words: (ListWord & { listName: string })[];
}

const categoryOrder: WordCategory[] = ['Very Good', 'Good', 'Bad', 'Repeat', 'Uncategorized'];

export default function WordTable({ words }: WordTableProps) {
  const { targetLanguage, uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const groupedWords = useMemo(() => {
    const groups: Partial<Record<WordCategory, (ListWord & { listName: string })[]>> = {};
    for (const word of words) {
      const category = word.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category]!.push(word);
    }
    // Sort words within each group alphabetically
    for (const category in groups) {
      groups[category as WordCategory]?.sort((a, b) => a.word.localeCompare(b.word));
    }
    return groups;
  }, [words]);

  const orderedCategories = categoryOrder.filter(cat => groupedWords[cat] && groupedWords[cat]!.length > 0);

  if (words.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">{t.noWords}</p>;
  }

  return (
    <Accordion type="multiple" className="w-full space-y-4" defaultValue={orderedCategories}>
      {orderedCategories.map(category => (
        <AccordionItem key={category} value={category} className="border rounded-lg bg-card-foreground/5 px-4">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
            <div className="flex items-center gap-4">
              <span>{category}</span>
              <Badge variant="secondary">{t.wordsBadge(groupedWords[category]?.length || 0)}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[15%]">{t.wordHeader}</TableHead>
                    <TableHead className="w-[50%]">{t.exampleHeader}</TableHead>
                    <TableHead className="w-[20%]">{t.meaningHeader(targetLanguage)}</TableHead>
                    <TableHead className="w-[15%]">{t.listHeader}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedWords[category]?.map(word => (
                    <TableRow key={word.id}>
                      <TableCell className="font-medium">{word.word}</TableCell>
                      <TableCell className="text-muted-foreground">{word.example}</TableCell>
                      <TableCell>{word.meaning}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{word.listName}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
