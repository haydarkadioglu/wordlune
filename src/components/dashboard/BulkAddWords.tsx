
"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import type { ProcessedWord } from '@/types';
import { bulkGenerateWordDetails } from '@/ai/flows/bulk-generate-word-details-flow';
import { useSettings } from '@/hooks/useSettings';

const bulkAddSchema = z.object({
  words: z.string().min(1, 'Please enter at least one word.'),
});

type BulkAddFormData = z.infer<typeof bulkAddSchema>;

interface BulkAddWordsProps {
  onBulkSave: (words: Omit<ProcessedWord, 'id' | 'createdAt' | 'category'>[]) => Promise<void>;
}

export default function BulkAddWords({ onBulkSave }: BulkAddWordsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { sourceLanguage, targetLanguage } = useSettings();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BulkAddFormData>({
    resolver: zodResolver(bulkAddSchema),
  });

  const onSubmit = async (data: BulkAddFormData) => {
    setIsProcessing(true);
    // Split by comma, trim whitespace, and filter out empty strings
    const wordsArray = data.words.split(',').map(word => word.trim()).filter(word => word.length > 0);

    if (wordsArray.length === 0) {
      toast({
        title: 'No words provided',
        description: 'Please enter words separated by commas.',
        variant: 'destructive',
      });
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
        await onBulkSave(result.processedWords);
        toast({
          title: 'Words Added!',
          description: `${result.processedWords.length} words have been processed and saved to your list.`,
        });
        reset(); // Clear the textarea
      } else {
        throw new Error("The AI didn't return any processed words.");
      }
    } catch (error) {
      console.error("Bulk add error:", error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : "An unknown error occurred while processing the words.",
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <UploadCloud className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl text-primary">Bulk Add Words</CardTitle>
            <CardDescription>Add multiple words at once, separated by commas.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Textarea
              {...register('words')}
              placeholder="e.g., ephemeral, ubiquitous, serendipity, benevolent..."
              className="min-h-[120px] text-base"
              disabled={isProcessing}
            />
            {errors.words && <p className="text-sm text-destructive mt-1">{errors.words.message}</p>}
          </div>
          <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Process & Add Words
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
