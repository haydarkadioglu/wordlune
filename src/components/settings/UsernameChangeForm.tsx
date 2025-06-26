
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { checkUsernameExists, updateUsername } from '@/lib/user-service';

const translations = {
  en: {
    username: 'Username',
    description: 'This is your unique and public name.',
    saveChanges: 'Save Changes',
    success: 'Username updated!',
    successDesc: 'Your username has been successfully changed.',
    error: 'Error',
    errorDesc: 'Could not update username. Please try again.',
    sameUsername: 'This is already your username.',
    taken: 'This username is already taken.',
    usernameMin: 'Username must be at least 3 characters.',
    usernameMax: 'Username must not exceed 20 characters.',
    usernameRegex: 'Username can only contain lowercase letters, numbers, and underscores (_).',
  },
  tr: {
    username: 'Kullanıcı Adı',
    description: 'Bu sizin benzersiz ve herkese açık adınızdır.',
    saveChanges: 'Değişiklikleri Kaydet',
    success: 'Kullanıcı adı güncellendi!',
    successDesc: 'Kullanıcı adınız başarıyla değiştirildi.',
    error: 'Hata',
    errorDesc: 'Kullanıcı adı güncellenemedi. Lütfen tekrar deneyin.',
    sameUsername: 'Bu zaten mevcut kullanıcı adınız.',
    taken: 'Bu kullanıcı adı zaten alınmış.',
    usernameMin: 'Kullanıcı adı en az 3 karakter olmalıdır.',
    usernameMax: 'Kullanıcı adı 20 karakteri geçmemelidir.',
    usernameRegex: 'Kullanıcı adı yalnızca küçük harf, rakam ve alt çizgi (_) içerebilir.',
  }
};

const getUsernameSchema = (lang: 'en' | 'tr') => {
  const t = translations[lang];
  return z.object({
    username: z.string()
      .min(3, t.usernameMin)
      .max(20, t.usernameMax)
      .regex(/^[a-z0-9_]+$/, t.usernameRegex)
      .transform(val => val.trim().toLowerCase()),
  });
};

type UsernameFormData = z.infer<ReturnType<typeof getUsernameSchema>>;

export default function UsernameChangeForm() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const { register, handleSubmit, formState: { errors }, reset, setError } = useForm<UsernameFormData>({
    resolver: zodResolver(getUsernameSchema(uiLanguage as 'en' | 'tr')),
    defaultValues: {
        username: user?.username || ''
    }
  });

  useEffect(() => {
    if (user?.username) {
      reset({ username: user.username });
    }
  }, [user, reset]);

  const onSubmit = async (data: UsernameFormData) => {
    if (!user || !user.username) return;

    if (data.username === user.username) {
        toast({ title: t.error, description: t.sameUsername, variant: 'destructive' });
        return;
    }

    setIsLoading(true);

    try {
      const isTaken = await checkUsernameExists(data.username);
      if (isTaken) {
        setError('username', { type: 'manual', message: t.taken });
        setIsLoading(false);
        return;
      }
      
      await updateUsername(user.uid, user.username, data.username);
      
      await refetchUser();
      
      toast({
        title: t.success,
        description: t.successDesc,
      });

    } catch (error: any) {
      console.error("Error updating username:", error);
      toast({
        title: t.error,
        description: error.message || t.errorDesc,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) {
    return null; // or a skeleton loader
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <AtSign className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl text-primary">{t.username}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="username" className="sr-only">{t.username}</Label>
            <Input id="username" type="text" {...register('username')} className="mt-1" />
            {errors.username && <p className="mt-1 text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.saveChanges}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
