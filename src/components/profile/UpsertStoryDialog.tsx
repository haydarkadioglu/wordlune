
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Story } from '@/types';
import { upsertUserStory } from '@/lib/stories-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSettings, SUPPORTED_LANGUAGES } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '../ui/switch';

const storySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  language: z.string().min(1, "Language is required."),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  category: z.enum(['Adventure', 'Romance', 'Mystery', 'Science Fiction', 'Fantasy', 'Comedy', 'Drama', 'Horror', 'Bilimsel Yazı']),
  content: z.string().min(20, "Story content must be at least 20 characters."),
  isPublished: z.boolean().default(false),
});

type StoryFormData = z.infer<typeof storySchema>;

interface UpsertStoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  story: Story | null;
}

const levels: Story['level'][] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const categories: Story['category'][] = ['Adventure', 'Romance', 'Mystery', 'Science Fiction', 'Fantasy', 'Comedy', 'Drama', 'Horror', 'Bilimsel Yazı'];

export default function UpsertStoryDialog({ isOpen, onOpenChange, story }: UpsertStoryDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!story;
  
  const form = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: "",
      language: "English",
      level: "A1",
      category: "Adventure",
      content: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (story) {
        form.reset({
          title: story.title,
          language: story.language,
          level: story.level,
          category: story.category,
          content: story.content,
          isPublished: story.isPublished,
        });
      } else {
        form.reset({
          title: "",
          language: "English",
          level: "A1",
          category: "Adventure",
          content: "",
          isPublished: false,
        });
      }
    }
  }, [story, form, isOpen]);

  const onSubmit = async (values: StoryFormData) => {
    if (!user || !user.username) {
        toast({ title: "Error", description: "You must be logged in to create a story.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
        const storyData = { 
            ...values, 
            authorName: user.username,
            authorPhotoURL: user.photoURL || undefined
        };
        await upsertUserStory(user.uid, storyData, story?.id);
        toast({
            title: isEditing ? "Story Updated!" : "Story Created!",
            description: `The story "${values.title}" has been saved.`,
        });
        form.reset();
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
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Story' : 'Create New Story'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of your story.' : 'Fill in the details for your new story.'}
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

           <div>
            <Label htmlFor="level">Level</Label>
            <Controller
                name="level"
                control={form.control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="level">
                            <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                            {levels.map(level => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
             {form.formState.errors.level && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.level.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
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

          <div className="flex items-center space-x-2">
              <Controller
                name="isPublished"
                control={form.control}
                render={({ field }) => (
                     <Switch
                        id="isPublished"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                )}
              />
            <Label htmlFor="isPublished">Publish this story to the community?</Label>
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
