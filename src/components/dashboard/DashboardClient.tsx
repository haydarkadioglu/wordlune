
"use client";
import { useState, useMemo, useEffect } from 'react';
import type { Word, WordCategory } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, Filter, XCircle } from 'lucide-react';
import AddWordDialog from '@/components/words/AddWordDialog';
import WordList from '@/components/words/WordList';
import StatsDisplay from './StatsDisplay';
import WeeklyWordsChart from './WeeklyWordsChart';
import { useToast } from "@/hooks/use-toast";

// Sample data for initial state
const initialWords: Word[] = [
  { id: '1', text: 'Ephemeral', category: 'Good', pronunciationText: '/ɪˈfɛmərəl/', exampleSentence: 'The beauty of the cherry blossoms is ephemeral.', userId: 'sampleUser', createdAt: new Date('2024-07-15T10:00:00Z').getTime() },
  { id: '2', text: 'Ubiquitous', category: 'Very Good', pronunciationText: '/juːˈbɪkwɪtəs/', exampleSentence: 'Smartphones have become ubiquitous in modern society.', userId: 'sampleUser', createdAt: new Date('2024-07-16T11:00:00Z').getTime() },
  { id: '3', text: 'Obfuscate', category: 'Bad', pronunciationText: '/ˈɒbfʌskeɪt/', exampleSentence: 'The politician tried to obfuscate the issue with irrelevant details.', userId: 'sampleUser', createdAt: new Date('2024-07-17T12:00:00Z').getTime() },
];


export default function DashboardClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [words, setWords] = useState<Word[]>(initialWords); // Initialize with sample data
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<WordCategory | 'All'>('All');

  // Load words from localStorage if available (simple persistence example)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedWords = localStorage.getItem('wordclass_words');
      if (storedWords) {
        setWords(JSON.parse(storedWords));
      } else {
         setWords(initialWords); // Fallback to initial if nothing in localStorage
      }
    }
  }, []);

  // Save words to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wordclass_words', JSON.stringify(words));
    }
  }, [words]);


  const handleSaveWord = (newWordData: Omit<Word, 'id' | 'userId' | 'createdAt'>, id?: string) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save words.", variant: "destructive" });
      return;
    }

    if (id) { // Editing existing word
      setWords(words.map(w => w.id === id ? { ...w, ...newWordData, userId: user.uid } : w));
      toast({ title: "Word Updated", description: `"${newWordData.text}" has been updated.`});
    } else { // Adding new word
      const wordWithMeta: Word = {
        ...newWordData,
        id: Date.now().toString(), // Simple ID generation
        userId: user.uid,
        createdAt: Date.now(),
      };
      setWords([wordWithMeta, ...words]);
      toast({ title: "Word Added", description: `"${newWordData.text}" has been added to your list.`});
    }
    setEditingWord(null);
  };

  const handleDeleteWord = (id: string) => {
    const wordToDelete = words.find(w => w.id === id);
    setWords(words.filter(word => word.id !== id));
    if (wordToDelete) {
      toast({ title: "Word Deleted", description: `"${wordToDelete.text}" has been removed.`, variant: "destructive" });
    }
  };
  
  const handleEditWord = (word: Word) => {
    setEditingWord(word);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingWord(null); // Ensure not in edit mode
    setIsDialogOpen(true);
  };

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const matchesSearchTerm = word.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                word.exampleSentence.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || word.category === categoryFilter;
      return matchesSearchTerm && matchesCategory;
    });
  }, [words, searchTerm, categoryFilter]);
  
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
  };

  return (
    <div className="space-y-8">
      <StatsDisplay words={words} />
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="font-headline text-2xl text-primary">Your Words</CardTitle>
            <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Word
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card-foreground/5">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search words or examples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-grow sm:flex-grow-0 sm:w-48 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Select
                    value={categoryFilter}
                    onValueChange={(value) => setCategoryFilter(value as WordCategory | 'All')}
                >
                    <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="Very Good">Very Good</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Bad">Bad</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {(searchTerm || categoryFilter !== 'All') && (
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-primary">
                    <XCircle className="mr-2 h-4 w-4" /> Clear
                </Button>
            )}
          </div>
          <WordList words={filteredWords} onDeleteWord={handleDeleteWord} onEditWord={handleEditWord} />
        </CardContent>
      </Card>

      <WeeklyWordsChart words={words} />

      <AddWordDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSaveWord={handleSaveWord}
        editingWord={editingWord}
      />
    </div>
  );
}
