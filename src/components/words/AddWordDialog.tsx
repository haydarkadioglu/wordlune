
"use client";
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Word, WordCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit, Sparkles, Loader2 } from 'lucide-react';
import { generateExampleSentence } from '@/ai/flows/generate-example-sentence-flow';
import { useToast } from "@/hooks/use-toast";


const wordSchema = z.object({
  text: z.string().min(1, 'Word is required'),
  category: z.enum(['Bad', 'Good', 'Very Good'], { required_error: 'Category is required' }),
  pronunciationText: z.string().optional(),
  exampleSentence: z.string().min(1, 'Example sentence is required'),
});

type WordFormData = z.infer<typeof wordSchema>;

interface AddWordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveWord: (word: Omit<Word, 'id' | 'userId' | 'createdAt'>, id?: string) => void;
  editingWord?: Word | null;
}

const categories: WordCategory[] = ['Bad', 'Good', 'Very Good'];

export default function AddWordDialog({ isOpen, onOpenChange, onSaveWord, editingWord }: AddWordDialogProps) {
  const { control, register, handleSubmit, reset, formState: { errors }, getValues, setValue } = useForm<WordFormData>({
    resolver: zodResolver(wordSchema),
    defaultValues: {
      text: '',
      category: 'Good',
      pronunciationText: '',
      exampleSentence: '',
    },
  });
  const { toast } = useToast();
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);

  useEffect(() => {
    if (isOpen) { // Only reset form when dialog becomes visible or editingWord changes
      if (editingWord) {
        reset({
          text: editingWord.text,
          category: editingWord.category,
          pronunciationText: editingWord.pronunciationText || '',
          exampleSentence: editingWord.exampleSentence,
        });
      } else {
        reset({
          text: '',
          category: 'Good',
          pronunciationText: '',
          exampleSentence: '',
        });
      }
    }
  }, [editingWord, reset, isOpen]);

  const onSubmit = (data: WordFormData) => {
    onSaveWord(data, editingWord?.id);
    onOpenChange(false);
  };
  
  const handleDialogClose = () => {
    // reset(); // Reset form when dialog is closed, handled by useEffect on isOpen
    onOpenChange(false);
  };

  const handleGenerateExample = async () => {
    const wordText = getValues("text");
    if (!wordText) {
      toast({
        title: "Word Required",
        description: "Please enter a word before generating an example.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingExample(true);
    try {
      const result = await generateExampleSentence({ word: wordText });
      if (result.exampleSentence) {
        setValue("exampleSentence", result.exampleSentence, { shouldValidate: true });
        toast({
          title: "Example Generated",
          description: "An example sentence has been generated for you.",
        });
      } else {
        throw new Error("Empty response from AI.");
      }
    } catch (error) {
      console.error("Failed to generate example sentence:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate an example sentence. Please try again or write one manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExample(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[480px] bg-card shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary flex items-center">
            {editingWord ? <Edit className="mr-2 h-6 w-6" /> : <PlusCircle className="mr-2 h-6 w-6" />}
            {editingWord ? 'Edit Word' : 'Add New Word'}
          </DialogTitle>
          <DialogDescription>
            {editingWord ? 'Update the details for this word.' : 'Fill in the details for the new word you want to learn.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="text" className="font-semibold">Word</Label>
            <Input id="text" {...register('text')} placeholder="e.g., Serendipity" className="mt-1" />
            {errors.text && <p className="text-sm text-destructive mt-1">{errors.text.message}</p>}
          </div>

          <div>
            <Label htmlFor="category" className="font-semibold">Category</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <SelectTrigger id="category" className="w-full mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <Label htmlFor="pronunciationText" className="font-semibold">Pronunciation (Phonetic)</Label>
            <Input id="pronunciationText" {...register('pronunciationText')} placeholder="e.g., /ˌsɛrənˈdɪpɪti/" className="mt-1" />
          </div>
          
          <div>
            <Label htmlFor="pronunciationAudio" className="font-semibold">Pronunciation (Audio)</Label>
            <Input id="pronunciationAudio" type="file" disabled className="mt-1 file:text-sm file:font-medium file:text-primary file:bg-primary/10 file:border-0 file:rounded-md file:px-3 file:py-1.5 hover:file:bg-primary/20" />
            <p className="text-xs text-muted-foreground mt-1">Audio upload is a planned feature.</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="exampleSentence" className="font-semibold">Example Sentence</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateExample}
                disabled={isGeneratingExample}
                className="text-xs px-2 py-1 h-auto border-accent text-accent hover:bg-accent/10 hover:text-accent"
              >
                {isGeneratingExample ? (
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3 w-3" />
                )}
                Generate with AI
              </Button>
            </div>
            <Textarea 
              id="exampleSentence" 
              {...register('exampleSentence')} 
              placeholder="e.g., Finding a $20 bill in an old coat was a moment of serendipity." 
              className="mt-1" 
              disabled={isGeneratingExample}
            />
            {errors.exampleSentence && <p className="text-sm text-destructive mt-1">{errors.exampleSentence.message}</p>}
          </div>
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {editingWord ? 'Save Changes' : 'Save Word'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
