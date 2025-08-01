
"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import Logo from '@/components/common/Logo';
import { logLoginHistory, createInitialUserDocuments } from '@/lib/user-service';


const translations = {
  en: {
    title: "Register for WordLune",
    description: "Create a new account and start learning words!",
    nameLabel: "Your Name",
    namePlaceholder: "Your Name",
    usernameLabel: "Username",
    usernamePlaceholder: "e.g., wordmaster",
    emailLabel: "Email",
    emailPlaceholder: "example@email.com",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm Password",
    registerButton: "Register",
    haveAccount: "Already have an account?",
    loginLink: "Log In",
    successTitle: "Success!",
    accountCreated: "Your account has been created. Logging you in...",
    errorTitle: "Error",
    registrationFailed: "Registration failed. Please check your information.",
    usernameTaken: "This username is already taken. Please choose another one.",
    emailInUse: "This email address is already in use.",
    invalidEmail: "Invalid email format.",
    weakPassword: "Password is too weak. Try a stronger one.",
    configNotFound: "Firebase authentication configuration not found.",
    nameMinLengthZod: "Name must be at least 2 characters.",
    usernameMinLengthZod: "Username must be at least 3 characters.",
    usernameMaxLengthZod: "Username must not exceed 20 characters.",
    usernameRegexZod: "Username can only contain lowercase letters, numbers, and underscores (_).",
    invalidEmailZod: "Please enter a valid email address.",
    passwordMinLengthZod: "Password must be at least 6 characters.",
    passwordsDontMatchZod: "Passwords do not match.",
    or: "Or",
    googleSignUpButton: "Sign Up with Google",
    googleSignInError: "Could not sign up with Google. Please try again.",
    popupClosed: "Google sign-up window was closed.",
    popupCancelled: "Google sign-up request was cancelled.",
    googleConfigNotFound: "Firebase authentication configuration not found.",
    firebaseNotConfigured: "Firebase is not configured. Please check the console for errors.",
  },
  tr: {
    title: "WordLune'a Kayıt Olun",
    description: "Yeni bir hesap oluşturun ve kelime öğrenmeye başlayın!",
    nameLabel: "Adınız",
    namePlaceholder: "Adınız Soyadınız",
    usernameLabel: "Kullanıcı Adı",
    usernamePlaceholder: "örn: kelimeustasi",
    emailLabel: "E-posta",
    emailPlaceholder: "ornek@eposta.com",
    passwordLabel: "Şifre",
    confirmPasswordLabel: "Şifreyi Onayla",
    registerButton: "Kayıt Ol",
    haveAccount: "Zaten bir hesabınız var mı?",
    loginLink: "Giriş Yapın",
    successTitle: "Başarılı!",
    accountCreated: "Hesabınız oluşturuldu. Giriş yapılıyor...",
    errorTitle: "Hata",
    registrationFailed: "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.",
    usernameTaken: "Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane seçin.",
    emailInUse: "Bu e-posta adresi zaten kullanımda.",
    invalidEmail: "Geçersiz e-posta formatı.",
    weakPassword: "Şifre çok zayıf. Daha güçlü bir şifre deneyin.",
    configNotFound: "Firebase kimlik doğrulama yapılandırması bulunamadı.",
    nameMinLengthZod: "İsim en az 2 karakter olmalıdır.",
    usernameMinLengthZod: "Kullanıcı adı en az 3 karakter olmalıdır.",
    usernameMaxLengthZod: "Kullanıcı adı 20 karakteri geçmemelidir.",
    usernameRegexZod: "Kullanıcı adı yalnızca küçük harf, rakam ve alt çizgi (_) içerebilir.",
    invalidEmailZod: "Geçerli bir e-posta adresi girin.",
    passwordMinLengthZod: "Şifre en az 6 karakter olmalıdır.",
    passwordsDontMatchZod: "Şifreler eşleşmiyor.",
    or: "Veya",
    googleSignUpButton: "Google ile Kayıt Ol",
    googleSignInError: "Google ile kayıt olunamadı. Lütfen tekrar deneyin.",
    popupClosed: "Google kayıt penceresi kapatıldı.",
    popupCancelled: "Google kayıt isteği iptal edildi.",
    googleConfigNotFound: "Firebase kimlik doğrulama yapılandırması bulunamadı.",
    firebaseNotConfigured: "Firebase yapılandırılmamış. Lütfen konsolu hatalar için kontrol edin.",
  }
};

const getRegisterSchema = (lang: 'en' | 'tr') => {
  const t = translations[lang];
  return z.object({
    displayName: z.string().min(2, t.nameMinLengthZod),
    email: z.string().email(t.invalidEmailZod),
    password: z.string().min(6, t.passwordMinLengthZod),
    confirmPassword: z.string().min(6, t.passwordMinLengthZod),
  }).refine(data => data.password === data.confirmPassword, {
    message: t.passwordsDontMatchZod,
    path: ['confirmPassword'],
  });
};

type RegisterFormInputs = z.infer<ReturnType<typeof getRegisterSchema>>;

export default function RegisterForm() {
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>({
    resolver: zodResolver(getRegisterSchema(uiLanguage as 'en' | 'tr')),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true);
    if (!auth) {
      toast({ title: t.errorTitle, description: t.firebaseNotConfigured, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      await updateProfile(userCredential.user, { displayName: data.displayName });
      await createInitialUserDocuments(userCredential.user.uid, data.displayName, data.email);
      await logLoginHistory(userCredential.user.uid);
      
      toast({ title: t.successTitle, description: t.accountCreated });
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      const errorCode = error.code;
      let errorMessage = t.registrationFailed;
       if (errorCode === 'auth/email-already-in-use') {
        errorMessage = t.emailInUse;
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = t.invalidEmail;
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = t.weakPassword;
      } else if (errorCode === 'auth/configuration-not-found') {
        errorMessage = t.configNotFound;
      } else if (error.message && error.message.includes('permissions')) {
        errorMessage = `Firestore Permission Error: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: t.errorTitle, description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    toast({
        title: "Google Sign-In",
        description: "Google sign-in does not support unique usernames in this version. Please use email/password registration to choose a username.",
        variant: 'destructive'
    });
    setIsGoogleLoading(false);
    // The rest of the Google sign-in logic is disabled for now to enforce username creation.
  };

  return (
    <div className="w-full max-w-md space-y-6">
       <div className="text-center">
        <Logo size="lg" className="justify-center mb-6" />
        <h2 className="text-3xl font-bold tracking-tight text-primary">{t.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.description}
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="displayName">{t.nameLabel}</Label>
          <Input id="displayName" type="text" {...register('displayName')} placeholder={t.namePlaceholder} className="mt-1" />
          {errors.displayName && <p className="mt-1 text-sm text-destructive">{errors.displayName.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">{t.emailLabel}</Label>
          <Input id="email" type="email" {...register('email')} placeholder={t.emailPlaceholder} className="mt-1" />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">{t.passwordLabel}</Label>
          <Input id="password" type="password" {...register('password')} placeholder="••••••••" className="mt-1" />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword">{t.confirmPasswordLabel}</Label>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="••••••••" className="mt-1" />
          {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || isGoogleLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.registerButton}
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
        {t.googleSignUpButton}
      </Button>
      <p className="mt-4 text-center text-sm">
        {t.haveAccount}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.loginLink}
        </Link>
      </p>
    </div>
  );
}
