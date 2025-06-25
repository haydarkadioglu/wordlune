
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const formSchema = z.object({
  word: z.string().min(1, { message: "Word is required." }),
  meaning: z.string().min(1, { message: "Meaning is required." }),
  example: z.string().min(3, { message: "Example sentence is required." }),
});

type FormData = z.infer<typeof formSchema>;

interface AddWordToListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
}

export default function AddWordToListDialog({ isOpen, onOpenChange, listId }: AddWordToListDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { targetLanguage } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
      meaning: "",
      example: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    if (!user || !listId) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addWordToList(user.uid, listId, {
        ...values,
        language: targetLanguage,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Word</DialogTitle>
          <DialogDescription>
            Enter the details for the new word.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="word">Word</Label>
            <Input id="word" {...form.register('word')} placeholder="e.g., Ubiquitous" />
            {form.formState.errors.word && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.word.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="meaning">Meaning (in {targetLanguage})</Label>
            <Input id="meaning" {...form.register('meaning')} placeholder="e.g., Yaygın" />
            {form.formState.errors.meaning && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.meaning.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="example">Example Sentence</Label>
            <Textarea id="example" {...form.register('example')} placeholder="e.g., Smartphones have become ubiquitous in modern society." />
            {form.formState.errors.example && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.example.message}</p>
            )}
          </div>
        
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Word
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
