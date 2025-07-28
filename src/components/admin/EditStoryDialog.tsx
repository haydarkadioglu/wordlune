
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Story } from '@/types';
import { upsertStory } from '@/lib/stories-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SUPPORTED_LANGUAGES } from '@/hooks/useSettings';

const storySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
<<<<<<< HEAD
  language: z.string().min(1, "Language is required."),
  level: z.string().min(1, "Level is required (e.g., A1, B2)."),
  category: z.string().min(2, "Category is required (e.g., Fantasy)."),
=======
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  category: z.enum(['Adventure', 'Romance', 'Mystery', 'Science Fiction', 'Fantasy', 'Comedy', 'Drama', 'Horror']),
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
  content: z.string().min(20, "Story content must be at least 20 characters."),
});

type StoryFormData = z.infer<typeof storySchema>;

interface EditStoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  story: Story | null;
}

<<<<<<< HEAD
=======
const levels: Story['level'][] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const categories: Story['category'][] = ['Adventure', 'Romance', 'Mystery', 'Science Fiction', 'Fantasy', 'Comedy', 'Drama', 'Horror'];

>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
export default function EditStoryDialog({ isOpen, onOpenChange, story }: EditStoryDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!story;
  
  const form = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: "",
<<<<<<< HEAD
      language: "English",
      level: "",
      category: "",
=======
      level: "A1",
      category: "Adventure",
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
      content: "",
    },
  });

  useEffect(() => {
<<<<<<< HEAD
    if (story) {
      form.reset({
        title: story.title,
        language: story.language,
        level: story.level,
        category: story.category,
        content: story.content,
      });
    } else {
      form.reset({
        title: "",
        language: "English",
        level: "",
        category: "",
        content: "",
      });
=======
    if (isOpen) {
      if (story) {
        form.reset({
          title: story.title,
          level: story.level,
          category: story.category,
          content: story.content,
        });
      } else {
        form.reset({
          title: "",
          level: "A1",
          category: "Adventure",
          content: "",
        });
      }
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
    }
  }, [story, form, isOpen]);

  const onSubmit = async (values: StoryFormData) => {
    setIsSubmitting(true);
    try {
        await upsertStory(values, story?.id);
        toast({
            title: isEditing ? "Story Updated!" : "Story Created!",
            description: `The story "${values.title}" has been saved.`,
        });
        form.reset(); // Reset form after successful save
        onOpenChange(false);
    } catch (error) {
        console.error("Failed to save story:", error);
        toast({ title: "Error", description: "Could not save the story.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset(); // Reset form when dialog closes
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Story' : 'Create New Story'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this story.' : 'Fill in the details for the new story.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          
           <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Level (e.g., A1, B2)</Label>
                <Input id="level" {...form.register('level')} />
                {form.formState.errors.level && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.level.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="category">Category (e.g., Fantasy)</Label>
                <Input id="category" {...form.register('category')} />
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.category.message}</p>
                )}
              </div>
            </div>

<<<<<<< HEAD
            <div>
              <Label htmlFor="language">Language</Label>
               <Controller
                name="language"
                control={form.control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue="English">
                    <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                )}
                />
              {form.formState.errors.language && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.language.message}</p>
              )}
            </div>
=======
           <div>
            <Label htmlFor="level">Level</Label>
            <Select 
              onValueChange={(value) => form.setValue('level', value as Story['level'])} 
              value={form.watch('level')}
            >
                <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                    {levels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             {form.formState.errors.level && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.level.message}</p>
            )}
          </div>
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2

          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              onValueChange={(value) => form.setValue('category', value as Story['category'])} 
              value={form.watch('category')}
            >
                <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             {form.formState.errors.category && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.category.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" {...form.register('content')} className="min-h-[200px]" />
            {form.formState.errors.content && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.content.message}</p>
            )}
          </div>
        
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Story'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
