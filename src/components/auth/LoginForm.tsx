
"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: 'Başarılı!', description: 'Giriş yapıldı.' });
      router.push('/dashboard'); // AuthProvider also handles this redirect
    } catch (error: any) {
      console.error("Login error:", error);
      const errorCode = error.code;
      let errorMessage = "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.";
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        errorMessage = 'E-posta veya şifre yanlış.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta formatı.';
      }
      toast({ title: 'Hata', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: 'Başarılı!', description: 'Google ile giriş yapıldı.' });
      router.push('/dashboard'); // AuthProvider also handles this redirect
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      toast({ title: 'Hata', description: 'Google ile giriş yapılamadı. Lütfen tekrar deneyin.', variant: 'destructive' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <Image 
            src="https://placehold.co/100x100.png" 
            alt="WordClass Logo" 
            width={80} 
            height={80} 
            className="mx-auto mb-4 rounded-lg shadow-md"
            data-ai-hint="logo book" 
        />
        <h2 className="text-3xl font-bold tracking-tight text-primary">WordClass'a Giriş Yap</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelime hazinenizi geliştirmeye devam edin!
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || isGoogleLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Giriş Yap
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Veya</span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.9 0 256S110.3 0 244 0c70.7 0 128.9 28.5 173.4 70.3l-66.3 66.3C325.2 110.6 288.5 94.7 244 94.7 151.6 94.7 78.3 168.7 78.3 256s73.3 161.3 165.7 161.3c80.3 0 112.5-47.1 116.3-72.3H244v-83.8h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
        }
        Google ile Giriş Yap
      </Button>
      <p className="mt-4 text-center text-sm">
        Hesabınız yok mu?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Kayıt Olun
        </Link>
      </p>
    </div>
  );
}
