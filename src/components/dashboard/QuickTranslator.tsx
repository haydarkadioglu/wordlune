
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

const translateSchema = z.object({
  word: z.string().min(1, 'Please enter a word to translate.'),
});

type TranslateFormData = z.infer<typeof translateSchema>;

interface QuickTranslatorProps {
    onAddWord: (word: string, meaning: string) => void;
}

export default function QuickTranslator({ onAddWord }: QuickTranslatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [translations, setTranslations] = useState<string[]>([]);
  const { toast } = useToast();
  const settings = useSettings();

  const [localSourceLanguage, setLocalSourceLanguage] = useState(settings.sourceLanguage);
  const [localTargetLanguage, setLocalTargetLanguage] = useState(settings.targetLanguage);

  useEffect(() => {
    // Sync with global settings if they change
    setLocalSourceLanguage(settings.sourceLanguage);
    setLocalTargetLanguage(settings.targetLanguage);
  }, [settings.sourceLanguage, settings.targetLanguage]);
  
  const { register, handleSubmit, formState: { errors }, getValues } = useForm<TranslateFormData>({
    resolver: zodResolver(translateSchema),
  });

  const handleTranslate = async (data: TranslateFormData) => {
    setIsLoading(true);
    setTranslations([]);
    try {
      const result = await translateWord({ 
        word: data.word, 
        sourceLanguage: localSourceLanguage,
        targetLanguage: localTargetLanguage 
      });
      if (result.translations && result.translations.length > 0) {
        setTranslations(result.translations);
      } else {
        toast({
          title: 'No Translations Found',
          description: `Could not find any translations for "${data.word}".`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: 'Translation Failed',
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Languages className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl text-primary">Quick Translator</CardTitle>
            <CardDescription>Translate a word and add it to your list.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <div className="w-full sm:flex-1">
             <Select value={localSourceLanguage} onValueChange={setLocalSourceLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={`source-${lang}`} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          <Button variant="ghost" size="icon" onClick={handleSwapLanguages} className="text-primary hover:text-accent flex-shrink-0" aria-label="Swap languages">
            <ArrowRightLeft className="h-5 w-5" />
          </Button>

          <div className="w-full sm:flex-1">
             <Select value={localTargetLanguage} onValueChange={setLocalTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="To" />
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
              placeholder={`Translate a word from ${localSourceLanguage}...`} 
              className="text-base"
            />
            {errors.word && <p className="text-sm text-destructive mt-1">{errors.word.message}</p>}
          </div>
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Translate
          </Button>
        </form>

        {translations.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-lg text-foreground mb-3">Translations for "{getValues('word')}" in {localTargetLanguage}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {translations.map((meaning, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">{meaning}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => onAddWord(getValues('word'), meaning)}
                    aria-label={`Add ${meaning} to words`}
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
