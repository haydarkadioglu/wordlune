
import type { ListWord, WordCategory } from '@/types';
import WordListItem from './WordListItem';
import { useSettings } from '@/hooks/useSettings';

const translations = {
  en: {
    noWords: 'No words saved yet. Add your first word!',
    noResults: 'No words match your current filters.',
  },
  tr: {
    noWords: 'Henüz kaydedilmiş kelime yok. İlk kelimenizi ekleyin!',
    noResults: 'Mevcut filtrelere uyan kelime bulunamadı.',
  }
}

interface WordListProps {
  words: (ListWord & { listId: string; listName: string })[];
  onDeleteWord: (listId: string, wordId: string) => void;
  onEditWord: (word: ListWord & { listId: string }) => void;
  onUpdateCategory: (listId: string, wordId: string, category: WordCategory) => void;
}

export default function WordList({ words, onDeleteWord, onEditWord, onUpdateCategory }: WordListProps) {
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
  if (words.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">{t.noResults}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
      {words.map((word) => (
        <WordListItem 
            key={`${word.listId}-${word.id}`} 
            word={word} 
            onDelete={() => onDeleteWord(word.listId, word.id)} 
            onEdit={() => onEditWord(word)} 
            onUpdateCategory={(category) => onUpdateCategory(word.listId, word.id, category)} 
        />
      ))}
    </div>
  );
}
