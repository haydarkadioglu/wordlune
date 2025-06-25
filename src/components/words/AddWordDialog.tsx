
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
import { generatePhoneticPronunciation } from '@/ai/flows/generate-phonetic-pronunciation-flow';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { useToast } from "@/hooks/use-toast";
import { useSettings } from '@/hooks/useSettings';

const translations = {
  en: {
    editWordTitle: 'Edit Word',
    addWordTitle: 'Add New Word',
    editWordDesc: 'Update the details for this word.',
    addWordDesc: 'Fill in the details for the new word you want to learn.',
    wordLabel: 'Word',
    wordPlaceholder: 'e.g., Serendipity',
    wordRequired: 'Word is required',
    meaningLabel: 'Meaning',
    meaningPlaceholder: 'e.g., Fortunate discovery by chance',
    categoryLabel: 'Category',
    categoryRequired: 'Category is required',
    categoryPlaceholder: 'Select category',
    pronunciationLabel: 'Pronunciation (Phonetic)',
    pronunciationPlaceholder: 'e.g., /ˌsɛrənˈdɪpɪti/',
    exampleSentenceLabel: 'Example Sentence',
    exampleSentencePlaceholder: 'e.g., Finding a $20 bill in an old coat was a moment of serendipity.',
    exampleSentenceRequired: 'Example sentence is required',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saveWord: 'Save Word',
    generate: 'Generate',
    translate: 'Translate',
    wordRequiredToast: 'Word Required',
    wordRequiredToastDesc: 'Please enter a word first.',
    genSuccessToast: 'Success',
    genExampleSuccess: 'Example sentence generated.',
    genPhoneticSuccess: 'Phonetic pronunciation generated.',
    genTranslateSuccess: 'Translation generated.',
    genFailedToast: 'Generation Failed',
    genFailedToastDesc: (action: string) => `Could not generate ${action}.`,
    aiError: 'AI did not return a valid result.',
  },
  tr: {
    editWordTitle: 'Kelimeyi Düzenle',
    addWordTitle: 'Yeni Kelime Ekle',
    editWordDesc: 'Bu kelimenin ayrıntılarını güncelleyin.',
    addWordDesc: 'Öğrenmek istediğiniz yeni kelimenin ayrıntılarını girin.',
    wordLabel: 'Kelime',
    wordPlaceholder: 'örn: Serendipity',
    wordRequired: 'Kelime alanı zorunludur',
    meaningLabel: 'Anlamı',
    meaningPlaceholder: 'örn: Tesadüf, şans eseri değerli bir şey bulma',
    categoryLabel: 'Kategori',
    categoryRequired: 'Kategori alanı zorunludur',
    categoryPlaceholder: 'Kategori seçin',
    pronunciationLabel: 'Telaffuz (Fonetik)',
    pronunciationPlaceholder: 'örn: /ˌsɛrənˈdɪpɪti/',
    exampleSentenceLabel: 'Örnek Cümle',
    exampleSentencePlaceholder: 'örn: Finding a $20 bill in an old coat was a moment of serendipity.',
    exampleSentenceRequired: 'Örnek cümle zorunludur',
    cancel: 'İptal',
    saveChanges: 'Değişiklikleri Kaydet',
    saveWord: 'Kelimeyi Kaydet',
    generate: 'Oluştur',
    translate: 'Çevir',
    wordRequiredToast: 'Kelime Gerekli',
    wordRequiredToastDesc: 'Lütfen önce bir kelime girin.',
    genSuccessToast: 'Başarılı',
    genExampleSuccess: 'Örnek cümle oluşturuldu.',
    genPhoneticSuccess: 'Fonetik telaffuz oluşturuldu.',
    genTranslateSuccess: 'Çeviri oluşturuldu.',
    genFailedToast: 'Oluşturma Başarısız',
    genFailedToastDesc: (action: string) => `${action} oluşturulamadı.`,
    aiError: 'Yapay zeka geçerli bir sonuç döndürmedi.',
  }
};

const getWordSchema = (lang: 'en' | 'tr') => {
  const t = translations[lang];
  return z.object({
    text: z.string().min(1, t.wordRequired),
    category: z.enum(['Bad', 'Good', 'Very Good'], { required_error: t.categoryRequired }),
    pronunciationText: z.string().optional(),
    meaning: z.string().optional(),
    exampleSentence: z.string().min(1, t.exampleSentenceRequired),
  });
};

type WordFormData = z.infer<ReturnType<typeof getWordSchema>>;

interface AddWordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveWord: (word: Omit<Word, 'id' | 'createdAt'>, id?: string) => void;
  editingWord?: Word | null;
  preFilledWord?: Partial<Word> | null;
}

const categories: WordCategory[] = ['Bad', 'Good', 'Very Good'];

export default function AddWordDialog({ isOpen, onOpenChange, onSaveWord, editingWord, preFilledWord }: AddWordDialogProps) {
  const { toast } = useToast();
  const { sourceLanguage, targetLanguage, uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const { control, register, handleSubmit, reset, formState: { errors }, getValues, setValue } = useForm<WordFormData>({
    resolver: zodResolver(getWordSchema(uiLanguage as 'en' | 'tr')),
    defaultValues: {
      text: '',
      category: 'Good',
      pronunciationText: '',
      meaning: '',
      exampleSentence: '',
    },
  });

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
        title: t.wordRequiredToast,
        description: t.wordRequiredToastDesc,
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
            successMessage = t.genExampleSuccess;
        } else if (action === 'phonetic') {
            result = await generatePhoneticPronunciation({ word: wordText });
            fieldToSet = 'pronunciationText';
            successMessage = t.genPhoneticSuccess;
        } else { // translate
            result = await translateWord({ word: wordText, sourceLanguage, targetLanguage });
            fieldToSet = 'meaning';
            successMessage = t.genTranslateSuccess;
        }

        const value = action === 'translate' ? (result as any).translations?.join(', ') : (result as any)[fieldToSet];
        
        if (value) {
            setValue(fieldToSet as any, value, { shouldValidate: true });
            toast({ title: t.genSuccessToast, description: successMessage });
        } else {
            throw new Error(t.aiError);
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
        {action === 'translate' ? t.translate : t.generate}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[480px] bg-card shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary flex items-center">
            {editingWord ? <Edit className="mr-2 h-6 w-6" /> : <PlusCircle className="mr-2 h-6 w-6" />}
            {editingWord ? t.editWordTitle : t.addWordTitle}
          </DialogTitle>
          <DialogDescription>
            {editingWord ? t.editWordDesc : t.addWordDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="text" className="font-semibold">{t.wordLabel}</Label>
            <Input id="text" {...register('text')} placeholder={t.wordPlaceholder} className="mt-1" />
            {errors.text && <p className="text-sm text-destructive mt-1">{errors.text.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="meaning" className="font-semibold">{t.meaningLabel} ({targetLanguage})</Label>
              <AiButton action="translate" disabled={isTranslating} />
            </div>
            <Input id="meaning" {...register('meaning')} placeholder={t.meaningPlaceholder} className="mt-0" />
            {errors.meaning && <p className="text-sm text-destructive mt-1">{errors.meaning.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="category" className="font-semibold">{t.categoryLabel}</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <SelectTrigger id="category" className="w-full mt-1">
                    <SelectValue placeholder={t.categoryPlaceholder} />
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
              <Label htmlFor="pronunciationText" className="font-semibold">{t.pronunciationLabel}</Label>
              <AiButton action="phonetic" disabled={isGeneratingPhonetic} />
            </div>
            <Input 
              id="pronunciationText" 
              {...register('pronunciationText')} 
              placeholder={t.pronunciationPlaceholder}
              className="mt-0" 
              disabled={isGeneratingPhonetic}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="exampleSentence" className="font-semibold">{t.exampleSentenceLabel}</Label>
              <AiButton action="example" disabled={isGeneratingExample} />
            </div>
            <Textarea 
              id="exampleSentence" 
              {...register('exampleSentence')} 
              placeholder={t.exampleSentencePlaceholder}
              className="mt-0" 
              disabled={isGeneratingExample}
            />
            {errors.exampleSentence && <p className="text-sm text-destructive mt-1">{errors.exampleSentence.message}</p>}
          </div>
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleDialogClose}>{t.cancel}</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {editingWord ? t.saveChanges : t.saveWord}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
