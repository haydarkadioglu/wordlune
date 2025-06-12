
"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

const registerSchema = z.object({
  displayName: z.string().min(2, 'İsim en az 2 karakter olmalıdır.'),
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  confirmPassword: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor.',
  path: ['confirmPassword'],
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: data.displayName,
        });
      }
      toast({ title: 'Başarılı!', description: 'Hesabınız oluşturuldu. Giriş yapılıyor...' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorCode = error.code;
      let errorMessage = "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.";
       if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta formatı.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf. Daha güçlü bir şifre deneyin.';
      } else if (errorCode === 'auth/configuration-not-found') {
        errorMessage = 'Firebase kimlik doğrulama yapılandırması bulunamadı. Lütfen Firebase konsolunda E-posta/Şifre ile giriş yönteminin etkinleştirildiğinden emin olun.';
        console.error("Firebase auth/configuration-not-found: Ensure Email/Password sign-in is enabled in your Firebase project console.");
      }
      toast({ title: 'Hata', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
       <div className="text-center">
         <Image 
            src="https://placehold.co/80x80.png" 
            alt="WordClass Logo" 
            width={80} 
            height={80} 
            className="mx-auto mb-4 rounded-lg shadow-md"
            data-ai-hint="wordclass logo W" 
        />
        <h2 className="text-3xl font-bold tracking-tight text-primary">WordClass'a Kayıt Olun</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Yeni bir hesap oluşturun ve kelime öğrenmeye başlayın!
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="displayName">Adınız</Label>
          <Input id="displayName" type="text" {...register('displayName')} placeholder="Adınız Soyadınız" className="mt-1" />
          {errors.displayName && <p className="mt-1 text-sm text-destructive">{errors.displayName.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" type="email" {...register('email')} placeholder="ornek@eposta.com" className="mt-1" />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Şifre</Label>
          <Input id="password" type="password" {...register('password')} placeholder="••••••••" className="mt-1" />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Şifreyi Onayla</Label>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="••••••••" className="mt-1" />
          {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kayıt Ol
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        Zaten bir hesabınız var mı?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Giriş Yapın
        </Link>
      </p>
    </div>
  );
}
