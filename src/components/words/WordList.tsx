
import type { Word, WordCategory } from '@/types';
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
  words: Word[];
  onDeleteWord: (id: string) => void;
  onEditWord: (word: Word) => void;
  onUpdateCategory: (id: string, category: WordCategory) => void;
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
        <WordListItem key={word.id} word={word} onDelete={onDeleteWord} onEdit={onEditWord} onUpdateCategory={onUpdateCategory} />
      ))}
    </div>
  );
}
