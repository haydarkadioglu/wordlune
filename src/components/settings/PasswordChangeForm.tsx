
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const translations = {
  en: {
    changePassword: 'Change Password',
    updateYourPassword: 'Update your account password here.',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    saveChanges: 'Save Changes',
    passwordUpdated: 'Password updated successfully!',
    errorUpdating: 'Error updating password',
    reauthFailed: 'Re-authentication failed. Please check your current password.',
    genericError: 'An unexpected error occurred. Please try again.',
    passwordRequired: 'Current password is required.',
    newPasswordMin: 'New password must be at least 6 characters.',
    confirmPasswordMin: 'Confirm password must be at least 6 characters.',
    passwordsDontMatch: "New passwords don't match.",
  },
  tr: {
    changePassword: 'Şifre Değiştir',
    updateYourPassword: 'Hesap şifrenizi buradan güncelleyin.',
    currentPassword: 'Mevcut Şifre',
    newPassword: 'Yeni Şifre',
    confirmNewPassword: 'Yeni Şifreyi Onayla',
    saveChanges: 'Değişiklikleri Kaydet',
    passwordUpdated: 'Şifre başarıyla güncellendi!',
    errorUpdating: 'Şifre güncellenirken hata oluştu',
    reauthFailed: 'Yeniden kimlik doğrulama başarısız. Lütfen mevcut şifrenizi kontrol edin.',
    genericError: 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.',
    passwordRequired: 'Mevcut şifre gerekli.',
    newPasswordMin: 'Yeni şifre en az 6 karakter olmalıdır.',
    confirmPasswordMin: 'Şifre onayı en az 6 karakter olmalıdır.',
    passwordsDontMatch: 'Yeni şifreler eşleşmiyor.',
  }
};

const getPasswordSchema = (lang: 'en' | 'tr') => {
  const t = translations[lang];
  return z.object({
    currentPassword: z.string().min(1, { message: t.passwordRequired }),
    newPassword: z.string().min(6, { message: t.newPasswordMin }),
    confirmPassword: z.string().min(6, { message: t.confirmPasswordMin }),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: t.passwordsDontMatch,
    path: ['confirmPassword'],
  });
};

type PasswordFormData = z.infer<ReturnType<typeof getPasswordSchema>>;


export default function PasswordChangeForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordFormData>({
    resolver: zodResolver(getPasswordSchema(uiLanguage as 'en' | 'tr')),
  });

  const onSubmit = async (data: PasswordFormData) => {
    if (!user || !user.email) return;
    setIsLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, data.newPassword);
      
      toast({
        title: t.passwordUpdated,
        description: t.passwordUpdated,
      });
      reset();
    } catch (error: any) {
      console.error(error);
      let description = t.genericError;
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = t.reauthFailed;
      }
      toast({
        title: t.errorUpdating,
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <KeyRound className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl text-primary">{t.changePassword}</CardTitle>
            <CardDescription>{t.updateYourPassword}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">{t.currentPassword}</Label>
            <Input id="currentPassword" type="password" {...register('currentPassword')} className="mt-1" />
            {errors.currentPassword && <p className="mt-1 text-sm text-destructive">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <Label htmlFor="newPassword">{t.newPassword}</Label>
            <Input id="newPassword" type="password" {...register('newPassword')} className="mt-1" />
            {errors.newPassword && <p className="mt-1 text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword">{t.confirmNewPassword}</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} className="mt-1" />
            {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>}
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
