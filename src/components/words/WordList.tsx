import type { Word } from '@/types';
import WordListItem from './WordListItem';

interface WordListProps {
  words: Word[];
  onDeleteWord: (id: string) => void;
  onEditWord: (word: Word) => void;
}

export default function WordList({ words, onDeleteWord, onEditWord }: WordListProps) {
  if (words.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">No words saved yet. Add your first word!</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
      {words.map((word) => (
        <WordListItem key={word.id} word={word} onDelete={onDeleteWord} onEdit={onEditWord} />
      ))}
    </div>
  );
}
