
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, BookOpen, BarChart3, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Logo from '@/components/common/Logo';

const Header = () => {
  const { user, loading } = useAuth();

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-transparent absolute top-0 left-0 right-0 z-20">
      <div className="container mx-auto flex justify-between items-center">
        <Logo />
        <nav className="flex items-center space-x-2 sm:space-x-4">
          {loading ? null : user ? (
            <Link href="/dashboard" passHref>
              <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-primary-foreground">
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" passHref>
                <Button variant="ghost" className="text-primary">Login</Button>
              </Link>
              <Link href="/register" passHref>
                <Button className="bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground">
                  Sign Up
                </Button>
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
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Show a loading/redirecting screen while checking auth state or if user is logged in
  if (loading || user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4 animate-pulse">
          <span className="text-4xl font-bold text-primary-foreground">W</span>
        </div>
        <p className="text-muted-foreground">{ loading ? 'Loading...' : 'Redirecting to your dashboard...'}</p>
      </div>
    );
  }


  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-28 text-center bg-card">
           <div className="absolute inset-0 opacity-5 pointer-events-none">
                <Image 
                  src="https://placehold.co/1920x1080.png" 
                  alt="Abstract background pattern" 
                  layout="fill" 
                  objectFit="cover"
                  data-ai-hint="abstract geometric" 
                />
              </div>
          <div className="container mx-auto px-4 relative">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary">
              Master Vocabulary with AI
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              WordLune is the smart way to save, practice, and truly learn new words. Stop forgetting, start mastering.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/register" passHref>
                <Button size="lg" className="bg-primary hover:bg-accent text-primary-foreground hover:text-accent-foreground shadow-lg hover:shadow-xl transition-shadow">
                  Get Started for Free <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight">Everything You Need to Learn</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">From AI-powered tools to progress tracking, we've got you covered.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-primary/20 hover:border-primary">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">AI-Powered Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  Get AI-generated example sentences, phonetic pronunciations, and translations to understand words in context.
                </CardContent>
              </Card>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-primary/20 hover:border-primary">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Personal Word Lists</CardTitle>
                </CardHeader>
                <CardContent>
                  Save words you encounter, categorize them by how well you know them, and build your personal dictionary.
                </CardContent>
              </Card>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-primary/20 hover:border-primary">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Track Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  Visualize your learning journey with stats and charts. See how many words you've added and mastered over time.
                </CardContent>
              </Card>
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
          © {new Date().getFullYear()} WordLune. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
