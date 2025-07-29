
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Languages, PlusCircle, ArrowRightLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { useSettings, SUPPORTED_LANGUAGES } from '@/hooks/useSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserList } from '@/types';

const translations = {
    en: {
        title: 'Quick Translator',
        description: 'Select a list, translate a word, and add it.',
        from: 'From',
        to: 'To',
        swapLanguages: 'Swap languages',
        placeholder: (lang: string) => `Translate a word from ${lang}...`,
        translateButton: 'Translate',
        noTranslations: 'No Translations Found',
        noTranslationsDesc: (word: string) => `Could not find any translations for "${word}".`,
        translationFailed: 'Translation Failed',
        translationsFor: (word: string, lang: string) => `Translations for "${word}" in ${lang}`,
        addWordAria: (meaning: string) => `Add ${meaning} to words`,
        enterWord: 'Please enter a word to translate.',
        selectList: 'Select a list',
        noListSelected: 'No list selected. Please select a list from the dropdown.',
        noListDesc: 'You must select a list to add words to.'
    },
    tr: {
        title: 'Hızlı Çevirmen',
        description: 'Bir liste seçin, bir kelimeyi çevirin ve ekleyin.',
        from: 'Kaynak Dil',
        to: 'Hedef Dil',
        swapLanguages: 'Dilleri değiştir',
        placeholder: (lang: string) => `${lang} dilinden bir kelime çevir...`,
        translateButton: 'Çevir',
        noTranslations: 'Çeviri Bulunamadı',
        noTranslationsDesc: (word: string) => `"${word}" için çeviri bulunamadı.`,
        translationFailed: 'Çeviri Başarısız',
        translationsFor: (word: string, lang: string) => `"${word}" için ${lang} dilindeki çeviriler`,
        addWordAria: (meaning: string) => `${meaning} kelimesini listeye ekle`,
        enterWord: 'Lütfen çevirmek için bir kelime girin.',
        selectList: 'Bir liste seçin',
        noListSelected: 'Liste seçilmedi. Lütfen açılır menüden bir liste seçin.',
        noListDesc: 'Kelime eklemek için bir liste seçmelisiniz.'
    }
};

const getTranslateSchema = (lang: 'en' | 'tr') => {
    const t = translations[lang];
    return z.object({
        word: z.string().min(1, t.enterWord),
    });
};

type TranslateFormData = z.infer<ReturnType<typeof getTranslateSchema>>;

interface QuickTranslatorProps {
    onAddWord: (word: string, meaning: string) => void;
    listId: string | null;
    lists: UserList[];
    setListId: (id: string) => void;
}

export default function QuickTranslator({ onAddWord, listId, lists, setListId }: QuickTranslatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [translationsResult, setTranslationsResult] = useState<string[]>([]);
  const { toast } = useToast();
  const settings = useSettings();
  const { uiLanguage } = settings;
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const [localSourceLanguage, setLocalSourceLanguage] = useState(settings.sourceLanguage);
  const [localTargetLanguage, setLocalTargetLanguage] = useState(settings.targetLanguage);

  useEffect(() => {
    setLocalSourceLanguage(settings.sourceLanguage);
    setLocalTargetLanguage(settings.targetLanguage);
  }, [settings.sourceLanguage, settings.targetLanguage]);
  
  const { register, handleSubmit, formState: { errors }, getValues } = useForm<TranslateFormData>({
    resolver: zodResolver(getTranslateSchema(uiLanguage as 'en' | 'tr')),
  });

  const handleTranslate = async (data: TranslateFormData) => {
    setIsLoading(true);
    setTranslationsResult([]);
    try {
      const result = await translateWord({ 
        word: data.word, 
        sourceLanguage: localSourceLanguage,
        targetLanguage: localTargetLanguage 
      });
      if (result.translations && result.translations.length > 0) {
        setTranslationsResult(result.translations);
      } else {
        toast({
          title: t.noTranslations,
          description: t.noTranslationsDesc(data.word),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: t.translationFailed,
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    const temp = localSourceLanguage;
    setLocalSourceLanguage(localTargetLanguage);
    setLocalTargetLanguage(temp);
  };

  const handleAddClick = (meaning: string) => {
    if (!listId) {
        toast({ title: t.noListSelected, description: t.noListDesc, variant: 'destructive' });
        return;
    }
    onAddWord(getValues('word'), meaning);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Languages className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl text-primary">{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={listId ?? ""} onValueChange={setListId}>
            <SelectTrigger>
                <SelectValue placeholder={t.selectList} />
            </SelectTrigger>
            <SelectContent>
                {lists.map(list => (
                    <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="w-full sm:flex-1">
             <Select value={localSourceLanguage} onValueChange={setLocalSourceLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder={t.from} />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={`source-${lang}`} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          <Button variant="ghost" size="icon" onClick={handleSwapLanguages} className="text-primary hover:text-accent flex-shrink-0" aria-label={t.swapLanguages}>
            <ArrowRightLeft className="h-5 w-5" />
          </Button>

          <div className="w-full sm:flex-1">
             <Select value={localTargetLanguage} onValueChange={setLocalTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder={t.to} />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={`target-${lang}`} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(handleTranslate)} className="flex items-start gap-4">
          <div className="flex-grow">
            <Input 
              {...register('word')} 
              placeholder={t.placeholder(localSourceLanguage)}
              className="text-base"
            />
            {errors.word && <p className="text-sm text-destructive mt-1">{errors.word.message}</p>}
          </div>
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {t.translateButton}
          </Button>
        </form>

        {translationsResult.length > 0 && (
          <div className="mt-2">
            <h4 className="font-semibold text-lg text-foreground mb-3">{t.translationsFor(getValues('word'), localTargetLanguage)}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {translationsResult.map((meaning, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">{meaning}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleAddClick(meaning)}
                    aria-label={t.addWordAria(meaning)}
                    >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
