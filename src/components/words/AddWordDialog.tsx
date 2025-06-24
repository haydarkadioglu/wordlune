
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
import { PlusCircle, Edit, Sparkles, Loader2, Languages } from 'lucide-react';
import { generateExampleSentence } from '@/ai/flows/generate-example-sentence-flow';
import { generatePhoneticPronunciation } from '@/ai/flows/generate-phonetic-pronunciation-flow';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { useToast } from "@/hooks/use-toast";
import { useSettings } from '@/hooks/useSettings';


const wordSchema = z.object({
  text: z.string().min(1, 'Word is required'),
  category: z.enum(['Bad', 'Good', 'Very Good'], { required_error: 'Category is required' }),
  pronunciationText: z.string().optional(),
  meaning: z.string().optional(),
  exampleSentence: z.string().min(1, 'Example sentence is required'),
});

type WordFormData = z.infer<typeof wordSchema>;

interface AddWordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveWord: (word: Omit<Word, 'id' | 'userId' | 'createdAt'>, id?: string) => void;
  editingWord?: Word | null;
  preFilledWord?: Partial<Word> | null;
}

const categories: WordCategory[] = ['Bad', 'Good', 'Very Good'];

export default function AddWordDialog({ isOpen, onOpenChange, onSaveWord, editingWord, preFilledWord }: AddWordDialogProps) {
  const { control, register, handleSubmit, reset, formState: { errors }, getValues, setValue } = useForm<WordFormData>({
    resolver: zodResolver(wordSchema),
    defaultValues: {
      text: '',
      category: 'Good',
      pronunciationText: '',
      meaning: '',
      exampleSentence: '',
    },
  });
  const { toast } = useToast();
  const { sourceLanguage, targetLanguage } = useSettings();
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  const [isGeneratingPhonetic, setIsGeneratingPhonetic] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultValues = {
        text: '',
        category: 'Good' as WordCategory,
        pronunciationText: '',
        meaning: '',
        exampleSentence: '',
      };

      if (editingWord) {
        reset({ ...defaultValues, ...editingWord });
      } else if (preFilledWord) {
        reset({ ...defaultValues, ...preFilledWord });
      } else {
        reset(defaultValues);
      }
    }
  }, [editingWord, preFilledWord, reset, isOpen]);

  const onSubmit = (data: WordFormData) => {
    onSaveWord(data, editingWord?.id);
    onOpenChange(false);
  };
  
  const handleDialogClose = () => {
    onOpenChange(false);
  };

  const handleAIGeneration = async (
    action: 'example' | 'phonetic' | 'translate',
    wordText: string
  ) => {
    if (!wordText) {
      toast({
        title: "Word Required",
        description: "Please enter a word first.",
        variant: "destructive",
      });
      return;
    }

    const setters = {
        example: setIsGeneratingExample,
        phonetic: setIsGeneratingPhonetic,
        translate: setIsTranslating,
    };
    const runningSetter = setters[action];
    runningSetter(true);

    try {
        let result, fieldToSet, successMessage;
        if (action === 'example') {
            result = await generateExampleSentence({ word: wordText });
            fieldToSet = 'exampleSentence';
            successMessage = 'Example sentence generated.';
        } else if (action === 'phonetic') {
            result = await generatePhoneticPronunciation({ word: wordText });
            fieldToSet = 'pronunciationText';
            successMessage = 'Phonetic pronunciation generated.';
        } else { // translate
            result = await translateWord({ word: wordText, sourceLanguage, targetLanguage });
            fieldToSet = 'meaning';
            successMessage = 'Translation generated.';
        }

        const value = action === 'translate' ? (result as any).translations?.join(', ') : (result as any)[fieldToSet];
        
        if (value) {
            setValue(fieldToSet as any, value, { shouldValidate: true });
            toast({ title: "Success", description: successMessage });
        } else {
            throw new Error("AI did not return a valid result.");
        }
    } catch (error) {
      console.error(`Failed to generate ${action}:`, error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : `Could not generate ${action}.`,
        variant: "destructive",
      });
    } finally {
      runningSetter(false);
    }
  };

  const AiButton = ({ action, disabled, className }: { action: 'example' | 'phonetic' | 'translate', disabled: boolean, className?: string }) => (
    <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={() => handleAIGeneration(action, getValues("text"))}
        disabled={disabled}
        className={`text-xs px-2 py-1 h-auto border-accent text-accent hover:bg-accent/10 hover:text-accent ${className}`}
    >
        {disabled ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1.5 h-3 w-3" />}
        {action === 'translate' ? 'Translate' : 'Generate'}
    </Button>
  );

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

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="meaning" className="font-semibold">Meaning ({targetLanguage})</Label>
              <AiButton action="translate" disabled={isTranslating} />
            </div>
            <Input id="meaning" {...register('meaning')} placeholder="e.g., Tesadüf, Beklenmedik hoş buluş" className="mt-0" />
            {errors.meaning && <p className="text-sm text-destructive mt-1">{errors.meaning.message}</p>}
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

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="pronunciationText" className="font-semibold">Pronunciation (Phonetic)</Label>
              <AiButton action="phonetic" disabled={isGeneratingPhonetic} />
            </div>
            <Input 
              id="pronunciationText" 
              {...register('pronunciationText')} 
              placeholder="e.g., /ˌsɛrənˈdɪpɪti/" 
              className="mt-0" 
              disabled={isGeneratingPhonetic}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="exampleSentence" className="font-semibold">Example Sentence</Label>
              <AiButton action="example" disabled={isGeneratingExample} />
            </div>
            <Textarea 
              id="exampleSentence" 
              {...register('exampleSentence')} 
              placeholder="e.g., Finding a $20 bill in an old coat was a moment of serendipity." 
              className="mt-0" 
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
