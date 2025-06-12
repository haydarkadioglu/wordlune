
"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpenText, Sun, Moon } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
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
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Image 
            src="https://placehold.co/40x40.png" 
            alt="WordClass Logo" 
            width={40} 
            height={40} 
            className="rounded-md" 
            data-ai-hint="wordclass logo W" />
          <h1 className="text-2xl font-headline text-primary">WordClass</h1>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <p className="text-sm text-foreground hidden sm:block">
              Welcome, <span className="font-semibold text-primary">{user.displayName || user.email}</span>
            </p>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="text-primary hover:text-accent">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Logout" className="text-primary hover:text-accent">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
