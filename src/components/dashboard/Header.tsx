
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, buttonVariants } from '@/components/ui/button';
import { LogOut, Sun, Moon, Cog, Languages } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useSettings, SUPPORTED_UI_LANGUAGES } from '@/hooks/useSettings';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <Link href={href} className={cn(
      buttonVariants({ variant: 'ghost' }),
      "text-muted-foreground hover:text-primary",
      isActive && "text-primary bg-primary/10"
    )}>
      {children}
    </Link>
  );
};

export default function Header() {
  const { user, signOut } = useAuth();
  const { uiLanguage, setUiLanguage } = useSettings();
  const [theme, setTheme] = useState('light');

  // Effect to set the initial theme based on system preference
  useEffect(() => {
    // Check for existing consent. If not granted, we can't check localStorage.
    const consent = localStorage.getItem('wordlune_cookie_consent');
    let initialTheme = 'light';

    if (consent === 'granted') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        initialTheme = storedTheme;
      } else {
        initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } else {
      // If no consent, default to system preference without storing it
       initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);


  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Only save to localStorage if consent has been given
    const consent = localStorage.getItem('wordlune_cookie_consent');
    if (consent === 'granted') {
        localStorage.setItem('theme', newTheme);
    }
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm shadow-md sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/dashboard/words">All Words</NavLink>
            <NavLink href="/dashboard/lists">My Lists</NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-2">
           {user && (
            <p className="text-sm text-foreground hidden lg:block mr-4">
              Welcome, <span className="font-semibold text-primary">{user.username}</span>
            </p>
          )}
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

          <Link href="/dashboard/settings" aria-label="Settings" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-primary')}>
              <Cog className="h-5 w-5" />
          </Link>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="text-primary">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Logout" className="text-primary">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
