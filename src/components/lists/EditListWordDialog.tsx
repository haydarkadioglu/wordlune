
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { updateWordInList } from '@/lib/list-service';
import type { ListWord } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const translations = {
  en: {
    title: 'Edit Word',
    description: 'Update the details for this word in your list.',
    wordLabel: 'Word',
    meaningLabel: 'Meaning',
    exampleLabel: 'Example Sentence',
    wordRequired: 'Word is required.',
    meaningRequired: 'Meaning is required.',
    exampleRequired: 'Example sentence is required.',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    updateFailed: 'Update Failed',
    updateFailedDesc: 'Could not update the word. Please try again.',
    updateSuccess: 'Word Updated!',
    updateSuccessDesc: (word: string) => `"${word}" has been successfully updated.`,
  },
  tr: {
    title: 'Kelimeyi Düzenle',
    description: 'Listedeki bu kelimenin ayrıntılarını güncelleyin.',
    wordLabel: 'Kelime',
    meaningLabel: 'Anlamı',
    exampleLabel: 'Örnek Cümle',
    wordRequired: 'Kelime alanı zorunludur.',
    meaningRequired: 'Anlam alanı zorunludur.',
    exampleRequired: 'Örnek cümle alanı zorunludur.',
    cancel: 'İptal',
    saveChanges: 'Değişiklikleri Kaydet',
    updateFailed: 'Güncelleme Başarısız',
    updateFailedDesc: 'Kelime güncellenemedi. Lütfen tekrar deneyin.',
    updateSuccess: 'Kelime Güncellendi!',
    updateSuccessDesc: (word: string) => `"${word}" başarıyla güncellendi.`,
  }
};

const getFormSchema = (lang: 'en' | 'tr') => {
  const t = translations[lang];
  return z.object({
    word: z.string().min(1, { message: t.wordRequired }),
    meaning: z.string().min(1, { message: t.meaningRequired }),
    example: z.string().min(3, { message: t.exampleRequired }),
  });
};

type FormData = z.infer<ReturnType<typeof getFormSchema>>;

interface EditListWordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  wordToEdit: ListWord | null;
}

export default function EditListWordDialog({ isOpen, onOpenChange, listId, wordToEdit }: EditListWordDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(getFormSchema(uiLanguage as 'en' | 'tr')),
    defaultValues: {
      word: "",
      meaning: "",
      example: "",
    },
  });

  useEffect(() => {
    if (wordToEdit) {
      form.reset({
        word: wordToEdit.word,
        meaning: wordToEdit.meaning,
        example: wordToEdit.example,
      });
    }
  }, [wordToEdit, form, isOpen]);

  const onSubmit = async (values: FormData) => {
    if (!user || !listId || !wordToEdit) {
      toast({ title: "Hata", description: "Kullanıcı doğrulanmadı veya liste/kelime bulunamadı.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateWordInList(user.uid, listId, wordToEdit.id, values);
      toast({
        title: t.updateSuccess,
        description: t.updateSuccessDesc(values.word),
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update word:", error);
      toast({ title: t.updateFailed, description: t.updateFailedDesc, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!wordToEdit) return null;

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
            <Input id="word" {...form.register('word')} />
            {form.formState.errors.word && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.word.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="meaning">{t.meaningLabel} ({wordToEdit.language})</Label>
            <Input id="meaning" {...form.register('meaning')} />
            {form.formState.errors.meaning && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.meaning.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="example">{t.exampleLabel}</Label>
            <Textarea id="example" {...form.register('example')} />
            {form.formState.errors.example && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.example.message}</p>
            )}
          </div>
        
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t.cancel}</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.saveChanges}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
