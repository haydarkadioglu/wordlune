
"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { bulkGenerateWordDetails } from '@/ai/flows/bulk-generate-word-details-flow';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { addMultipleWordsToList } from '@/lib/list-service';

const translations = {
  en: {
    title: 'Bulk Add to List',
    description: 'Add multiple words at once, separated by commas. The AI will generate details for each.',
    placeholder: 'e.g., ephemeral, ubiquitous, serendipity, benevolent...',
    buttonText: 'Process & Add Words',
    cancel: 'Cancel',
    noWords: 'No words provided',
    noWordsDesc: 'Please enter words separated by commas.',
    wordsAdded: 'Words Added!',
    wordsAddedDesc: (count: number) => `${count} words have been processed and saved to your list.`,
    processingFailed: 'Processing Failed',
    atLeastOneWord: 'Please enter at least one word.',
    mustBeLoggedIn: 'You must be logged in to add words.',
    aiError: "The AI didn't return any processed words.",
  },
  tr: {
    title: 'Listeye Toplu Ekle',
    description: 'Virgülle ayırarak aynı anda birden fazla kelime ekleyin. Yapay zeka her biri için ayrıntı üretecektir.',
    placeholder: 'örn: ephemeral, ubiquitous, serendipity, benevolent...',
    buttonText: 'İşle ve Kelimeleri Ekle',
    cancel: 'İptal',
    noWords: 'Hiç kelime girilmedi',
    noWordsDesc: 'Lütfen virgülle ayrılmış kelimeler girin.',
    wordsAdded: 'Kelimeler Eklendi!',
    wordsAddedDesc: (count: number) => `${count} kelime işlendi ve listenize kaydedildi.`,
    processingFailed: 'İşlem Başarısız',
    atLeastOneWord: 'Lütfen en az bir kelime girin.',
    mustBeLoggedIn: 'Kelime eklemek için giriş yapmalısınız.',
    aiError: 'Yapay zeka işlenmiş kelime döndürmedi.',
  }
};

const getBulkAddSchema = (lang: 'en' | 'tr') => {
  const t = translations[lang];
  return z.object({
    words: z.string().min(1, t.atLeastOneWord),
  });
};

type BulkAddFormData = z.infer<ReturnType<typeof getBulkAddSchema>>;

interface BulkAddToListProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
}

export default function BulkAddToListDialog({ isOpen, onOpenChange, listId }: BulkAddToListProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { sourceLanguage, targetLanguage, uiLanguage } = useSettings();
  const { user } = useAuth();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BulkAddFormData>({
    resolver: zodResolver(getBulkAddSchema(uiLanguage as 'en' | 'tr')),
  });

  const onSubmit = async (data: BulkAddFormData) => {
    if (!user) {
        toast({ title: 'Error', description: t.mustBeLoggedIn, variant: 'destructive' });
        return;
    }

    setIsProcessing(true);
    const wordsArray = data.words.split(',').map(word => word.trim()).filter(word => word.length > 0);

    if (wordsArray.length === 0) {
      toast({ title: t.noWords, description: t.noWordsDesc, variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    try {
      const result = await bulkGenerateWordDetails({
        words: wordsArray,
        sourceLanguage,
        targetLanguage,
      });

      if (result.processedWords && result.processedWords.length > 0) {
        await addMultipleWordsToList(user.uid, listId, result.processedWords, targetLanguage);
        toast({ title: t.wordsAdded, description: t.wordsAddedDesc(result.processedWords.length) });
        reset(); 
        onOpenChange(false);
      } else {
        throw new Error(t.aiError);
      }
    } catch (error) {
      console.error("Bulk add to list error:", error);
      toast({
        title: t.processingFailed,
        description: error instanceof Error ? error.message : "An unknown error occurred while processing the words.",
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDialogClose = () => {
    if (!isProcessing) {
        reset();
        onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Textarea
              {...register('words')}
              placeholder={t.placeholder}
              className="min-h-[120px] text-base"
              disabled={isProcessing}
            />
            {errors.words && <p className="text-sm text-destructive mt-1">{errors.words.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isProcessing}>{t.cancel}</Button>
            </DialogClose>
            <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {t.buttonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
