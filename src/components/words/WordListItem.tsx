
import type { ListWord, WordCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Trash2, Edit3, Type } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';


const translations = {
  en: {
    editWord: 'Edit word',
    deleteWord: 'Delete word',
    usageExample: 'Usage Example',
    changeCategory: 'Change Category',
    list: 'List'
  },
  tr: {
    editWord: 'Kelimeyi düzenle',
    deleteWord: 'Kelimeyi sil',
    usageExample: 'Kullanım Örneği',
    changeCategory: 'Kategoriyi Değiştir',
    list: 'Liste'
  }
}

interface WordListItemProps {
  word: ListWord & { listName: string };
  onDelete: () => void;
  onEdit: () => void;
  onUpdateCategory: (category: WordCategory) => void;
}

const categoryStyles: Record<WordCategory, string> = {
  'Very Good': 'bg-green-500 hover:bg-green-600 text-white border-green-600',
  'Good': 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600',
  'Bad': 'bg-red-500 hover:bg-red-600 text-white border-red-600',
  'Repeat': 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600',
  'Uncategorized': 'bg-gray-400 hover:bg-gray-500 text-white border-gray-600',
};

const allCategories: WordCategory[] = ['Uncategorized', 'Bad', 'Good', 'Very Good', 'Repeat'];


export default function WordListItem({ word, onDelete, onEdit, onUpdateCategory }: WordListItemProps) {
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-2xl text-primary">{word.word}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">{t.list}: {word.listName}</CardDescription>
            <div className="mt-2">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className={cn("px-2.5 py-1 text-xs font-semibold rounded-full h-auto", categoryStyles[word.category])}
                    aria-label={t.changeCategory}
                  >
                    {word.category}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={word.category}
                    onValueChange={(value) => onUpdateCategory(value as WordCategory)}
                  >
                    {allCategories.map(cat => (
                        <DropdownMenuRadioItem key={cat} value={cat}>{cat}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label={t.editWord} className="text-muted-foreground hover:text-accent">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} aria-label={t.deleteWord} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div>
          {word.meaning && (
            <div className="flex items-center space-x-2 mb-3 text-sm text-muted-foreground">
              <Type className="h-5 w-5 text-accent" />
              <span>{word.meaning}</span>
            </div>
          )}
        </div>
        <Accordion type="single" collapsible className="w-full mt-auto">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2 text-foreground/80">
              {t.usageExample}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pt-1 pb-2">
              {word.example}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
