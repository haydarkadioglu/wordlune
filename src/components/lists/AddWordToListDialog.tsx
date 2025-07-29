
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { addWordToList } from '@/lib/list-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { useSettings, SUPPORTED_LANGUAGES } from '@/hooks/useSettings';
import { generateExampleSentence } from '@/ai/flows/generate-example-sentence-flow';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WordCategory } from '@/types';

const translations = {
  en: {
    title: 'Add New Word',
    description: 'Enter the details for the new word.',
    wordLabel: 'Word',
    wordPlaceholder: 'e.g., Ubiquitous',
    wordRequired: 'Word is required.',
    meaningLabel: 'Meaning',
    meaningRequired: 'Meaning is required.',
    exampleLabel: 'Example Sentence',
    exampleRequired: 'Example sentence is required.',
    categoryLabel: 'Category',
    targetLanguageLabel: 'Translate To',
    cancel: 'Cancel',
    addWord: 'Add Word',
    generate: 'Generate',
    translate: 'Translate',
    wordRequiredToast: 'Word Required',
    wordRequiredToastDesc: 'Please enter a word first.',
    genSuccessToast: 'Success',
    genExampleSuccess: 'Example sentence generated.',
    genTranslateSuccess: 'Translation generated.',
    genFailedToast: 'Generation Failed',
    genFailedToastDesc: (action: string) => `Could not generate ${action}.`,
    aiError: 'AI did not return a valid result.',
  },
  tr: {
    title: 'Yeni Kelime Ekle',
    description: 'Yeni kelime için ayrıntıları girin.',
    wordLabel: 'Kelime',
    wordPlaceholder: 'örn: Ubiquitous',
    wordRequired: 'Kelime alanı zorunludur.',
    meaningLabel: 'Anlamı',
    meaningRequired: 'Anlam alanı zorunludur.',
    exampleLabel: 'Örnek Cümle',
    exampleRequired: 'Örnek cümle zorunludur.',
    categoryLabel: 'Kategori',
    targetLanguageLabel: 'Çeviri Dili',
    cancel: 'İptal',
    addWord: 'Kelime Ekle',
    generate: 'Oluştur',
    translate: 'Çevir',
    wordRequiredToast: 'Kelime Gerekli',
    wordRequiredToastDesc: 'Lütfen önce bir kelime girin.',
    genSuccessToast: 'Başarılı',
    genExampleSuccess: 'Örnek cümle oluşturuldu.',
    genTranslateSuccess: 'Çeviri oluşturuldu.',
    genFailedToast: 'Oluşturma Başarısız',
    genFailedToastDesc: (action: string) => `${action} oluşturulamadı.`,
    aiError: 'Yapay zeka geçerli bir sonuç döndürmedi.',
  }
};

const allCategories: WordCategory[] = ['Uncategorized', 'Bad', 'Good', 'Very Good', 'Repeat'];

const getFormSchema = (lang: 'en' | 'tr') => {
  const t = translations[lang];
  return z.object({
    word: z.string().min(1, { message: t.wordRequired }),
    meaning: z.string().min(1, { message: t.meaningRequired }),
    example: z.string().min(3, { message: t.exampleRequired }),
    category: z.enum(allCategories)
  });
};


type FormData = z.infer<ReturnType<typeof getFormSchema>>;

interface AddWordToListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
}

export default function AddWordToListDialog({ isOpen, onOpenChange, listId }: AddWordToListDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sourceLanguage, targetLanguage, uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  const [dialogTargetLanguage, setDialogTargetLanguage] = useState(targetLanguage);

  const form = useForm<FormData>({
    resolver: zodResolver(getFormSchema(uiLanguage as 'en' | 'tr')),
    defaultValues: {
      word: "",
      meaning: "",
      example: "",
      category: 'Uncategorized'
    },
  });
  
  const wordValue = form.watch("word");

  useEffect(() => {
    if (isOpen) {
      setDialogTargetLanguage(targetLanguage);
    } else {
      // Reset form when dialog closes
      form.reset();
    }
  }, [isOpen, targetLanguage, form]);

  const onSubmit = async (values: FormData) => {
    if (!user || !listId) {
      toast({ title: "Error", description: "You must be logged in and select a list.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addWordToList(user.uid, sourceLanguage, listId, {
        ...values,
        language: dialogTargetLanguage,
      });
      toast({
        title: "Success!",
        description: `Word "${values.word}" has been added to the list.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add word:", error);
      toast({ title: "Error", description: "Could not add the word.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIGeneration = async (action: 'example' | 'translate', wordText: string) => {
    if (!wordText) {
      toast({
        title: t.wordRequiredToast,
        description: t.wordRequiredToastDesc,
        variant: "destructive",
      });
      return;
    }

    const setters = { example: setIsGeneratingExample, translate: setIsTranslating };
    const runningSetter = setters[action];
    runningSetter(true);

    try {
        if (action === 'example') {
            const result = await generateExampleSentence({ word: wordText });
            if (result.exampleSentence) {
                form.setValue('example', result.exampleSentence, { shouldValidate: true });
                toast({ title: t.genSuccessToast, description: t.genExampleSuccess });
            } else {
                throw new Error(t.aiError);
            }
        } else { // translate
            const result = await translateWord({ word: wordText, sourceLanguage, targetLanguage: dialogTargetLanguage });
            const meaning = result.translations?.join(', ');
             if (meaning) {
                form.setValue('meaning', meaning, { shouldValidate: true });
                toast({ title: t.genSuccessToast, description: t.genTranslateSuccess });
            } else {
                throw new Error(t.aiError);
            }
        }
    } catch (error) {
      console.error(`Failed to generate ${action}:`, error);
      toast({
        title: t.genFailedToast,
        description: error instanceof Error ? error.message : t.genFailedToastDesc(action),
        variant: "destructive",
      });
    } finally {
      runningSetter(false);
    }
  };

  const AiButton = ({ action, disabled, className }: { action: 'example' | 'translate', disabled: boolean, className?: string }) => (
    <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={() => handleAIGeneration(action, wordValue)}
        disabled={disabled || isSubmitting || !wordValue}
        className={`text-xs px-2 py-1 h-auto border-accent text-accent hover:bg-accent/10 hover:text-accent ${className}`}
    >
        {disabled ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1.5 h-3 w-3" />}
        {action === 'translate' ? t.translate : t.generate}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="word">{t.wordLabel}</Label>
            <Input id="word" {...form.register('word')} placeholder={t.wordPlaceholder} />
            {form.formState.errors.word && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.word.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1">
                <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="meaning">{t.meaningLabel}</Label>
                    <AiButton action="translate" disabled={isTranslating} />
                </div>
                <Input id="meaning" {...form.register('meaning')} placeholder="e.g., Yaygın" disabled={isTranslating} />
                {form.formState.errors.meaning && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.meaning.message}</p>
                )}
              </div>
              <div className="space-y-1">
                 <Label htmlFor="target-language">{t.targetLanguageLabel}</Label>
                 <Select value={dialogTargetLanguage} onValueChange={setDialogTargetLanguage}>
                    <SelectTrigger id="target-language">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="example">{t.exampleLabel}</Label>
              <AiButton action="example" disabled={isGeneratingExample} />
            </div>
            <Textarea id="example" {...form.register('example')} placeholder="e.g., Smartphones have become ubiquitous in modern society." disabled={isGeneratingExample} />
            {form.formState.errors.example && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.example.message}</p>
            )}
          </div>
        
          <div>
            <Label htmlFor="category">{t.categoryLabel}</Label>
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <SelectTrigger id="category" className="w-full mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || isGeneratingExample || isTranslating}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.addWord}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
