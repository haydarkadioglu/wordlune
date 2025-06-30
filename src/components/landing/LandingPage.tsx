'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, BookOpen, BarChart3, ArrowRight, Languages, Moon, Sun, Mail, Github, MapPin, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Logo from '@/components/common/Logo';
import { useSettings, SUPPORTED_UI_LANGUAGES } from '@/hooks/useSettings';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';


const translations = {
  en: {
    // Header
    dashboard: "Dashboard",
    login: "Login",
    signUp: "Sign Up",
    // Hero
    heroTitle: "Master Vocabulary with AI",
    heroSubtitle: "WordLune is the smart way to save, practice, and truly learn new words. Stop forgetting, start mastering.",
    getStarted: "Get Started for Free",
    getAndroidApp: "Get the Android App",
    // Features
    featuresTitle: "Everything You Need to Learn",
    featuresSubtitle: "From AI-powered tools to progress tracking, we've got you covered.",
    feature1Title: "AI-Powered Learning",
    feature1Content: "Get AI-generated example sentences, phonetic pronunciations, and translations to understand words in context.",
    feature2Title: "Personal Word Lists",
    feature2Content: "Save words you encounter, categorize them by how well you know them, and build your personal dictionary.",
    feature3Title: "Track Your Progress",
    feature3Content: "Visualize your learning journey with stats and charts. See how many words you've added and mastered over time.",
     // Contact
    contactTitle: "Get in Touch",
    contactSubtitle: "Feel free to reach out for any questions, suggestions, or collaboration proposals.",
    contactInfoTitle: "Contact Information",
    country: "Turkey",
    githubUser: "github.com/haydarkadioglu",
    // Footer
    footerText: "All rights reserved.",
    loading: "Loading...",
    redirecting: "Redirecting to your dashboard...",
  },
  tr: {
    // Header
    dashboard: "Kontrol Paneli",
    login: "Giriş Yap",
    signUp: "Kayıt Ol",
    // Hero
    heroTitle: "Yapay Zeka ile Kelime Dağarcığınızı Geliştirin",
    heroSubtitle: "WordLune, yeni kelimeleri kaydetmenin, pratik yapmanın ve gerçekten öğrenmenin akıllı yoludur. Unutmayı bırakın, ustalaşmaya başlayın.",
    getStarted: "Ücretsiz Başlayın",
    getAndroidApp: "Android Uygulamasını İndir",
    // Features
    featuresTitle: "Öğrenmek İçin İhtiyacınız Olan Her Şey",
    featuresSubtitle: "Yapay zeka destekli araçlardan ilerleme takibine kadar her konuda yanınızdayız.",
    feature1Title: "Yapay Zeka Destekli Öğrenme",
    feature1Content: "Kelimeleri bağlam içinde anlamak için yapay zeka tarafından oluşturulmuş örnek cümleler, fonetik telaffuzlar ve çeviriler alın.",
    feature2Title: "Kişisel Kelime Listeleri",
    feature2Content: "Karşılaştığınız kelimeleri kaydedin, ne kadar iyi bildiğinize göre kategorilere ayırın ve kişisel sözlüğünüzü oluşturun.",
    feature3Title: "İlerlemenizi Takip Edin",
    feature3Content: "Öğrenme yolculuğunuzu istatistikler ve grafiklerle görselleştirin. Zamanla kaç kelime eklediğinizi ve ustalaştığınızı görün.",
    // Contact
    contactTitle: "İletişime Geçin",
    contactSubtitle: "Herhangi bir soru, öneri veya işbirliği teklifi için bizimle iletişime geçmekten çekinmeyin.",
    contactInfoTitle: "İletişim Bilgileri",
    country: "Türkiye",
    githubUser: "github.com/haydarkadioglu",
    // Footer
    footerText: "Tüm hakları saklıdır.",
    loading: "Yükleniyor...",
    redirecting: "Kontrol panelinize yönlendiriliyorsunuz...",
  },
};


const Header = () => {
  const { user, loading } = useAuth();
  const { uiLanguage, setUiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
  const [theme, setTheme] = useState('light');

   useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme) setTheme(storedTheme);
    else if (systemPrefersDark) setTheme('dark');
    else setTheme('light');
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-transparent absolute top-0 left-0 right-0 z-20">
      <div className="container mx-auto flex justify-between items-center">
        <Logo />
        <nav className="flex items-center space-x-1 sm:space-x-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Change language">
                <Languages className="h-5 w-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SUPPORTED_UI_LANGUAGES.map(lang => (
                <DropdownMenuItem key={lang.code} onSelect={() => setUiLanguage(lang.code)} className={uiLanguage === lang.code ? "bg-accent" : ""}>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

           <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="text-primary">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {loading ? null : user ? (
            <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline' }), 'text-primary border-primary hover:bg-primary hover:text-primary-foreground')}>
                {t.dashboard}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), "text-primary")}>
                {t.login}
              </Link>
              <Link href="/register" className={cn(buttonVariants(), "bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground")}>
                {t.signUp}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { uiLanguage } = useSettings();
  const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];
  const [androidAppUrl, setAndroidAppUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndroidLink = async () => {
      if (!db) return;
      try {
        const docRef = doc(db, "versions", "android-app-link");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().link) {
          setAndroidAppUrl(docSnap.data().link);
        } else {
          console.warn("Android app link not found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching Android app link:", error);
      }
    };

    fetchAndroidLink();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4 animate-pulse">
          <span className="text-4xl font-bold text-primary-foreground">W</span>
        </div>
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }


  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-28 text-center bg-card">
           <div className="absolute inset-0 opacity-10 pointer-events-none">
                <Image 
                  src="/auth-background.png" 
                  alt="Abstract background pattern" 
                  layout="fill" 
                  objectFit="cover"
                />
              </div>
          <div className="container mx-auto px-4 relative">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary">
              {t.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              {t.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), "bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground shadow-lg hover:shadow-xl transition-shadow")}>
                {t.getStarted} <ArrowRight className="ml-2" />
              </Link>
               {androidAppUrl && (
                  <Link href={androidAppUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), "border-primary text-primary hover:bg-primary/10 shadow-lg hover:shadow-xl transition-shadow")}>
                    <Smartphone className="mr-2" /> {t.getAndroidApp}
                  </Link>
               )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight">{t.featuresTitle}</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{t.featuresSubtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-primary/20 hover:border-primary">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">{t.feature1Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {t.feature1Content}
                </CardContent>
              </Card>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-primary/20 hover:border-primary">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">{t.feature2Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {t.feature2Content}
                </CardContent>
              </Card>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-primary/20 hover:border-primary">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">{t.feature3Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {t.feature3Content}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Contact Section */}
        <section className="py-20 lg:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">{t.contactTitle}</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{t.contactSubtitle}</p>
            </div>
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-2 space-y-8">
                <Card className="shadow-lg p-6 border-l-4 border-primary">
                   <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <MapPin className="h-6 w-6 text-primary" /> {t.contactInfoTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4 text-muted-foreground">
                     <div className="flex items-center gap-4">
                        <span>{t.country}</span>
                    </div>
                    <a href="mailto:info@notiral.com" className="flex items-center gap-4 hover:text-primary transition-colors">
                      <Mail className="h-5 w-5" />
                      <span>info@notiral.com</span>
                    </a>
                    <a href="https://github.com/haydarkadioglu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:text-primary transition-colors">
                      <Github className="h-5 w-5" />
                      <span>{t.githubUser}</span>
                    </a>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-3">
                <div className="rounded-lg overflow-hidden shadow-2xl border">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6342495.733562607!2d30.41302558359374!3d39.0418428989476!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14b0155c964f2671%3A0x40d9dbd42a625f2a!2zVMO8cmtpeWU!5e0!3m2!1str!2str!4v1625835637890!5m2!1str!2str"
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="dark:filter dark:grayscale-100 dark:invert-90 dark:contrast-125"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex justify-center mb-4">
             <Logo />
          </div>
          © {new Date().getFullYear()} WordLune. {t.footerText}
        </div>
      </footer>
    </div>
  );
}
