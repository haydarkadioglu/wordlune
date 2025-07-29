
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Story } from '@/types';
import { upsertUserStory, getStoryById } from '@/lib/stories-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SUPPORTED_LANGUAGES } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const storySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  language: z.string().min(1, "Language is required."),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  category: z.enum(['Adventure', 'Romance', 'Mystery', 'Science Fiction', 'Fantasy', 'Comedy', 'Drama', 'Horror', 'Bilimsel Yazı']),
  content: z.string().min(20, "Story content must be at least 20 characters."),
  isPublished: z.boolean().default(false),
});

type StoryFormData = z.infer<typeof storySchema>;

interface StoryEditorClientProps {
  storyId: string;
}

const levels: Story['level'][] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const categories: Story['category'][] = ['Adventure', 'Romance', 'Mystery', 'Science Fiction', 'Fantasy', 'Comedy', 'Drama', 'Horror', 'Bilimsel Yazı'];

export default function StoryEditorClient({ storyId }: StoryEditorClientProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isEditing = storyId !== 'new';
  
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
    if (isEditing) {
      const lang = searchParams.get('lang');
      if (!lang) {
        toast({ title: "Error", description: "Language parameter is missing.", variant: "destructive" });
        router.push('/dashboard/profile');
        return;
      }
      setIsLoading(true);
      getStoryById(lang, storyId).then(story => {
        if (story) {
            if (story.authorId !== user?.uid) {
                toast({ title: "Unauthorized", description: "You can only edit your own stories.", variant: "destructive" });
                router.push('/dashboard/profile');
                return;
            }
            form.reset({
                title: story.title,
                language: story.language,
                level: story.level,
                category: story.category,
                content: story.content,
                isPublished: story.isPublished,
            });
        } else {
             toast({ title: "Not Found", description: "The story you are trying to edit does not exist.", variant: "destructive" });
             router.push('/dashboard/profile');
        }
      }).finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [storyId, isEditing, searchParams, toast, router, form, user]);

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
            authorPhotoURL: user.photoURL || ''
        };
        await upsertUserStory(user.uid, storyData, isEditing ? storyId : undefined);
        toast({
            title: isEditing ? "Story Updated!" : "Story Created!",
            description: `The story "${values.title}" has been saved.`,
        });
        router.push('/dashboard/profile');
    } catch (error) {
        console.error("Failed to save story:", error);
        toast({ title: "Error", description: "Could not save the story.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
       <div className="flex items-center justify-between">
            <Button asChild variant="ghost">
                <Link href="/dashboard/profile">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to My Stories
                </Link>
            </Button>
            <div className="flex items-center gap-4">
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
                    <Label htmlFor="isPublished" className="text-foreground">Publish</Label>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Save Changes' : 'Create Story'}
                </Button>
            </div>
       </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Your Story' : 'Create a New Story'}</CardTitle>
          <CardDescription>
            {isEditing ? 'Update the details of your story.' : 'Fill in the details for your new story.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <Label htmlFor="language">Language</Label>
                    <Controller
                        name="language"
                        control={form.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} defaultValue="English" disabled={isEditing}>
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
           </div>


          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" {...form.register('content')} className="min-h-[400px]" />
            {form.formState.errors.content && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.content.message}</p>
            )}
          </div>
        
        </CardContent>
      </Card>
    </form>
  );
}
