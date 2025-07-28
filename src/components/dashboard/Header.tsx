
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, buttonVariants } from '@/components/ui/button';
import { LogOut, Sun, Moon, Cog, Languages, Menu, BookOpen, LayoutDashboard, List } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useSettings, SUPPORTED_UI_LANGUAGES } from '@/hooks/useSettings';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

const NavLink = ({ href, children, onLinkClick }: { href: string; children: React.ReactNode, onLinkClick?: () => void }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <Link 
      href={href} 
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        "text-muted-foreground hover:text-primary justify-start",
        isActive && "text-primary bg-primary/10"
      )}
      onClick={onLinkClick}
    >
      {children}
    </Link>
  );
};

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { href: "/dashboard/words", label: "All Words", icon: <List className="mr-2 h-4 w-4" /> },
    { href: "/dashboard/lists", label: "My Lists", icon: <List className="mr-2 h-4 w-4" /> },
    { href: "/dashboard/stories", label: "Stories", icon: <BookOpen className="mr-2 h-4 w-4" /> },
];

export default function Header() {
  const { user, signOut } = useAuth();
<<<<<<< HEAD
  const { uiLanguage, setUiLanguage } = useSettings();
  const [theme, setTheme] = useState('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
=======
  const { uiLanguage, setUiLanguage, theme, toggleTheme } = useSettings();
  const [isAdmin, setIsAdmin] = useState(false);
>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2

  // Effect to set the initial theme based on system preference
  useEffect(() => {
<<<<<<< HEAD
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
  
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  }

=======
    if (user) {
      checkIsAdmin(user).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

>>>>>>> 2fb7b24f193876ca2e418d16c709a791b34f21a2
  return (
    <header className="bg-card/80 backdrop-blur-sm shadow-md sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs p-4">
               <SheetHeader className="mb-6 text-left">
                  <SheetTitle className="sr-only">Main Menu</SheetTitle>
                  <Logo />
               </SheetHeader>
               <nav className="flex flex-col gap-2">
                 {navItems.map(item => (
                    <NavLink key={item.href} href={item.href} onLinkClick={handleLinkClick}>
                        {item.icon} {item.label}
                    </NavLink>
                 ))}
               </nav>
            </SheetContent>
          </Sheet>
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
             {navItems.map(item => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    "text-muted-foreground hover:text-primary",
                    usePathname().startsWith(item.href) && "text-primary bg-primary/10"
                  )}
                >
                  {item.label}
                </Link>
             ))}
          </nav>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
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
