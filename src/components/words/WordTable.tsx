
import type { Word, WordCategory } from '@/types';
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

interface WordTableProps {
  words: Word[];
}

const categoryOrder: WordCategory[] = ['Very Good', 'Good', 'Bad'];

export default function WordTable({ words }: WordTableProps) {
  const { targetLanguage } = useSettings();

  const groupedWords = useMemo(() => {
    const groups: Partial<Record<WordCategory, Word[]>> = {};
    for (const word of words) {
      if (!groups[word.category]) {
        groups[word.category] = [];
      }
      groups[word.category]!.push(word);
    }
    // Sort words within each group alphabetically
    for (const category in groups) {
      groups[category as WordCategory]?.sort((a, b) => a.text.localeCompare(b.text));
    }
    return groups;
  }, [words]);

  const orderedCategories = categoryOrder.filter(cat => groupedWords[cat] && groupedWords[cat]!.length > 0);

  if (words.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">No words to display in the table. Add some words first!</p>;
  }

  return (
    <Accordion type="multiple" className="w-full space-y-4" defaultValue={orderedCategories}>
      {orderedCategories.map(category => (
        <AccordionItem key={category} value={category} className="border rounded-lg bg-card-foreground/5 px-4">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
            <div className="flex items-center gap-4">
              <span>{category}</span>
              <Badge variant="secondary">{groupedWords[category]?.length} words</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[15%]">Word</TableHead>
                    <TableHead className="w-[60%]">Example Sentence</TableHead>
                    <TableHead className="w-[25%]">Meaning ({targetLanguage})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedWords[category]?.map(word => (
                    <TableRow key={word.id}>
                      <TableCell className="font-medium">{word.text}</TableCell>
                      <TableCell className="text-muted-foreground">{word.exampleSentence}</TableCell>
                      <TableCell>{word.meaning}</TableCell>
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
