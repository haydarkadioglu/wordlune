
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
import { useSettings } from '@/hooks/useSettings';
import Logo from '@/components/common/Logo';
import { logLoginHistory, getEmailForUsername } from '@/lib/user-service';


const translations = {
  en: {
    title: "Sign in to WordLune",
    description: "Continue to improve your vocabulary!",
    emailOrUsernameLabel: "Email or Username",
    emailOrUsernamePlaceholder: "example@email.com or username",
    passwordLabel: "Password",
    signInButton: "Sign In",
    or: "Or",
    googleSignInButton: "Sign In with Google",
    noAccount: "Don't have an account?",
    registerLink: "Register",
    successTitle: "Success!",
    loginSuccess: "Logged in successfully.",
    errorTitle: "Error",
    loginFailed: "Login failed. Please check your credentials.",
    invalidCredentials: "Incorrect email/username or password.",
    userNotFound: "No user found with that email or username.",
    invalidEmail: "Invalid email format.",
    configNotFound: "Firebase authentication configuration not found. Please ensure the Email/Password sign-in method is enabled in your Firebase console.",
    googleSignInError: "Could not sign in with Google. Please try again.",
    popupClosed: "Google sign-in window was closed.",
    popupCancelled: "Google sign-in request was cancelled.",
    googleConfigNotFound: "Firebase authentication configuration not found. Please ensure the Google sign-in method is enabled in your Firebase console.",
    identifierRequired: "Please enter your email or username.",
    passwordMinLengthZod: "Password must be at least 6 characters.",
    firebaseNotConfigured: "Firebase is not configured. Please check the console for errors.",
  },
  tr: {
    title: "WordLune'a Giriş Yap",
    description: "Kelime hazinenizi geliştirmeye devam edin!",
    emailOrUsernameLabel: "E-posta veya Kullanıcı Adı",
    emailOrUsernamePlaceholder: "ornek@eposta.com veya kullanıcıadı",
    passwordLabel: "Şifre",
    signInButton: "Giriş Yap",
    or: "Veya",
    googleSignInButton: "Google ile Giriş Yap",
    noAccount: "Hesabınız yok mu?",
    registerLink: "Kayıt Olun",
    successTitle: "Başarılı!",
    loginSuccess: "Giriş yapıldı.",
    errorTitle: "Hata",
    loginFailed: "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",
    invalidCredentials: "E-posta/kullanıcı adı veya şifre yanlış.",
    userNotFound: "Bu e-posta veya kullanıcı adına sahip bir kullanıcı bulunamadı.",
    invalidEmail: "Geçersiz e-posta formatı.",
    configNotFound: "Firebase kimlik doğrulama yapılandırması bulunamadı. Lütfen Firebase konsolunda E-posta/Şifre ile giriş yönteminin etkinleştirildiğinden emin olun.",
    googleSignInError: "Google ile giriş yapılamadı. Lütfen tekrar deneyin.",
    popupClosed: "Google giriş penceresi kapatıldı.",
    popupCancelled: "Google giriş isteği iptal edildi.",
    googleConfigNotFound: "Firebase kimlik doğrulama yapılandırması bulunamadı. Lütfen Firebase konsolunda Google ile giriş yönteminin etkinleştirildiğinden emin olun.",
    identifierRequired: "Lütfen e-postanızı veya kullanıcı adınızı girin.",
    passwordMinLengthZod: "Şifre en az 6 karakter olmalıdır.",
    firebaseNotConfigured: "Firebase yapılandırılmamış. Lütfen konsolu hatalar için kontrol edin.",
  }
};

const getLoginSchema = (lang: 'en' | 'tr') => {
  const t = translations[lang];
  return z.object({
    identifier: z.string().min(1, t.identifierRequired),
    password: z.string().min(6, t.passwordMinLengthZod),
  });
};

type LoginFormInputs = z.infer<ReturnType<typeof getLoginSchema>>;

export default function LoginForm() {
  const settings = useSettings();
  const { uiLanguage } = settings;
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(getLoginSchema(uiLanguage as 'en' | 'tr')),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    if (!auth) {
      toast({ title: t.errorTitle, description: t.firebaseNotConfigured, variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    try {
      let email = data.identifier;
      // If identifier doesn't look like an email, assume it's a username and find the email.
      if (!email.includes('@')) {
        const foundEmail = await getEmailForUsername(email);
        if (!foundEmail) {
            toast({ title: t.errorTitle, description: t.userNotFound, variant: 'destructive' });
            setIsLoading(false);
            return;
        }
        email = foundEmail;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, data.password);
      await logLoginHistory(userCredential.user.uid);
      toast({ title: t.successTitle, description: t.loginSuccess });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      const errorCode = error.code;
      let errorMessage = t.loginFailed;
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        errorMessage = t.invalidCredentials;
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = t.invalidEmail;
      } else if (errorCode === 'auth/configuration-not-found') {
        errorMessage = t.configNotFound;
        console.error("Firebase auth/configuration-not-found: Ensure Email/Password sign-in is enabled in your Firebase project console.");
      }
      toast({ title: t.errorTitle, description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    if (!auth || !googleProvider) {
      toast({ title: t.errorTitle, description: t.firebaseNotConfigured, variant: 'destructive' });
      setIsGoogleLoading(false);
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await logLoginHistory(result.user.uid);
      toast({ title: t.successTitle, description: t.loginSuccess });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      let errorMessage = t.googleSignInError;
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = t.popupClosed;
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = t.popupCancelled;
      } else if (error.code === 'auth/configuration-not-found') {
         errorMessage = t.googleConfigNotFound;
         console.error("Firebase auth/configuration-not-found: Ensure Google sign-in is enabled in your Firebase project console.");
      }
      toast({ title: t.errorTitle, description: errorMessage, variant: 'destructive' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (!settings.uiLanguage) return null; // Wait for settings to be loaded

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <Logo size="lg" className="justify-center mb-6" />
        <h2 className="text-3xl font-bold tracking-tight text-primary">{t.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.description}
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="identifier">{t.emailOrUsernameLabel}</Label>
          <Input id="identifier" type="text" {...register('identifier')} placeholder={t.emailOrUsernamePlaceholder} className="mt-1" />
          {errors.identifier && <p className="mt-1 text-sm text-destructive">{errors.identifier.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">{t.passwordLabel}</Label>
          <Input id="password" type="password" {...register('password')} placeholder="••••••••" className="mt-1" />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || isGoogleLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.signInButton}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t.or}</span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.9 0 256S110.3 0 244 0c70.7 0 128.9 28.5 173.4 70.3l-66.3 66.3C325.2 110.6 288.5 94.7 244 94.7 151.6 94.7 78.3 168.7 78.3 256s73.3 161.3 165.7 161.3c80.3 0 112.5-47.1 116.3-72.3H244v-83.8h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
        }
        {t.googleSignInButton}
      </Button>
      <p className="mt-4 text-center text-sm">
        {t.noAccount}{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t.registerLink}
        </Link>
      </p>
    </div>
  );
}
