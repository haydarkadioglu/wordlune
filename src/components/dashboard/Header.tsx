
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, buttonVariants } from '@/components/ui/button';
import { LogOut, Sun, Moon, Cog, Languages, ShieldCheck } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useSettings, SUPPORTED_UI_LANGUAGES } from '@/hooks/useSettings';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { isAdmin as checkIsAdmin } from '@/lib/admin-service';

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
  const { uiLanguage, setUiLanguage, theme, toggleTheme } = useSettings();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkIsAdmin(user).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  return (
    <header className="bg-card/80 backdrop-blur-sm shadow-md sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/dashboard/words">All Words</NavLink>
            <NavLink href="/dashboard/lists">My Lists</NavLink>
            <NavLink href="/dashboard/stories">Stories</NavLink>
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

          {isAdmin && (
             <Link href="/admin" aria-label="Admin Panel" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-accent hover:text-accent/80')}>
                <ShieldCheck className="h-5 w-5" />
            </Link>
          )}

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
