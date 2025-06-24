
import type { Word } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import CategoryLabel from './CategoryLabel';
import { Button } from '@/components/ui/button';
import { SpeakerIcon, Trash2, Edit3, Type } from 'lucide-react';

interface WordListItemProps {
  word: Word;
  onDelete: (id: string) => void;
  onEdit: (word: Word) => void;
}

export default function WordListItem({ word, onDelete, onEdit }: WordListItemProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-2xl text-primary">{word.text}</CardTitle>
            <div className="mt-1">
              <CategoryLabel category={word.category} />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(word)} aria-label="Edit word" className="text-muted-foreground hover:text-accent">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(word.id)} aria-label="Delete word" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {word.pronunciationText && (
          <div className="flex items-center space-x-2 mb-2 text-sm text-muted-foreground">
            <SpeakerIcon className="h-5 w-5 text-accent" />
            <span>{word.pronunciationText}</span>
          </div>
        )}
        {word.meaning && (
           <div className="flex items-center space-x-2 mb-3 text-sm text-muted-foreground">
            <Type className="h-5 w-5 text-accent" />
            <span>{word.meaning}</span>
          </div>
        )}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2 text-foreground/80">
              Usage Example
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pt-1 pb-2">
              {word.exampleSentence}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
